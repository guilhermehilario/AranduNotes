import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EditHistoryService {
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
    return this.prisma.editHistory.create({
      data: {
        userId,
        leafId: data.leafId ?? null,
        notebookId: data.notebookId ?? null,
        action: data.action,
        fieldName: data.fieldName ?? null,
        oldValue: data.oldValue ?? null,
        newValue: data.newValue ?? null,
      },
    });
  }

  async getLeafHistory(leafId: string, userId: string) {
    const leaf = await this.prisma.leaf.findUnique({
      where: { id: leafId },
      include: { notebook: true },
    });
    if (!leaf || leaf.notebook.userId !== userId) return [];

    return this.prisma.editHistory.findMany({
      where: { leafId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getNotebookHistory(notebookId: string, userId: string) {
    const notebook = await this.prisma.notebook.findFirst({
      where: { id: notebookId, userId },
    });
    if (!notebook) return [];

    return this.prisma.editHistory.findMany({
      where: { notebookId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getRecentActivity(userId: string, limit = 10) {
    return this.prisma.editHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        leaf: { select: { title: true } },
        notebook: { select: { title: true } },
      },
    });
  }
}
