import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditHistoryService } from '../trash/edit-history.service';
import { buildTree } from '../prisma/utils/build-tree.util';
import { AiLeavesService } from './ai-leaves.service';
import { SharingService } from '../sharing/sharing.service';

@Injectable()
export class LeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly editHistory: EditHistoryService,
    private readonly aiLeaves: AiLeavesService,
    private readonly sharing: SharingService,
  ) {}

  async findByNotebook(notebookId: string, userId: string) {
    await this.sharing.getVisibleContext(userId, 'notebook', notebookId);

    return this.prisma.withConnection(() =>
      this.prisma.leaf.findMany({
        where: { notebookId, parentId: null, deletedAt: null, archivedAt: null },
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        include: {
          children: {
            where: { deletedAt: null },
            orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
            include: {
              children: {
                where: { deletedAt: null },
                orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
              },
            },
          },
          tags: {
            include: { tag: true },
          },
        },
      }),
    );
  }

  async findOne(leafId: string, userId: string) {
    await this.sharing.getVisibleContext(userId, 'leaf', leafId);

    const leafWithParents = await this.prisma.withConnection(() =>
      this.prisma.leaf.findUnique({
        where: { id: leafId },
        include: {
          notebook: true,
          parent: {
            include: {
              parent: true,
            },
          },
          children: {
            where: { deletedAt: null },
            orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
          },
          tags: {
            include: { tag: true },
          },
        },
      }),
    );

    if (!leafWithParents) throw new NotFoundException('Folha não encontrada');
    return leafWithParents;
  }

  async create(
    notebookId: string,
    userId: string,
    data: { title: string; content?: string; rawText?: string; parentId?: string },
  ) {
    await this.sharing.getEditableContext(userId, 'notebook', notebookId);

    const notebook = await this.prisma.withConnection(() =>
      this.prisma.notebook.findUnique({
        where: { id: notebookId },
        select: { id: true },
      }),
    );
    if (!notebook) throw new NotFoundException('Caderno não encontrado');

    if (data.title.length > 100) {
      throw new BadRequestException('Título muito longo (máx. 100 caracteres)');
    }

    if (data.parentId) {
      const parentLeaf = await this.prisma.withConnection(() =>
        this.prisma.leaf.findFirst({
          where: { id: data.parentId, notebookId },
        }),
      );
      if (!parentLeaf) throw new NotFoundException('Folha pai não encontrada');
    }

    // Calcula a próxima posição entre os irmãos
    const maxPosition = await this.prisma.withConnection(() =>
      this.prisma.leaf.aggregate({
        where: {
          notebookId,
          parentId: data.parentId || null,
          deletedAt: null,
        },
        _max: { position: true },
      }),
    );

    const nextPosition = (maxPosition._max.position ?? -1) + 1;

    const leaf = await this.prisma.withConnection(() =>
      this.prisma.leaf.create({
        data: {
          notebookId,
          title: data.title,
          content: data.content || '',
          rawText: data.rawText || '',
          parentId: data.parentId || null,
          position: nextPosition,
        },
      }),
    );

    await this.editHistory.record(userId, {
      leafId: leaf.id,
      notebookId,
      action: 'created',
      fieldName: 'title',
      newValue: data.title,
    });

    return leaf;
  }

  async update(
    leafId: string,
    userId: string,
    data: {
      title?: string;
      content?: string;
      rawText?: string;
      summary?: string | null;
      parentId?: string | null;
    },
  ) {
    const leaf = await this.sharing.getEditableContext(userId, 'leaf', leafId);

    const current = await this.prisma.withConnection(() =>
      this.prisma.leaf.findUnique({
        where: { id: leafId },
        select: { title: true, notebookId: true },
      }),
    );

    const updated = await this.prisma.withConnection(() =>
      this.prisma.leaf.update({
        where: { id: leafId },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.content !== undefined && { content: data.content }),
          ...(data.rawText !== undefined && { rawText: data.rawText }),
          ...(data.summary !== undefined && { summary: data.summary }),
          ...(data.parentId !== undefined && { parentId: data.parentId }),
        },
      }),
    );

    if (data.title !== undefined && data.title !== current?.title) {
      await this.editHistory.record(userId, {
        leafId,
        notebookId: leaf.notebookId ?? undefined,
        action: 'updated',
        fieldName: 'title',
        oldValue: current?.title,
        newValue: data.title,
      });
    }

    return updated;
  }

  async generateSummary(leafId: string, userId: string) {
    return this.aiLeaves.generateSummary(leafId, userId);
  }

  async generateFlashcards(leafId: string, userId: string) {
    return this.aiLeaves.generateFlashcards(leafId, userId);
  }

  async findFlashcards(leafId: string, userId: string) {
    await this.sharing.getEditableContext(userId, 'leaf', leafId);

    return this.prisma.withConnection(() =>
      this.prisma.flashcard.findMany({
        where: { leafId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async archive(leafId: string, userId: string) {
    await this.sharing.getEditableContext(userId, 'leaf', leafId);

    const now = new Date();
    return this.prisma.withConnection(() =>
      this.prisma.leaf.update({
        where: { id: leafId },
        data: { archivedAt: now },
      }),
    );
  }

  async unarchive(leafId: string, userId: string) {
    await this.sharing.getEditableContext(userId, 'leaf', leafId);

    return this.prisma.withConnection(() =>
      this.prisma.leaf.update({
        where: { id: leafId },
        data: { archivedAt: null },
      }),
    );
  }

  async findArchived(userId: string) {
    return this.prisma.withConnection(() =>
      this.prisma.leaf.findMany({
        where: {
          notebook: { userId },
          archivedAt: { not: null },
          deletedAt: null,
        },
        orderBy: { archivedAt: 'desc' },
        include: {
          notebook: { select: { title: true, color: true } },
          tags: { include: { tag: true } },
        },
      }),
    );
  }

  async reorder(
    userId: string,
    data: { orderedIds: string[]; parentId?: string },
  ) {
    const { orderedIds } = data;

    // Determina o caderno (primeira folha) e exige permissão de edição
    const first = await this.prisma.withConnection(() =>
      this.prisma.leaf.findUnique({
        where: { id: orderedIds[0] },
        select: { notebookId: true },
      }),
    );
    if (first) {
      await this.sharing.getEditableContext(userId, 'notebook', first.notebookId);
    }

    // Verifica se todas as folhas pertencem ao mesmo caderno acessível
    const leaves = await this.prisma.withConnection(() =>
      this.prisma.leaf.findMany({
        where: {
          id: { in: orderedIds },
          notebookId: first?.notebookId,
        },
      }),
    );

    if (leaves.length !== orderedIds.length) {
      throw new NotFoundException('Alguma(s) folha(s) não encontrada(s)');
    }

    // Atualiza posições em lote
    const updates = orderedIds.map((id, index) =>
      this.prisma.leaf.update({
        where: { id },
        data: { position: index },
      }),
    );

    await this.prisma.$transaction(updates);
    return { success: true };
  }

  async getLeafHierarchy(notebookId: string, userId: string) {
    await this.sharing.getVisibleContext(userId, 'notebook', notebookId);

    const allLeaves = await this.prisma.withConnection(() =>
      this.prisma.leaf.findMany({
        where: { notebookId, deletedAt: null, archivedAt: null },
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        include: {
          tags: {
            include: { tag: true },
          },
        },
      }),
    );

    return buildTree(allLeaves);
  }
}

