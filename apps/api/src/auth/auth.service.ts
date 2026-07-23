import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email/email.service";

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {
    this.refreshSecret =
      process.env.REFRESH_SECRET ||
      (process.env.NODE_ENV === "production"
        ? (() => {
            throw new Error("REFRESH_SECRET é obrigatório em produção");
          })()
        : "dev-refresh-secret");
  }

  private stripPassword(user: {
    id: string;
    name: string;
    email: string;
    password: string;
    avatarUrl: string;
    emailVerified: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserPublic {
    const { password: _, deletedAt: __, ...rest } = user;
    return rest;
  }

  private generateTokens(userId: string): AuthTokens {
    const accessToken = this.jwtService.sign({ userId });
    const refreshToken = this.jwtService.sign(
      { userId },
      { secret: this.refreshSecret, expiresIn: "7d" },
    );
    return { accessToken, refreshToken };
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePassword(password: string): boolean {
    return password.length >= MIN_PASSWORD_LENGTH;
  }

  async register(
    name: string,
    email: string,
    password: string,
    acceptedTerms: boolean,
  ): Promise<{ message: string; email: string }> {
    // Normaliza: trim + lowercase para evitar espaços acidentais
    const normalizedEmail = email.trim().toLowerCase();

    if (!this.validateEmail(normalizedEmail)) {
      throw new UnauthorizedException("Formato de e-mail inválido");
    }

    if (!this.validatePassword(password)) {
      throw new UnauthorizedException(
        `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres`,
      );
    }

    // A validação do DTO com @Equals(true) já garante que acceptedTerms é true,
    // mas fazemos uma dupla verificação aqui por segurança.
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

    // Se SMTP não estiver configurado, auto-verifica o email (não faz sentido exigir
    // verificação se o servidor não consegue enviar emails).
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

        // Fallback para desenvolvimento: se o email não foi enviado,
        // auto-verificamos o usuário para evitar deadlock.
        // Em produção, o usuário deve usar "Reenviar verificação".
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

        // Se for timeout, inclui info no log
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

    // Se o cookie de refresh existe e é válido, o usuário já possui sessão ativa.
    // Isso impede login duplicado mesmo se o frontend deixar passar.
    if (existingRefreshToken) {
      try {
        this.jwtService.verify(existingRefreshToken, {
          secret: this.refreshSecret,
        });
        throw new ConflictException(
          "Você já está logado. Faça logout primeiro se quiser acessar outra conta.",
        );
      } catch (error) {
        // Se for o ConflictException que acabamos de lançar, propaga
        if (error instanceof ConflictException) throw error;
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
        // Tenta comparacao com bcrypt (senhas ja hashadas — usuarios novos)
        isPasswordValid = await bcrypt.compare(password, user.password);
        console.log("debug: ", {
          isPasswordValid,
        });
        // Fallback para senhas em texto puro migradas do db.json antigo
        // O sistema antigo (Express) armazenava senhas sem hash.
        // Quando detectamos texto puro, comparamos diretamente e, se bater,
        // fazemos o re-hash imediato para bcrypt.
        if (!isPasswordValid && !user.password.startsWith("$2")) {
          console.log("debug2", {
            password,
            user: user.password,
          });
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
        console.log("debug3", {
          isPasswordValid,
          user: user?.password,
          password,
        });
        // ── LOG DIAGNÓSTICO SEGURO ──
        // NÃO loga senha, hash, ou token.
        // Apenas identifica se o problema é usuário inexistente ou senha inválida.
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

      // Se SMTP não estiver configurado, pula a verificação de email
      // (o email foi auto-verificado no registro ou é um usuário migrado).
      const smtpConfigured = this.emailService.isSmtpConfigured;
      if (smtpConfigured && !user.emailVerified) {
        throw new UnauthorizedException(
          "E-mail não verificado. Por favor, confira sua caixa de entrada.",
        );
      }

      const tokens = this.generateTokens(user.id);
      return { user: this.stripPassword(user), ...tokens };
    } catch (error) {
      // Se for erro de conexão, loga e retorna mensagem amigável
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

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.withConnection(() =>
      this.prisma.user.findFirst({
        where: { verificationToken: token },
      }),
    );

    if (!user) {
      throw new BadRequestException(
        "Token de verificação inválido. Solicite um novo link.",
      );
    }

    if (user.deletedAt) {
      throw new BadRequestException(
        "Token de verificação inválido. Solicite um novo link.",
      );
    }

    if (user.emailVerified) {
      return { message: "E-mail já verificado. Faça login para continuar." };
    }

    if (
      !user.verificationTokenExpires ||
      user.verificationTokenExpires < new Date()
    ) {
      throw new BadRequestException(
        "Token de verificação expirado. Solicite um novo link.",
      );
    }

    await this.prisma.withConnection(() =>
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpires: null,
        },
      }),
    );

    return {
      message: "E-mail verificado com sucesso! Faça login para continuar.",
    };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.withConnection(() =>
      this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      }),
    );

    if (!user) {
      return {
        message:
          "Se o e-mail estiver cadastrado, um novo link de verificação será enviado.",
      };
    }

    // Contas excluídas não devem receber e-mails de verificação
    if (user.deletedAt) {
      return {
        message:
          "Se o e-mail estiver cadastrado, um novo link de verificação será enviado.",
      };
    }

    if (user.emailVerified) {
      return {
        message: "Este e-mail já foi verificado. Faça login para continuar.",
      };
    }

    const verificationToken = uuidv4();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.withConnection(() =>
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken,
          verificationTokenExpires,
        },
      }),
    );

    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.name,
        verificationToken,
      );
    } catch (error) {
      this.logger.error("Falha ao reenviar e-mail de verificação");
      throw new Error("Erro ao enviar e-mail. Tente novamente mais tarde.");
    }

    return {
      message: "Novo link de verificação enviado para seu e-mail.",
    };
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

      // Se SMTP não estiver configurado, pula a verificação de email
      const smtpConfigured = this.emailService.isSmtpConfigured;
      if (smtpConfigured && !user.emailVerified) {
        throw new UnauthorizedException(
          "E-mail não verificado. Por favor, confira sua caixa de entrada.",
        );
      }

      const accessToken = this.jwtService.sign({ userId: user.id });
      const newRefreshToken = this.jwtService.sign(
        { userId: user.id },
        { secret: this.refreshSecret, expiresIn: "7d" },
      );

      return { accessToken, refreshToken: newRefreshToken };
    } catch {
      throw new UnauthorizedException("Refresh token inválido ou expirado");
    }
  }

  async getProfile(userId: string): Promise<UserPublic> {
    const user = await this.prisma.withConnection(() =>
      this.prisma.user.findUnique({
        where: { id: userId },
      }),
    );

    if (!user) {
      throw new UnauthorizedException("Usuário não encontrado");
    }

    if (user.deletedAt) {
      throw new UnauthorizedException("Usuário não encontrado");
    }

    // Se SMTP não estiver configurado, pula a verificação de email
    const smtpConfigured = this.emailService.isSmtpConfigured;
    if (smtpConfigured && !user.emailVerified) {
      throw new UnauthorizedException(
        "E-mail não verificado. Por favor, confira sua caixa de entrada.",
      );
    }

    return this.stripPassword(user);
  }

  async validateUser(userId: string): Promise<UserPublic | null> {
    const user = await this.prisma.withConnection(() =>
      this.prisma.user.findUnique({
        where: { id: userId },
      }),
    );
    if (!user) return null;
    if (user.deletedAt) return null;
    return this.stripPassword(user);
  }

  async updateProfile(
    userId: string,
    data: { name?: string; avatarUrl?: string },
  ): Promise<UserPublic> {
    const user = await this.prisma.withConnection(() =>
      this.prisma.user.findUnique({
        where: { id: userId },
      }),
    );
    if (!user) throw new UnauthorizedException("Usuário não encontrado");

    const updated = await this.prisma.withConnection(() =>
      this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        },
      }),
    );

    return this.stripPassword(updated);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    if (!this.validatePassword(newPassword)) {
      throw new UnauthorizedException(
        `A nova senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres`,
      );
    }

    const user = await this.prisma.withConnection(() =>
      this.prisma.user.findUnique({
        where: { id: userId },
      }),
    );
    if (!user) throw new UnauthorizedException("Usuário não encontrado");

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Senha atual incorreta");
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.withConnection(() =>
      this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      }),
    );

    return { message: "Senha alterada com sucesso" };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.withConnection(() =>
      this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      }),
    );

    if (!user) {
      return {
        message:
          "Se o e-mail estiver cadastrado, enviaremos um link de recuperação.",
      };
    }

    // Contas excluídas não devem receber e-mails de recuperação
    if (user.deletedAt) {
      return {
        message:
          "Se o e-mail estiver cadastrado, enviaremos um link de recuperação.",
      };
    }

    const resetToken = uuidv4();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.withConnection(() =>
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordTokenExpires: resetTokenExpires,
        },
      }),
    );

    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        user.name,
        resetToken,
      );
    } catch (error) {
      // Não lançamos erro para não vazar informação sobre a existência do e-mail
      // (segurança: sempre retornar a mesma mensagem, evitando enumeração de usuários).
      // Remove o token do banco para não deixar token órfão.
      const err = error as Error;
      this.logger.error(
        `Falha ao enviar e-mail de recuperação para ${email}: ${err.message}`,
      );
      await this.prisma.withConnection(() =>
        this.prisma.user.update({
          where: { id: user.id },
          data: {
            resetPasswordToken: null,
            resetPasswordTokenExpires: null,
          },
        }),
      );
    }

    return {
      message:
        "Se o e-mail estiver cadastrado, enviaremos um link de recuperação.",
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.withConnection(() =>
      this.prisma.user.findFirst({
        where: { resetPasswordToken: token },
      }),
    );

    if (!user) {
      throw new BadRequestException(
        "Token de recuperação inválido. Solicite um novo link.",
      );
    }

    // Contas excluídas não podem redefinir senha
    if (user.deletedAt) {
      throw new BadRequestException(
        "Token de recuperação inválido. Solicite um novo link.",
      );
    }

    if (
      !user.resetPasswordTokenExpires ||
      user.resetPasswordTokenExpires < new Date()
    ) {
      throw new BadRequestException(
        "Token de recuperação expirado. Solicite um novo link.",
      );
    }

    if (!this.validatePassword(newPassword)) {
      throw new BadRequestException(
        `A nova senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres`,
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prisma.withConnection(() =>
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordTokenExpires: null,
        },
      }),
    );

    return {
      message: "Senha redefinida com sucesso! Faça login com sua nova senha.",
    };
  }

  async sendDeleteConfirmation(
    userId: string,
  ): Promise<{ message: string; token: string; code?: string }> {
    const user = await this.prisma.withConnection(() =>
      this.prisma.user.findUnique({
        where: { id: userId },
      }),
    );
    if (!user) throw new NotFoundException("Usuário não encontrado");

    if (user.deletedAt) throw new NotFoundException("Usuário não encontrado");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = this.jwtService.sign(
      { userId, code, purpose: "delete-account" },
      { expiresIn: "15m" },
    );

    const smtpConfigured = this.emailService.isSmtpConfigured;

    if (smtpConfigured) {
      await this.emailService.sendDeleteConfirmationEmail(
        user.email,
        user.name,
        code,
      );
      return {
        message:
          "E-mail de confirmação enviado. Verifique sua caixa de entrada.",
        token,
      };
    }

    // SMTP não configurado — retorna o código diretamente para exibição na tela
    this.logger.log(`[DEV] Código de exclusão para ${user.email}: ${code}`);
    return {
      message: "Código de confirmação gerado (modo desenvolvimento).",
      token,
      code,
    };
  }

  async confirmDeleteAccount(
    token: string,
    code: string,
  ): Promise<{ message: string }> {
    let payload: { userId: string; code: string; purpose: string };
    try {
      payload = this.jwtService.verify(token) as {
        userId: string;
        code: string;
        purpose: string;
      };
    } catch {
      throw new BadRequestException(
        "Token inválido ou expirado. Solicite um novo código.",
      );
    }

    if (payload.purpose !== "delete-account") {
      throw new BadRequestException("Token inválido para esta operação.");
    }

    if (payload.code !== code) {
      throw new BadRequestException("Código de confirmação incorreto.");
    }

    const user = await this.prisma.withConnection(() =>
      this.prisma.user.findUnique({
        where: { id: payload.userId },
      }),
    );
    if (!user) throw new NotFoundException("Usuário não encontrado");

    await this.prisma.withConnection(() =>
      this.prisma.user.update({
        where: { id: payload.userId },
        data: { deletedAt: new Date() },
      }),
    );

    return { message: "Conta excluída permanentemente" };
  }
}
