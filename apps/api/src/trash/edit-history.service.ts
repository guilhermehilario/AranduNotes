import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EditHistoryService {
  private readonly logger = new Logger(EditHistoryService.name);
  constructor(private readonly prisma: PrismaService) {}

  async record(
    userId: string,
    data: {
      leafId?: string;
      notebookId?: string;
      action: string;
      fieldName?: string;
      oldValue?: string;
      newValue?: string;
    },
  ) {
    // 🔐 ALTO-14: Limpeza lazy — a cada novo registro, remove registros >6 meses
    // Evita a necessidade de cron job. deleteMany é eficiente e roda poucas vezes.
    void this.cleanupOldRecords();

    return this.prisma.withConnection(() =>
      this.prisma.editHistory.create({
        data: {
          userId,
          leafId: data.leafId ?? null,
          notebookId: data.notebookId ?? null,
          action: data.action,
          fieldName: data.fieldName ?? null,
          oldValue: data.oldValue ?? null,
          newValue: data.newValue ?? null,
        },
      }),
    );
  }

  /** 🔐 ALTO-14: Remove registros de histórico com mais de 6 meses */
  async cleanupOldRecords(): Promise<number> {
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const result = await this.prisma.withConnection(() =>
      this.prisma.editHistory.deleteMany({
        where: { createdAt: { lt: sixMonthsAgo } },
      }),
    );
    if (result.count > 0) {
      this.logger.log(`[HISTORY] ${result.count} registros antigos removidos (>6 meses)`);
    }
    return result.count;
  }

  async getLeafHistory(leafId: string, userId: string) {
    const leaf = await this.prisma.withConnection(() =>
      this.prisma.leaf.findUnique({
        where: { id: leafId },
        include: { notebook: true },
      }),
    );
    if (!leaf || leaf.notebook.userId !== userId) return [];

    return this.prisma.withConnection(() =>
      this.prisma.editHistory.findMany({
        where: { leafId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    );
  }

  async getNotebookHistory(notebookId: string, userId: string) {
    const notebook = await this.prisma.withConnection(() =>
      this.prisma.notebook.findFirst({
        where: { id: notebookId, userId },
      }),
    );
    if (!notebook) return [];

    return this.prisma.withConnection(() =>
      this.prisma.editHistory.findMany({
        where: { notebookId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    );
  }

  async getRecentActivity(userId: string, limit = 10) {
    return this.prisma.withConnection(() =>
      this.prisma.editHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          leaf: { select: { title: true } },
          notebook: { select: { title: true } },
        },
      }),
    );
  }
}
