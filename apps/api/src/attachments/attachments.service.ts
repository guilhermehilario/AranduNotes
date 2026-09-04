import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SharingService } from "../sharing/sharing.service";

/** Tamanho máximo de arquivo: 10 MB */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Tipos permitidos: texto, imagem e áudio (sem SVG por risco de XSS). */
export const ALLOWED_MIME_TYPES = new Set<string>([
  // ── Texto / documentos ──
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // ── Imagens ──
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // ── Áudio ──
  "audio/mpeg",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/flac",
]);

export interface AttachmentFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sharing: SharingService,
  ) {}

  private assertValidFile(file: AttachmentFile) {
    if (!file || !file.buffer) {
      throw new BadRequestException("Nenhum arquivo enviado");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        "Arquivo muito grande. O limite é de 5 MB por arquivo.",
      );
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        "Tipo de arquivo não permitido. Envie apenas imagens, áudios ou arquivos de texto (até 5 MB).",
      );
    }
  }

  async upload(
    leafId: string,
    userId: string,
    file: AttachmentFile,
  ): Promise<unknown> {
    // O usuário precisa ver a folha (respeita escopo) e ter capacidade de upload.
    await this.sharing.getVisibleContext(userId, "leaf", leafId);
    await this.sharing.assertCanUploadFiles(userId, "leaf", leafId);
    this.assertValidFile(file);

    const attachment = await this.prisma.withConnection(() =>
      this.prisma.leafAttachment.create({
        data: {
          leafId,
          uploadedBy: userId,
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          // Prisma 7 (Bytes tipado como Uint8Array<ArrayBuffer>) não aceita
          // Buffer<ArrayBufferLike> diretamente.
          data: file.buffer as unknown as Uint8Array<ArrayBuffer>,
        },
      }),
    );

    return this.serialize(attachment);
  }

  async list(leafId: string, userId: string): Promise<unknown[]> {
    await this.sharing.getVisibleContext(userId, "leaf", leafId);

    const attachments = await this.prisma.withConnection(() =>
      this.prisma.leafAttachment.findMany({
        where: { leafId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          leafId: true,
          fileName: true,
          mimeType: true,
          size: true,
          createdAt: true,
        },
      }),
    );

    return attachments.map((a) => ({
      id: a.id,
      leafId: a.leafId,
      fileName: a.fileName,
      mimeType: a.mimeType,
      size: a.size,
      createdAt: a.createdAt,
    }));
  }

  async getOne(leafId: string, attachmentId: string, userId: string) {
    await this.sharing.getVisibleContext(userId, "leaf", leafId);

    const attachment = await this.prisma.withConnection(() =>
      this.prisma.leafAttachment.findFirst({
        where: { id: attachmentId, leafId },
      }),
    );
    if (!attachment) throw new NotFoundException("Arquivo não encontrado");

    const dataUrl = `data:${attachment.mimeType};base64,${Buffer.from(attachment.data).toString("base64")}`;
    return {
      id: attachment.id,
      leafId: attachment.leafId,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      createdAt: attachment.createdAt,
      dataUrl,
    };
  }

  async remove(attachmentId: string, userId: string) {
    const attachment = await this.prisma.withConnection(() =>
      this.prisma.leafAttachment.findUnique({ where: { id: attachmentId } }),
    );
    if (!attachment) throw new NotFoundException("Arquivo não encontrado");

    await this.sharing.getVisibleContext(userId, "leaf", attachment.leafId);
    const caps = await this.sharing.getUserCapabilities(
      userId,
      "leaf",
      attachment.leafId,
    );
    const ctx = await this.sharing.resolveContext("leaf", attachment.leafId);
    const isOwner = ctx?.ownerId === userId;

    if (!isOwner && !caps.canUploadFiles) {
      throw new NotFoundException("Arquivo não encontrado");
    }

    await this.prisma.withConnection(() =>
      this.prisma.leafAttachment.delete({ where: { id: attachmentId } }),
    );
    return { success: true };
  }

  private serialize(attachment: {
    id: string;
    leafId: string;
    fileName: string;
    mimeType: string;
    size: number;
    createdAt: Date;
  }) {
    return {
      id: attachment.id,
      leafId: attachment.leafId,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      createdAt: attachment.createdAt,
    };
  }
}