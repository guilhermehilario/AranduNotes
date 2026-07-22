import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditHistoryService } from '../trash/edit-history.service';
import { buildTree } from '../prisma/utils/build-tree.util';
import { AiMockService } from './utils/ai-mock.service';

@Injectable()
export class LeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly editHistory: EditHistoryService,
    private readonly aiMock: AiMockService,
  ) {}

  private async verifyLeafOwnership(leafId: string, userId: string) {
    const leaf = await this.prisma.leaf.findUnique({
      where: { id: leafId },
      include: { notebook: true },
    });

    if (!leaf) return { leaf: null, error: 'Folha não encontrada' };
    if (leaf.notebook.userId !== userId) {
      return { leaf: null, error: 'Acesso negado' };
    }

    return { leaf, error: null };
  }

  async findByNotebook(notebookId: string, userId: string) {
    const notebook = await this.prisma.notebook.findFirst({
      where: { id: notebookId, userId, deletedAt: null },
    });
    if (!notebook) throw new NotFoundException('Caderno não encontrado');

    return this.prisma.leaf.findMany({
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
    });
  }

  async findOne(leafId: string, userId: string) {
    const { leaf, error } = await this.verifyLeafOwnership(leafId, userId);
    if (error) {
      if (error === 'Acesso negado') throw new ForbiddenException(error);
      throw new NotFoundException(error);
    }

    const leafWithParents = await this.prisma.leaf.findUnique({
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
    });

    return leafWithParents;
  }

  async create(
    notebookId: string,
    userId: string,
    data: { title: string; content?: string; rawText?: string; parentId?: string },
  ) {
    const notebook = await this.prisma.notebook.findFirst({
      where: { id: notebookId, userId },
    });
    if (!notebook) throw new NotFoundException('Caderno não encontrado');

    if (data.title.length > 100) {
      throw new BadRequestException('Título muito longo (máx. 100 caracteres)');
    }

    if (data.parentId) {
      const parentLeaf = await this.prisma.leaf.findFirst({
        where: { id: data.parentId, notebookId },
      });
      if (!parentLeaf) throw new NotFoundException('Folha pai não encontrada');
    }

    // Calcula a próxima posição entre os irmãos
    const maxPosition = await this.prisma.leaf.aggregate({
      where: {
        notebookId,
        parentId: data.parentId || null,
        deletedAt: null,
      },
      _max: { position: true },
    });

    const nextPosition = (maxPosition._max.position ?? -1) + 1;

    const leaf = await this.prisma.leaf.create({
      data: {
        notebookId,
        title: data.title,
        content: data.content || '',
        rawText: data.rawText || '',
        parentId: data.parentId || null,
        position: nextPosition,
      },
    });

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
    const { leaf, error } = await this.verifyLeafOwnership(leafId, userId);
    if (error) {
      if (error === 'Acesso negado') throw new ForbiddenException(error);
      throw new NotFoundException(error);
    }

    const updated = await this.prisma.leaf.update({
      where: { id: leafId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.rawText !== undefined && { rawText: data.rawText }),
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
      },
    });

    if (data.title !== undefined && data.title !== leaf?.title) {
      await this.editHistory.record(userId, {
        leafId,
        notebookId: leaf!.notebookId,
        action: 'updated',
        fieldName: 'title',
        oldValue: leaf?.title,
        newValue: data.title,
      });
    }

    return updated;
  }

  async generateSummary(leafId: string, userId: string) {
    const { leaf, error } = await this.verifyLeafOwnership(leafId, userId);
    if (error) {
      if (error === 'Acesso negado') throw new ForbiddenException(error);
      throw new NotFoundException(error);
    }

    // ✨ Delega a geração do resumo para o AiMockService
    const summaryText = this.aiMock.generateSummary(
      leaf!.title,
      leaf!.rawText || '',
    );

    const updated = await this.prisma.leaf.update({
      where: { id: leafId },
      data: { summary: summaryText },
    });

    await this.editHistory.record(userId, {
      leafId,
      notebookId: leaf!.notebookId,
      action: 'updated',
      fieldName: 'summary',
      newValue: summaryText,
    });

    return { summary: updated.summary! };
  }

  async generateFlashcards(leafId: string, userId: string) {
    const { leaf, error } = await this.verifyLeafOwnership(leafId, userId);
    if (error) {
      if (error === 'Acesso negado') throw new ForbiddenException(error);
      throw new NotFoundException(error);
    }

    // ✨ Delega a geração dos flashcards para o AiMockService
    const mockCards = this.aiMock.generateFlashcardTemplates(
      leaf!.id,
      leaf!.notebookId,
      leaf!.title,
    );

    for (const card of mockCards) {
      await this.prisma.flashcard.create({ data: card });
    }

    await this.editHistory.record(userId, {
      leafId,
      notebookId: leaf!.notebookId,
      action: 'created',
      fieldName: 'flashcards',
      newValue: `${mockCards.length} flashcards gerados por IA`,
    });

    return mockCards;
  }

  async findFlashcards(leafId: string, userId: string) {
    const { error } = await this.verifyLeafOwnership(leafId, userId);
    if (error) {
      if (error === 'Acesso negado') throw new ForbiddenException(error);
      throw new NotFoundException(error);
    }

    return this.prisma.flashcard.findMany({
      where: { leafId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async archive(leafId: string, userId: string) {
    const { leaf, error } = await this.verifyLeafOwnership(leafId, userId);
    if (error) {
      if (error === 'Acesso negado') throw new ForbiddenException(error);
      throw new NotFoundException(error);
    }

    const now = new Date();
    return this.prisma.leaf.update({
      where: { id: leafId },
      data: { archivedAt: now },
    });
  }

  async unarchive(leafId: string, userId: string) {
    const { leaf, error } = await this.verifyLeafOwnership(leafId, userId);
    if (error) {
      if (error === 'Acesso negado') throw new ForbiddenException(error);
      throw new NotFoundException(error);
    }

    return this.prisma.leaf.update({
      where: { id: leafId },
      data: { archivedAt: null },
    });
  }

  async findArchived(userId: string) {
    return this.prisma.leaf.findMany({
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
    });
  }

  async reorder(
    userId: string,
    data: { orderedIds: string[]; parentId?: string },
  ) {
    const { orderedIds, parentId } = data;

    // Verifica se todas as folhas pertencem ao usuário
    const leaves = await this.prisma.leaf.findMany({
      where: {
        id: { in: orderedIds },
        notebook: { userId },
      },
    });

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
    const notebook = await this.prisma.notebook.findFirst({
      where: { id: notebookId, userId },
    });
    if (!notebook) throw new NotFoundException('Caderno não encontrado');

    const allLeaves = await this.prisma.leaf.findMany({
      where: { notebookId, deletedAt: null, archivedAt: null },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    return buildTree(allLeaves);
  }
}

