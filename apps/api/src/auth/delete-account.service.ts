import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { randomInt } from "node:crypto";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email/email.service";

@Injectable()
export class DeleteAccountService {
  private readonly logger = new Logger(DeleteAccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

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

    // 🔐 CRIT-5: Usar CSPRNG em vez de Math.random()
    const code = randomInt(100000, 1000000).toString();
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
    authenticatedUserId: string,
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

    // 🔐 SEC: Verifica que o token pertence ao usuário autenticado
    if (payload.userId !== authenticatedUserId) {
      throw new BadRequestException("Token inválido para esta operação.");
    }

    // 🔐 CRIT-5: Comparação constant-time para evitar timing attack
    const codeBuffer = Buffer.from(payload.code);
    const inputBuffer = Buffer.from(code);
    if (
      codeBuffer.length !== inputBuffer.length ||
      !require("node:crypto").timingSafeEqual(codeBuffer, inputBuffer)
    ) {
      throw new BadRequestException("Código de confirmação incorreto.");
    }

    this.logger.log(`Confirmação de exclusão de conta: ${payload.userId}`);

    await this.prisma.withConnection(() =>
      this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: payload.userId },
        });

        if (!user) {
          throw new NotFoundException("Usuário não encontrado");
        }

        // 🔐 CRIT-4: Anonimizar dados PII antes de soft-delete
        const anonymousSuffix = randomInt(100000, 999999).toString();
        await tx.user.update({
          where: { id: payload.userId },
          data: {
            deletedAt: new Date(),
            name: "Usuário excluído",
            email: `deleted-${anonymousSuffix}@removed.local`,
            password: "DELETED",
            avatarUrl: "",
            resetPasswordToken: null,
            resetPasswordTokenExpires: null,
            verificationToken: null,
            verificationTokenExpires: null,
          },
        });

        // 🔐 Remove todos os refresh tokens da conta excluída (logout total)
        await tx.refreshToken.deleteMany({
          where: { userId: payload.userId },
        });

        this.logger.log(
          `✅ Conta excluída (PII anonimizado): ID ${user.id}`,
        );
      }),
    );

    return { message: "Conta excluída com sucesso. Seus dados foram anonimizados." };
  }
}
