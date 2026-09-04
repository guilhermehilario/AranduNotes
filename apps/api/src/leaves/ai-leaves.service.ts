import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditHistoryService } from '../trash/edit-history.service';
import { AiMockService } from './utils/ai-mock.service';
import { SharingService } from '../sharing/sharing.service';

@Injectable()
export class AiLeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly editHistory: EditHistoryService,
    private readonly aiMock: AiMockService,
    private readonly sharing: SharingService,
  ) {}

  private async getLeafForEdit(leafId: string, userId: string) {
    await this.sharing.assertCanEditContent(userId, 'leaf', leafId);
    const leaf = await this.prisma.withConnection(() =>
      this.prisma.leaf.findUnique({
        where: { id: leafId },
        include: { notebook: true },
      }),
    );
    if (!leaf) throw new NotFoundException('Folha não encontrada');
    return leaf;
  }

  async generateSummary(leafId: string, userId: string) {
    const leaf = await this.getLeafForEdit(leafId, userId);

    const summaryText = this.aiMock.generateSummary(
      leaf.title,
      leaf.rawText || '',
    );

    const updated = await this.prisma.withConnection(() =>
      this.prisma.leaf.update({
        where: { id: leafId },
        data: { summary: summaryText },
      }),
    );

    await this.editHistory.record(userId, {
      leafId,
      notebookId: leaf.notebookId,
      action: 'updated',
      fieldName: 'summary',
      newValue: summaryText,
    });

    return { summary: updated.summary! };
  }

  async generateFlashcards(leafId: string, userId: string) {
    const leaf = await this.getLeafForEdit(leafId, userId);

    const mockCards = this.aiMock.generateFlashcardTemplates(
      leaf.id,
      leaf.notebookId,
      leaf.title,
    );

    for (const card of mockCards) {
      await this.prisma.withConnection(() =>
        this.prisma.flashcard.create({ data: card }),
      );
    }

    await this.editHistory.record(userId, {
      leafId,
      notebookId: leaf.notebookId,
      action: 'created',
      fieldName: 'flashcards',
      newValue: `${mockCards.length} flashcards gerados por IA`,
    });

    return mockCards;
  }
}
