import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email/email.service";
import { UserPublic, AuthTokens } from "./auth.types";
import { stripPassword, validateEmail, validatePassword, SALT_ROUNDS } from "./auth.utils";

@Injectable()
export class AuthCoreService {
  private readonly logger = new Logger(AuthCoreService.name);
  private readonly refreshSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    // 🔐 SEC-003: ConfigService injetado — segredos devem vir do ConfigModule
    // (mesmo padrão usado pelo JwtModule para JWT_SECRET), não do process.env direto.
    private readonly configService: ConfigService,
  ) {
    this.refreshSecret =
      this.configService.get<string>("REFRESH_SECRET") ||
      (process.env.NODE_ENV === "production"
        ? (() => {
            throw new Error("REFRESH_SECRET é obrigatório em produção");
          })()
        : "dev-refresh-secret");
  }

  generateTokens(userId: string): AuthTokens {
    const accessToken = this.jwtService.sign({ userId });
    const refreshToken = this.jwtService.sign(
      { userId },
      { secret: this.refreshSecret, expiresIn: "7d" },
    );
    return { accessToken, refreshToken };
  }

  async register(
    name: string,
    email: string,
    password: string,
    acceptedTerms: boolean,
  ): Promise<{ message: string; email: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!validateEmail(normalizedEmail)) {
      throw new UnauthorizedException("Formato de e-mail inválido");
    }

    if (!validatePassword(password)) {
      throw new UnauthorizedException(
        `A senha deve ter no mínimo 8 caracteres`,
      );
    }

    if (!acceptedTerms) {
      throw new BadRequestException(
        "Você deve aceitar os Termos de Uso e Responsabilidade para criar uma conta.",
      );
    }

    const existing = await this.prisma.withConnection(() =>
      this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      }),
    );
    if (existing) {
      throw new ConflictException("E-mail já cadastrado");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;

    const smtpConfigured = this.emailService.isSmtpConfigured;
    const emailVerified = !smtpConfigured;
    const verificationToken = smtpConfigured ? uuidv4() : null;
    const verificationTokenExpires = smtpConfigured
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : null;

    await this.prisma.withConnection(() =>
      this.prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          avatarUrl,
          emailVerified,
          verificationToken,
          verificationTokenExpires,
          acceptedTerms: true,
          acceptedTermsAt: new Date(),
        },
      }),
    );

    if (smtpConfigured) {
      try {
        await this.emailService.sendVerificationEmail(
          normalizedEmail,
          name,
          verificationToken!,
        );
        return {
          message:
            "Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro.",
          email: normalizedEmail,
        };
      } catch (error) {
        const err = error as Error;
        this.logger.error(
          `Falha ao enviar e-mail de verificação para ${normalizedEmail}. Conta criada sem verificação. ${err.message}`,
        );

        const isDev = process.env.NODE_ENV === "development";
        if (isDev) {
          this.logger.warn(
            `DEV: Auto-verificando ${normalizedEmail} porque o e-mail falhou ao ser enviado.`,
          );
          await this.prisma.withConnection(() =>
            this.prisma.user.update({
              where: { email: normalizedEmail },
              data: {
                emailVerified: true,
                verificationToken: null,
                verificationTokenExpires: null,
              },
            }),
          );
          return {
            message:
              "Conta criada com sucesso! (Modo desenvolvimento: e-mail auto-verificado)",
            email: normalizedEmail,
          };
        }

        const isTimeout =
          err.message?.includes("timeout") ||
          err.message?.includes("ETIMEDOUT");
        if (isTimeout && !isDev) {
          this.logger.warn(
            `TIMEOUT SMTP ao enviar e-mail para ${normalizedEmail}. A conta foi criada mas a verificação falhou.`,
          );
        }
      }

      return {
        message:
          "Conta criada, mas não foi possível enviar o e-mail de verificação. " +
          "O servidor SMTP não respondeu a tempo. Tente novamente mais tarde ou use a opção " +
          '"Reenviar verificação" na tela de login.',
        email: normalizedEmail,
      };
    }

    this.logger.log(
      `Usuário ${normalizedEmail} registrado com email auto-verificado (SMTP não configurado).`,
    );
    return {
      message: "Conta criada com sucesso! Você já pode fazer login.",
      email: normalizedEmail,
    };
  }

  async login(
    email: string,
    password: string,
    existingRefreshToken?: string,
  ): Promise<{ user: UserPublic; accessToken: string; refreshToken: string }> {
    const sanitizedEmail = email.trim().toLowerCase();

    if (existingRefreshToken) {
      try {
        const decoded = this.jwtService.verify(existingRefreshToken, {
          secret: this.refreshSecret,
        }) as { userId: string };

        const user = await this.prisma.withConnection(() =>
          this.prisma.user.findUnique({
            where: { id: decoded.userId },
          }),
        );

        if (user && !user.deletedAt) {
          this.logger.log(
            `Auto-login para ${user.email} (ID: ${user.id}) — refresh token válido existente.`,
          );
          const tokens = this.generateTokens(user.id);
          return { user: stripPassword(user), ...tokens };
        }
      } catch {
        // Token inválido ou expirado → permite login normalmente
      }
    }

    try {
      const user = await this.prisma.withConnection(() =>
        this.prisma.user.findUnique({
          where: { email: sanitizedEmail },
        }),
      );

      let isPasswordValid = false;

      if (user) {
        isPasswordValid = await bcrypt.compare(password, user.password);
        this.logger.debug(
          `Login attempt for ${sanitizedEmail}: password valid = ${isPasswordValid}`,
        );

        if (!isPasswordValid && !user.password.startsWith("$2")) {
          this.logger.debug(
            `Plain-text password migration check for ${user.email}`,
          );
          if (password === user.password) {
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            await this.prisma.withConnection(() =>
              this.prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
              }),
            );
            isPasswordValid = true;
            this.logger.log(
              `Senha do usuário ${user.email} migrada de texto puro para bcrypt.`,
            );
          }
        }
      }

      if (!user || !isPasswordValid) {
        this.logger.warn(
          `[LOGIN] Falha para ${sanitizedEmail}: ${
            !user
              ? "usuário não encontrado no banco"
              : "senha inválida (bcrypt.compare retornou false)"
          }` +
            (user ? ` | hash prefix: ${user.password.substring(0, 6)}...` : ""),
        );

        throw new UnauthorizedException("E-mail ou senha incorretos");
      }

      if (user.deletedAt) {
        throw new UnauthorizedException(
          "Esta conta foi excluída. Não é possível fazer login.",
        );
      }

      const smtpConfigured = this.emailService.isSmtpConfigured;
      if (smtpConfigured && !user.emailVerified) {
        throw new UnauthorizedException(
          "E-mail não verificado. Por favor, confira sua caixa de entrada.",
        );
      }

      const tokens = this.generateTokens(user.id);
      return { user: stripPassword(user), ...tokens };
    } catch (error) {
      const errMsg = (error as Error).message?.toLowerCase() || "";
      const isConnectionError =
        errMsg.includes("connection") ||
        errMsg.includes("timeout") ||
        errMsg.includes("database") ||
        errMsg.includes("pool");

      if (isConnectionError) {
        this.logger.error(
          `[LOGIN] Erro de conexão ao banco: ${(error as Error).message}`,
        );
        throw new UnauthorizedException(
          "O serviço de autenticação está temporariamente indisponível. " +
            "O servidor pode estar inicializando. Tente novamente em alguns instantes.",
        );
      }

      throw error;
    }
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.refreshSecret,
      }) as { userId: string };

      const user = await this.prisma.withConnection(() =>
        this.prisma.user.findUnique({
          where: { id: decoded.userId },
        }),
      );

      if (!user) {
        throw new UnauthorizedException("Usuário não encontrado");
      }

      if (user.deletedAt) {
        throw new UnauthorizedException("Usuário não encontrado");
      }

      const smtpConfigured = this.emailService.isSmtpConfigured;
      if (smtpConfigured && !user.emailVerified) {
        throw new UnauthorizedException(
          "E-mail não verificado. Por favor, confira sua caixa de entrada.",
        );
      }
      return this.generateTokens(user.id);
    } catch {
      throw new UnauthorizedException("Refresh token inválido ou expirado");
    }
  }

  async validateUser(userId: string): Promise<UserPublic | null> {
    const user = await this.prisma.withConnection(() =>
      this.prisma.user.findUnique({
        where: { id: userId },
      }),
    );
    if (!user) return null;
    if (user.deletedAt) return null;
    return stripPassword(user);
  }
}
