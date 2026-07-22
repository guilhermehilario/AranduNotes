import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditHistoryService } from '../trash/edit-history.service';

@Injectable()
export class NotebooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly editHistory: EditHistoryService,
  ) {}

  async findAll(userId: string) {
    const notebooks = await this.prisma.notebook.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = await Promise.all(
      notebooks.map(async (nb) => {
        const leavesCount = await this.prisma.leaf.count({
          where: { notebookId: nb.id, deletedAt: null },
        });
        return { ...nb, leavesCount };
      }),
    );

    return enriched;
  }

  async findOne(id: string, userId: string) {
    const notebook = await this.prisma.notebook.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!notebook) throw new NotFoundException('Caderno não encontrado');

    const leavesCount = await this.prisma.leaf.count({
      where: { notebookId: id, deletedAt: null },
    });

    return { ...notebook, leavesCount };
  }

  async create(
    userId: string,
    data: { title: string; description?: string | null; color: string },
  ) {
    const notebook = await this.prisma.notebook.create({
      data: {
        userId,
        title: data.title,
        description: data.description ?? null,
        color: data.color,
      },
    });

    await this.editHistory.record(userId, {
      notebookId: notebook.id,
      action: 'created',
      fieldName: 'title',
      newValue: data.title,
    });

    return { ...notebook, leavesCount: 0 };
  }

  async update(
    id: string,
    userId: string,
    data: { title?: string; description?: string | null; color?: string },
  ) {
    const notebook = await this.prisma.notebook.findFirst({
      where: { id, userId },
    });

    if (!notebook) throw new NotFoundException('Caderno não encontrado');

    const updated = await this.prisma.notebook.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });

    if (data.title !== undefined && data.title !== notebook.title) {
      await this.editHistory.record(userId, {
        notebookId: id,
        action: 'updated',
        fieldName: 'title',
        oldValue: notebook.title,
        newValue: data.title,
      });
    }

    const leavesCount = await this.prisma.leaf.count({
      where: { notebookId: id, deletedAt: null },
    });

    return { ...updated, leavesCount };
  }
}
