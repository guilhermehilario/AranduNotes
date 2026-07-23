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
    const notebooks = await this.prisma.withConnection(() =>
      this.prisma.notebook.findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
    );

    if (notebooks.length === 0) return [];

    // ── Elimina o N+1 clássico ──
    // Antes: 1 query (notebooks) + N queries (leaf.count p/ cada notebook)
    // Agora: 1 query (notebooks) + 1 query (leaf.groupBy com _count)
    const counts = await this.prisma.withConnection(() =>
      this.prisma.leaf.groupBy({
        by: ['notebookId'],
        where: {
          notebookId: { in: notebooks.map((nb) => nb.id) },
          deletedAt: null,
        },
        _count: { id: true },
      }),
    );

    const countMap = new Map(
      counts.map((c) => [c.notebookId, c._count.id]),
    );

    return notebooks.map((nb) => ({
      ...nb,
      leavesCount: countMap.get(nb.id) ?? 0,
    }));
  }

  async findOne(id: string, userId: string) {
    const notebook = await this.prisma.withConnection(() =>
      this.prisma.notebook.findFirst({
        where: { id, userId, deletedAt: null },
      }),
    );

    if (!notebook) throw new NotFoundException('Caderno não encontrado');

    const leavesCount = await this.prisma.withConnection(() =>
      this.prisma.leaf.count({
        where: { notebookId: id, deletedAt: null },
      }),
    );

    return { ...notebook, leavesCount };
  }

  async create(
    userId: string,
    data: { title: string; description?: string | null; color: string },
  ) {
    const notebook = await this.prisma.withConnection(() =>
      this.prisma.notebook.create({
        data: {
          userId,
          title: data.title,
          description: data.description ?? null,
          color: data.color,
        },
      }),
    );

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
    const notebook = await this.prisma.withConnection(() =>
      this.prisma.notebook.findFirst({
        where: { id, userId },
      }),
    );

    if (!notebook) throw new NotFoundException('Caderno não encontrado');

    const updated = await this.prisma.withConnection(() =>
      this.prisma.notebook.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.color !== undefined && { color: data.color }),
        },
      }),
    );

    if (data.title !== undefined && data.title !== notebook.title) {
      await this.editHistory.record(userId, {
        notebookId: id,
        action: 'updated',
        fieldName: 'title',
        oldValue: notebook.title,
        newValue: data.title,
      });
    }

    const leavesCount = await this.prisma.withConnection(() =>
      this.prisma.leaf.count({
        where: { notebookId: id, deletedAt: null },
      }),
    );

    return { ...updated, leavesCount };
  }
}
