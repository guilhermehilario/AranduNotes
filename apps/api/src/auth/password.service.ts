import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email/email.service";
import { hashToken } from "../common/utils/token-hash";
import { validatePassword, SALT_ROUNDS } from "./auth.utils";

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    if (!validatePassword(newPassword)) {
      throw new UnauthorizedException(
        `A nova senha deve ter no mínimo 8 caracteres`,
      );
    }

    this.logger.log(`Solicitação de alteração de senha: ${userId}`);

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
      this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });

        // 🔐 CRIT-2: Revoga TODOS os refresh tokens do usuário (logout total)
        await tx.refreshToken.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }),
    );

    this.logger.log(`✅ Senha alterada com sucesso para usuário ${userId}`);

    return { message: "Senha alterada com sucesso" };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    this.logger.log(
      `Solicitação de recuperação de senha para: ${normalizedEmail}`,
    );

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

    if (user.deletedAt) {
      return {
        message:
          "Se o e-mail estiver cadastrado, enviaremos um link de recuperação.",
      };
    }

    const resetToken = randomBytes(32).toString("hex");
    const resetTokenHash = hashToken(resetToken);
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.withConnection(() =>
      this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            resetPasswordToken: resetTokenHash,
            resetPasswordTokenExpires: resetTokenExpires,
          },
        });
      }),
    );

    this.logger.log(`Token de reset salvo para ID: ${user.id}`);

    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        user.name,
        resetToken,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Falha ao enviar e-mail de recuperação para ${email}: ${err.message}`,
      );
      await this.prisma.withConnection(() =>
        this.prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: user.id },
            data: {
              resetPasswordToken: null,
              resetPasswordTokenExpires: null,
            },
          });
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
    this.logger.log(`Iniciando redefinição de senha com token`);

    if (!validatePassword(newPassword)) {
      throw new BadRequestException(
        `A nova senha deve ter no mínimo 8 caracteres`,
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const tokenHash = hashToken(token);

    const result = await this.prisma.withConnection(() =>
      this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findFirst({
          where: { resetPasswordToken: tokenHash },
        });

        if (!user) {
          this.logger.warn(
            `Token de recuperação inválido: nenhum usuário encontrado`,
          );
          throw new BadRequestException(
            "Token de recuperação inválido. Solicite um novo link.",
          );
        }

        if (user.deletedAt) {
          this.logger.warn(
            `Token de recuperação para conta excluída: ${user.email} (ID: ${user.id})`,
          );
          throw new BadRequestException(
            "Token de recuperação inválido. Solicite um novo link.",
          );
        }

        if (
          !user.resetPasswordTokenExpires ||
          user.resetPasswordTokenExpires < new Date()
        ) {
          this.logger.warn(
            `Token de recuperação expirado para ${user.email} (ID: ${user.id}). Expirava em: ${user.resetPasswordTokenExpires}`,
          );
          throw new BadRequestException(
            "Token de recuperação expirado. Solicite um novo link.",
          );
        }

        await tx.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordTokenExpires: null,
          },
        });

        // 🔐 CRIT-2: Revoga TODOS os refresh tokens do usuário (logout total)
        await tx.refreshToken.updateMany({
          where: { userId: user.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });

        this.logger.log(
          `✅ Senha redefinida com sucesso para ${user.email} (ID: ${user.id})`,
        );

        return {
          message:
            "Senha redefinida com sucesso! Faça login com sua nova senha.",
        };
      }),
    );

    return result;
  }
}
