import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditHistoryService } from '../trash/edit-history.service';
import { SharingService } from '../sharing/sharing.service';

@Injectable()
export class NotebooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly editHistory: EditHistoryService,
    private readonly sharing: SharingService,
  ) {}

  async findAll(userId: string) {
    const [owned, shared] = await Promise.all([
      this.prisma.withConnection(() =>
        this.prisma.notebook.findMany({
          where: { userId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
        }),
      ),
      this.sharing.listSharedResourcesOfType(userId, 'notebook'),
    ]);

    const notebooks = [
      ...owned.map((nb) => ({ ...nb, access: 'owner' as const })),
      ...shared.map((nb) => ({ ...nb, access: 'editor' as const })),
    ];

    if (notebooks.length === 0) return [];

    // ── Elimina o N+1 clássico ──
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

    const countMap = new Map(counts.map((c) => [c.notebookId, c._count.id]));

    return notebooks.map((nb) => ({
      ...nb,
      leavesCount: countMap.get(nb.id) ?? 0,
    }));
  }

  async findOne(id: string, userId: string) {
    await this.sharing.getVisibleContext(userId, 'notebook', id);

    const [notebook, leavesCount] = await Promise.all([
      this.prisma.withConnection(() =>
        this.prisma.notebook.findFirst({
          where: { id, deletedAt: null },
        }),
      ),
      this.prisma.withConnection(() =>
        this.prisma.leaf.count({
          where: { notebookId: id, deletedAt: null },
        }),
      ),
    ]);

    if (!notebook) throw new NotFoundException('Caderno não encontrado');

    const access = await this.sharing.getAccessLevel(userId, 'notebook', id);
    const capabilities = await this.sharing.getUserCapabilities(
      userId,
      'notebook',
      id,
    );
    return { ...notebook, leavesCount, access, permissions: capabilities };
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
    await this.sharing.getEditableContext(userId, 'notebook', id);

    const notebook = await this.prisma.withConnection(() =>
      this.prisma.notebook.findUnique({
        where: { id },
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
