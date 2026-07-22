import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface StudyStats {
  totalCards: number;
  reviewedToday: number;
  dueForReview: number;
  accuracyRate: number;
  avgEaseFactor: number;
  perNotebook: Array<{
    notebookId: string;
    notebookTitle: string;
    notebookColor: string;
    totalCards: number;
    reviewedToday: number;
    dueForReview: number;
  }>;
}

@Injectable()
export class StudyService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Helpers ──

  private getTodayStart(): Date {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  private safeJsonParse<T>(json: string, fallback: T): T {
    try {
      return JSON.parse(json) as T;
    } catch {
      return fallback;
    }
  }

  // ── Study Sessions (com validação e transações) ──

  async saveSession(
    notebookId: string,
    userId: string,
    data: {
      currentIndex?: number;
      reviewedCount?: number;
      showAnswer?: boolean;
      sessionActive?: boolean;
      flashcards?: any[];
      completedCardIds?: string[];
      scores?: Record<string, number>;
    },
  ) {
    // Validação de tipos
    if (
      data.currentIndex !== undefined &&
      (typeof data.currentIndex !== 'number' || data.currentIndex < 0)
    ) {
      throw new InternalServerErrorException('currentIndex inválido');
    }
    if (
      data.reviewedCount !== undefined &&
      (typeof data.reviewedCount !== 'number' || data.reviewedCount < 0)
    ) {
      throw new InternalServerErrorException('reviewedCount inválido');
    }

    const notebook = await this.prisma.notebook.findFirst({
      where: { id: notebookId, userId },
    });
    if (!notebook) throw new NotFoundException('Caderno não encontrado');

    try {
      return await this.prisma.$transaction(async (tx) => {
        const sessionData = {
          currentIndex: data.currentIndex ?? 0,
          reviewedCount: data.reviewedCount ?? 0,
          showAnswer: data.showAnswer ?? false,
          sessionActive: data.sessionActive ?? false,
          flashcards: JSON.stringify(data.flashcards ?? []),
          completedCardIds: JSON.stringify(data.completedCardIds ?? []),
          scores: JSON.stringify(data.scores ?? {}),
        };

        return tx.studySession.upsert({
          where: {
            notebookId_userId: { notebookId, userId },
          },
          create: {
            notebookId,
            userId,
            ...sessionData,
          },
          update: sessionData,
        });
      });
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(
        'Erro ao salvar sessão de estudo',
      );
    }
  }

  async loadSession(notebookId: string, userId: string) {
    const session = await this.prisma.studySession.findUnique({
      where: {
        notebookId_userId: { notebookId, userId },
      },
    });

    if (!session) {
      throw new NotFoundException(
        'Nenhuma sessão de estudo encontrada para este caderno',
      );
    }

    return {
      ...session,
      flashcards: this.safeJsonParse(session.flashcards, []),
      completedCardIds: this.safeJsonParse(session.completedCardIds, []),
      scores: this.safeJsonParse(session.scores, {}),
    };
  }

  async deleteSession(notebookId: string, userId: string): Promise<void> {
    try {
      await this.prisma.studySession.delete({
        where: {
          notebookId_userId: { notebookId, userId },
        },
      });
    } catch {
      // Se não existe, apenas ignora
    }
  }

  // ── Stats (cálculo robusto e confiável) ──

  async getStats(userId: string): Promise<StudyStats> {
    const notebooks = await this.prisma.notebook.findMany({
      where: { userId },
    });

    const userNotebookIds = notebooks.map((nb) => nb.id);

    const allFlashcards = await this.prisma.flashcard.findMany({
      where: { notebookId: { in: userNotebookIds } },
    });

    const todayStart = this.getTodayStart();
    const now = new Date();

    // ── Cálculo mais confiável de revisões de hoje ──
    // Considera revisado hoje se:
    // - updatedAt é de hoje
    // - E o card foi efetivamente revisado (repetitions > 0 OU interval > 0 OU easeFactor != 2.5)
    // Isso exclui cards recém-criados que nunca foram revisados
    const hasBeenReviewed = (c: typeof allFlashcards[0]) =>
      c.repetitions > 0 || c.interval > 0 || Math.abs(c.easeFactor - 2.5) > 0.001;

    const reviewedToday = allFlashcards.filter((c) => {
      const updated = new Date(c.updatedAt);
      if (updated < todayStart) return false;
      return hasBeenReviewed(c);
    });

    const dueForReview = allFlashcards.filter(
      (c) => new Date(c.nextReviewDate) <= now,
    );

    const totalReviewed = allFlashcards.filter(hasBeenReviewed).length;
    const reviewedCards = allFlashcards.filter(hasBeenReviewed);

    const avgEaseFactor =
      totalReviewed > 0
        ? reviewedCards.reduce((sum, c) => sum + c.easeFactor, 0) / totalReviewed
        : 2.5;

    // accuracyRate baseada no ease-factor médio (proxy confiável do SM-2)
    const accuracyRate = Math.min(
      100,
      Math.max(0, Math.round(((avgEaseFactor - 1.3) / (3.3 - 1.3)) * 100)),
    );

    const perNotebook = userNotebookIds
      .map((nbId) => {
        const notebook = notebooks.find((nb) => nb.id === nbId);
        const nbCards = allFlashcards.filter((c) => c.notebookId === nbId);
        const nbReviewedToday = reviewedToday.filter(
          (c) => c.notebookId === nbId,
        );
        const nbDue = dueForReview.filter((c) => c.notebookId === nbId);

        return {
          notebookId: nbId,
          notebookTitle: notebook?.title ?? 'Sem título',
          notebookColor: notebook?.color ?? '#aa3bff',
          totalCards: nbCards.length,
          reviewedToday: nbReviewedToday.length,
          dueForReview: nbDue.length,
        };
      })
      .filter((nb) => nb.totalCards > 0);

    return {
      totalCards: allFlashcards.length,
      reviewedToday: reviewedToday.length,
      dueForReview: dueForReview.length,
      accuracyRate,
      avgEaseFactor: Math.round(avgEaseFactor * 100) / 100,
      perNotebook,
    };
  }
}
