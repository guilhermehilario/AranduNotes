import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SM2Result {
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextReviewDate: Date;
}

const MAX_INTERVAL_DAYS = 365;
const MIN_EASE_FACTOR = 1.3;

@Injectable()
export class FlashcardsService {
  constructor(private readonly prisma: PrismaService) {}

  private computeSM2(
    card: {
      repetitions: number;
      interval: number;
      easeFactor: number;
    },
    score: number,
  ): SM2Result {
    let { repetitions, interval, easeFactor } = card;

    if (score >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions++;
    } else {
      repetitions = 0;
      interval = 1;
    }

    if (interval > MAX_INTERVAL_DAYS) {
      interval = MAX_INTERVAL_DAYS;
    }

    easeFactor =
      easeFactor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
    if (easeFactor < MIN_EASE_FACTOR) {
      easeFactor = MIN_EASE_FACTOR;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
      repetitions,
      interval,
      easeFactor: Math.round(easeFactor * 100) / 100,
      nextReviewDate,
    };
  }

  async create(
    userId: string,
    data: {
      leafId: string;
      notebookId: string;
      front: string;
      back: string;
    },
  ) {
    // Verify ownership via notebook
    const notebook = await this.prisma.notebook.findFirst({
      where: { id: data.notebookId, userId },
    });
    if (!notebook) throw new NotFoundException('Caderno não encontrado');

    const now = new Date();
    return this.prisma.flashcard.create({
      data: {
        leafId: data.leafId,
        notebookId: data.notebookId,
        front: data.front,
        back: data.back,
        repetitions: 0,
        interval: 0,
        easeFactor: 2.5,
        nextReviewDate: now,
      },
    });
  }

  async findByNotebook(notebookId: string, userId: string) {
    const notebook = await this.prisma.notebook.findFirst({
      where: { id: notebookId, userId },
    });
    if (!notebook) throw new NotFoundException('Caderno não encontrado');

    return this.prisma.flashcard.findMany({
      where: { notebookId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    cardId: string,
    userId: string,
    data: { front?: string; back?: string },
  ) {
    const card = await this.prisma.flashcard.findUnique({
      where: { id: cardId },
      include: { notebook: true },
    });

    if (!card) throw new NotFoundException('Flashcard não encontrado');
    if (card.notebook.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    const updates: Record<string, string> = {};
    if (data.front !== undefined) updates.front = data.front;
    if (data.back !== undefined) updates.back = data.back;

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('Nenhum campo para atualizar');
    }

    return this.prisma.flashcard.update({
      where: { id: cardId },
      data: updates,
    });
  }

  async review(cardId: string, userId: string, score: number) {
    const card = await this.prisma.flashcard.findUnique({
      where: { id: cardId },
      include: { notebook: true },
    });

    if (!card) throw new NotFoundException('Flashcard não encontrado');
    if (card.notebook.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    const sm2Result = this.computeSM2(card, score);

    return this.prisma.flashcard.update({
      where: { id: cardId },
      data: {
        repetitions: sm2Result.repetitions,
        interval: sm2Result.interval,
        easeFactor: sm2Result.easeFactor,
        nextReviewDate: sm2Result.nextReviewDate,
      },
    });
  }
}
