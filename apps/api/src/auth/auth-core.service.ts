import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "node:crypto";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email/email.service";
import { hashToken } from "../common/utils/token-hash";
import { UserPublic, AuthTokens } from "./auth.types";
import { stripPassword, validateEmail, validatePassword, SALT_ROUNDS } from "./auth.utils";

/** Vida útil do refresh token (7 dias — mesmo valor do JWT) */
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * 🔐 SHA-256 do refresh token.
 * Apenas o hash é persistido no banco — um vazamento do banco não expõe
 * tokens utilizáveis (o JWT original não pode ser reconstruído a partir do hash).
 */
function hashRefreshToken(token: string): string {
  return hashToken(token);
}

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
    this.refreshSecret = this.configService.getOrThrow<string>("REFRESH_SECRET");
  }

  /**
   * Emite um par de tokens (access + refresh) e registra o refresh token no
   * banco (hash apenas). Se `revokeRecordId` for informado, o token antigo é
   * revogado atomicamente — rotação de refresh token.
   */
  private async issueRefreshTokenPair(
    userId: string,
    revokeRecordId?: string,
  ): Promise<AuthTokens> {
    const accessToken = this.jwtService.sign({ userId });
    // 🆔 jti (JWT ID): JWTs são determinísticos — dois tokens assinados no mesmo
    // segundo para o mesmo usuário seriam IDÊNTICOS, colidindo na constraint
    // única de tokenHash e quebrando a rotação. O jti único garante que cada
    // refresh token emitido seja distinto.
    const refreshToken = this.jwtService.sign(
      { userId, jti: uuidv4() },
      { secret: this.refreshSecret, expiresIn: "7d" },
    );
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.prisma.withConnection(() =>
      this.prisma.$transaction(async (tx) => {
        // Limpeza oportunista: tokens expirados são inúteis (mantém a tabela enxuta)
        await tx.refreshToken.deleteMany({
          where: { expiresAt: { lt: new Date() } },
        });

        const created = await tx.refreshToken.create({
          data: { userId, tokenHash, expiresAt },
        });

        if (revokeRecordId) {
          // 🔄 Rotação: revoga o token antigo e registra a substituição
          await tx.refreshToken.update({
            where: { id: revokeRecordId },
            data: { revokedAt: new Date(), replacedByTokenId: created.id },
          });
        }
      }),
    );

    return { accessToken, refreshToken };
  }

  async generateTokens(userId: string): Promise<AuthTokens> {
    return this.issueRefreshTokenPair(userId);
  }

  /**
   * Revoga um refresh token no servidor (logout).
   * A assinatura JWT não é verificada de propósito — um token desconhecido
   * simplesmente não casa com nenhum registro (updateMany no-op).
   */
   async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;
    await this.prisma.withConnection(() =>
      this.prisma.refreshToken.updateMany({
        where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    );
  }

  /** 🔐 MÉDIO-19: Revoga TODOS os refresh tokens do usuário (logout de todos os dispositivos) */
  async logoutAll(userId: string): Promise<void> {
    await this.prisma.withConnection(() =>
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    );
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
    const verificationTokenRaw = smtpConfigured ? randomBytes(32).toString("hex") : null;
    const verificationToken = verificationTokenRaw ? hashToken(verificationTokenRaw) : null;
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
          verificationTokenRaw!,
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

        // 🔐 Rotação: só auto-login se o token ainda estiver ATIVO no servidor
        // (emitido por nós e não revogado). Um token já rotacionado cai no
        // fluxo de login normal com credenciais.
        const record = await this.prisma.withConnection(() =>
          this.prisma.refreshToken.findUnique({
            where: { tokenHash: hashRefreshToken(existingRefreshToken) },
          }),
        );

        // Obs.: token revogado/rotacionado aqui NÃO encerra a família (diferente
        // do refresh) — o fluxo cai para o login com credenciais, que é mais
        // seguro do que rejeitar sem conferir senha.
        if (
          record &&
          !record.revokedAt &&
          record.expiresAt.getTime() > Date.now()
        ) {
          const user = await this.prisma.withConnection(() =>
            this.prisma.user.findUnique({
              where: { id: decoded.userId },
            }),
          );

          if (user && !user.deletedAt) {
            this.logger.log(
              `Auto-login para ${user.email} (ID: ${user.id}) — refresh token válido existente.`,
            );
            // Rotaciona: revoga o token usado e emite um novo par
            const tokens = await this.issueRefreshTokenPair(user.id, record.id);
            return { user: stripPassword(user), ...tokens };
          }
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

      // 🔐 MÉDIO-17: Verificar lockout ANTES de verificar senha
      if (user && user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingMs = user.lockedUntil.getTime() - Date.now();
        const remainingMin = Math.ceil(remainingMs / 60000);
        this.logger.warn(`[LOGIN] Conta bloqueada: ${sanitizedEmail} (restam ~${remainingMin}min)`);
        throw new UnauthorizedException(
          `Conta temporariamente bloqueada. Tente novamente em ${remainingMin} minuto(s).`,
        );
      }

      let isPasswordValid = false;

      if (user) {
        isPasswordValid = await bcrypt.compare(password, user.password);
      }

      if (!user || !isPasswordValid) {
        // 🔐 MÉDIO-17: Incrementar contador de falhas e aplicar lockout progressivo
        if (user && !user.deletedAt) {
          const attempts = (user.failedLoginAttempts || 0) + 1;
          const MAX_ATTEMPTS = 5;
          let lockedUntil: Date | null = null;

          if (attempts >= MAX_ATTEMPTS) {
            // Lockout progressivo: 1min → 5min → 15min
            const lockoutMinutes = attempts <= 7 ? 1 : attempts <= 10 ? 5 : 15;
            lockedUntil = new Date(Date.now() + lockoutMinutes * 60000);
          }

          await this.prisma.withConnection(() =>
            this.prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: attempts,
                ...(lockedUntil ? { lockedUntil } : {}),
              },
            }),
          );
        }

        this.logger.warn(
          `[LOGIN] Falha de autenticação para ${sanitizedEmail}`,
        );

        throw new UnauthorizedException("E-mail ou senha incorretos");
      }

      // 🔐 MÉDIO-17: Login bem-sucedido — reseta contador e lockout
      if (user.failedLoginAttempts > 0 || user.lockedUntil) {
        await this.prisma.withConnection(() =>
          this.prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          }),
        );
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

      const tokens = await this.generateTokens(user.id);
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
    let decoded: { userId: string };
    try {
      decoded = this.jwtService.verify(refreshToken, {
        secret: this.refreshSecret,
      }) as { userId: string };
    } catch {
      throw new UnauthorizedException("Refresh token inválido ou expirado");
    }

    // 🔐 Rotação: o token precisa existir no banco (emitido por nós)
    const record = await this.prisma.withConnection(() =>
      this.prisma.refreshToken.findUnique({
        where: { tokenHash: hashRefreshToken(refreshToken) },
      }),
    );

    if (!record) {
      throw new UnauthorizedException("Refresh token inválido ou expirado");
    }

    if (record.revokedAt) {
      // 🚨 Reuso de token já rotacionado/revogado → encerra TODA a família de
      // tokens do usuário (OWASP: família terminada em caso de reuso). Isso
      // invalida também qualquer token roubado junto com o legítimo.
      await this.prisma.withConnection(() =>
        this.prisma.refreshToken.updateMany({
          where: { userId: record.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
      );
      this.logger.warn(
        `[SEC] Reuso de refresh token detectado — sessões do usuário ${record.userId} revogadas.`,
      );
      throw new UnauthorizedException("Refresh token inválido ou expirado");
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      await this.prisma.withConnection(() =>
        this.prisma.refreshToken.update({
          where: { id: record.id },
          data: { revokedAt: new Date() },
        }),
      );
      throw new UnauthorizedException("Refresh token inválido ou expirado");
    }

    const user = await this.prisma.withConnection(() =>
      this.prisma.user.findUnique({
        where: { id: decoded.userId },
      }),
    );

    if (!user || user.deletedAt) {
      throw new UnauthorizedException("Usuário não encontrado");
    }

    const smtpConfigured = this.emailService.isSmtpConfigured;
    if (smtpConfigured && !user.emailVerified) {
      throw new UnauthorizedException(
        "E-mail não verificado. Por favor, confira sua caixa de entrada.",
      );
    }

    // ✅ Válido → rotaciona (revoga o token atual e emite novos)
    return this.issueRefreshTokenPair(decoded.userId, record.id);
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
