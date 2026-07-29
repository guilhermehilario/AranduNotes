import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditHistoryService } from '../trash/edit-history.service';
import { AiMockService } from './utils/ai-mock.service';

@Injectable()
export class AiLeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly editHistory: EditHistoryService,
    private readonly aiMock: AiMockService,
  ) {}

  private async verifyLeafOwnership(leafId: string, userId: string) {
    const leaf = await this.prisma.withConnection(() =>
      this.prisma.leaf.findUnique({
        where: { id: leafId },
        include: { notebook: true },
      }),
    );

    if (!leaf) return { leaf: null, error: 'Folha não encontrada' };
    if (leaf.notebook.userId !== userId) {
      return { leaf: null, error: 'Acesso negado' };
    }

    return { leaf, error: null };
  }

  async generateSummary(leafId: string, userId: string) {
    const { leaf, error } = await this.verifyLeafOwnership(leafId, userId);
    if (error) {
      if (error === 'Acesso negado') throw new ForbiddenException(error);
      throw new NotFoundException(error);
    }

    const summaryText = this.aiMock.generateSummary(
      leaf!.title,
      leaf!.rawText || '',
    );

    const updated = await this.prisma.withConnection(() =>
      this.prisma.leaf.update({
        where: { id: leafId },
        data: { summary: summaryText },
      }),
    );

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

    const mockCards = this.aiMock.generateFlashcardTemplates(
      leaf!.id,
      leaf!.notebookId,
      leaf!.title,
    );

    for (const card of mockCards) {
      await this.prisma.withConnection(() =>
        this.prisma.flashcard.create({ data: card }),
      );
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
}
