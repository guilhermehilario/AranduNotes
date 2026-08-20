import {
  Injectable,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email/email.service";
import { hashToken } from "../common/utils/token-hash";

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async verifyEmail(token: string): Promise<{ message: string }> {
    this.logger.log(`Iniciando verificação de e-mail com token`);

    const tokenHash = hashToken(token);

    const result = await this.prisma.withConnection(() =>
      this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findFirst({
          where: { verificationToken: tokenHash },
        });

        if (!user) {
          this.logger.warn(
            `Token de verificação inválido: nenhum usuário encontrado`,
          );
          throw new BadRequestException(
            "Token de verificação inválido. Solicite um novo link.",
          );
        }

        if (user.deletedAt) {
          this.logger.warn(
            `Token de verificação inválido para conta excluída: ${user.email} (ID: ${user.id})`,
          );
          throw new BadRequestException(
            "Token de verificação inválido. Solicite um novo link.",
          );
        }

        if (user.emailVerified) {
          this.logger.log(
            `E-mail já verificado anteriormente: ${user.email} (ID: ${user.id})`,
          );
          return {
            message: "E-mail já verificado. Faça login para continuar.",
          };
        }

        if (
          !user.verificationTokenExpires ||
          user.verificationTokenExpires < new Date()
        ) {
          this.logger.warn(
            `Token de verificação expirado para ${user.email} (ID: ${user.id}). Expirava em: ${user.verificationTokenExpires}`,
          );
          throw new BadRequestException(
            "Token de verificação expirado. Solicite um novo link.",
          );
        }

        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            emailVerified: true,
            verificationToken: null,
            verificationTokenExpires: null,
          },
        });

        this.logger.log(
          `✅ E-mail verificado com sucesso: ${updatedUser.email} (ID: ${updatedUser.id}) - emailVerified: ${updatedUser.emailVerified}`,
        );

        return {
          message: "E-mail verificado com sucesso! Faça login para continuar.",
        };
      }),
    );

    return result;
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    this.logger.log(
      `Solicitação de reenvio de verificação para: ${normalizedEmail}`,
    );

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

    const verificationToken = randomBytes(32).toString("hex");
    const verificationTokenHash = hashToken(verificationToken);
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.withConnection(() =>
      this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            verificationToken: verificationTokenHash,
            verificationTokenExpires,
          },
        });
      }),
    );

    this.logger.log(
      `Novo token de verificação salvo para ID: ${user.id}`,
    );

    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.name,
        verificationToken,
      );
    } catch {
      this.logger.error("Falha ao reenviar e-mail de verificação");
      throw new Error("Erro ao enviar e-mail. Tente novamente mais tarde.");
    }

    return {
      message: "Novo link de verificação enviado para seu e-mail.",
    };
  }
}
