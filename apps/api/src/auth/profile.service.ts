import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email/email.service";
import { UserPublic } from "./auth.types";
import { stripPassword } from "./auth.utils";

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

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

    const smtpConfigured = this.emailService.isSmtpConfigured;
    if (smtpConfigured && !user.emailVerified) {
      throw new UnauthorizedException(
        "E-mail não verificado. Por favor, confira sua caixa de entrada.",
      );
    }

    return stripPassword(user);
  }

  async updateProfile(
    userId: string,
    data: { name?: string; avatarUrl?: string; theme?: string },
  ): Promise<UserPublic> {
    if (data.theme !== undefined && !["light", "dark", "system"].includes(data.theme)) {
      throw new BadRequestException(
        "Tema inválido. Use 'light', 'dark' ou 'system'.",
      );
    }

    // 🔐 SEC: Valida avatarUrl — comprimento máximo e formato permitido
    if (data.avatarUrl !== undefined) {
      if (data.avatarUrl.length > 500) {
        throw new BadRequestException("URL do avatar excede o limite de 500 caracteres.");
      }
      if (data.avatarUrl && !/^https:\/\/api\.dicebear\.com\/.+/.test(data.avatarUrl) && data.avatarUrl !== "") {
        throw new BadRequestException("URL do avatar inválida. Use o formato do DiceBear.");
      }
    }

    const result = await this.prisma.withConnection(() =>
      this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new UnauthorizedException("Usuário não encontrado");
        }

        const updated = await tx.user.update({
          where: { id: userId },
          data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
            ...(data.theme !== undefined && { theme: data.theme }),
          },
        });

        this.logger.log(
          `Perfil atualizado: ${user.email} (ID: ${user.id}) - name: ${data.name !== undefined ? "alterado" : "mantido"}, avatarUrl: ${data.avatarUrl !== undefined ? "alterado" : "mantido"}, theme: ${data.theme !== undefined ? "alterado" : "mantido"}`,
        );

        return stripPassword(updated);
      }),
    );

    return result;
  }
}
