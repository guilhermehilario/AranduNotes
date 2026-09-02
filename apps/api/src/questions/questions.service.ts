import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SharingService } from '../sharing/sharing.service';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sharing: SharingService,
  ) {}

  async findAll(
    userId: string,
    notebookId?: string,
    theme?: string,
    questionType?: string,
  ) {
    const where: Prisma.QuestionWhereInput = {};
    if (notebookId) {
      await this.sharing.getVisibleContext(userId, 'notebook', notebookId);
      where.notebookId = notebookId;
    } else {
      const sharedIds = await this.sharedQuestionIds(userId);
      where.OR = [{ userId }, { id: { in: sharedIds } }];
    }
    if (theme) where.theme = { contains: theme };
    if (questionType) where.questionType = questionType;
    return this.prisma.withConnection(() =>
      this.prisma.question.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          notebook: { select: { title: true, color: true } },
          leaf: { select: { title: true } },
        },
      }),
    );
  }

  async findOne(id: string, userId: string) {
    await this.sharing.getVisibleContext(userId, 'question', id);
    const question = await this.prisma.withConnection(() =>
      this.prisma.question.findUnique({
        where: { id },
        include: {
          notebook: { select: { title: true, color: true } },
          leaf: { select: { title: true } },
        },
      }),
    );
    if (!question) throw new NotFoundException('Questão não encontrada');
    return question;
  }

  async create(
    userId: string,
    data: {
      leafId?: string;
      notebookId: string;
      question: string;
      options?: string;
      correctAnswer: string;
      explanation?: string;
      questionType?: string;
      theme?: string;
    },
  ) {
    await this.sharing.getEditableContext(userId, 'notebook', data.notebookId);

    // Valida que a folha informada pertence ao caderno
    if (data.leafId) {
      const leaf = await this.prisma.withConnection(() =>
        this.prisma.leaf.findFirst({
          where: { id: data.leafId, notebookId: data.notebookId },
        }),
      );
      if (!leaf) {
        throw new NotFoundException('Folha não encontrada neste caderno');
      }
    }

    return this.prisma.withConnection(() =>
      this.prisma.question.create({
        data: {
          userId,
          leafId: data.leafId || null,
          notebookId: data.notebookId,
          question: data.question,
          options: data.options || '[]',
          correctAnswer: data.correctAnswer,
          explanation: data.explanation || null,
          questionType: data.questionType || 'multiple_choice',
          theme: data.theme || null,
        },
      }),
    );
  }

  async update(
    id: string,
    userId: string,
    data: {
      question?: string;
      options?: string;
      correctAnswer?: string;
      explanation?: string;
      questionType?: string;
      theme?: string;
    },
  ) {
    await this.sharing.getEditableContext(userId, 'question', id);

    const updates: Prisma.QuestionUpdateInput = {};
    if (data.question !== undefined) updates.question = data.question;
    if (data.options !== undefined) updates.options = data.options;
    if (data.correctAnswer !== undefined) updates.correctAnswer = data.correctAnswer;
    if (data.explanation !== undefined) updates.explanation = data.explanation;
    if (data.questionType !== undefined) updates.questionType = data.questionType;
    if (data.theme !== undefined) updates.theme = data.theme;

    return this.prisma.withConnection(() =>
      this.prisma.question.update({
        where: { id },
        data: updates,
      }),
    );
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.sharing.getOwnedContext(userId, 'question', id);

    await this.prisma.withConnection(() =>
      this.prisma.question.delete({ where: { id } }),
    );
  }

  private async sharedQuestionIds(userId: string): Promise<string[]> {
    const shares = await this.prisma.withConnection(() =>
      this.prisma.share.findMany({
        where: { sharedWithUserId: userId, resourceType: 'question' },
        select: { resourceId: true },
      }),
    );
    if (shares.length === 0) return [];
    const ids = shares.map((s) => s.resourceId);
    const questions = await this.prisma.withConnection(() =>
      this.prisma.question.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      }),
    );
    return questions.map((q) => q.id);
  }

  async getRandomQuestions(userId: string, limit: number = 10, notebookId?: string) {
    const where: Prisma.QuestionWhereInput = {};
    if (notebookId) {
      await this.sharing.getVisibleContext(userId, 'notebook', notebookId);
      where.notebookId = notebookId;
    } else {
      const sharedIds = await this.sharedQuestionIds(userId);
      where.OR = [{ userId }, { id: { in: sharedIds } }];
    }

    const total = await this.prisma.withConnection(() =>
      this.prisma.question.count({ where }),
    );
    if (total === 0) return [];

    // Pega uma amostra aleatória usando skip
    const take = Math.min(limit, total);
    const skip = Math.max(0, Math.floor(Math.random() * (total - take + 1)));

    return this.prisma.withConnection(() =>
      this.prisma.question.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          notebook: { select: { title: true, color: true } },
        },
      }),
    );
  }

  async generateFromFlashcard(flashcardId: string, userId: string) {
    await this.sharing.getEditableContext(userId, 'flashcard', flashcardId);

    const flashcard = await this.prisma.withConnection(() =>
      this.prisma.flashcard.findUnique({
        where: { id: flashcardId },
        include: { notebook: true },
      }),
    );

    if (!flashcard) throw new NotFoundException('Flashcard não encontrado');

    // Converte front/back em uma questão de múltipla escolha simples
    const questionData = {
      userId,
      notebookId: flashcard.notebookId,
      leafId: flashcard.leafId,
      question: flashcard.front,
      options: JSON.stringify([
        flashcard.back,
        'Nenhuma das alternativas',
        'Todas as alternativas',
        'Não sei responder',
      ]),
      correctAnswer: flashcard.back,
      explanation: 'Esta questão foi gerada automaticamente a partir de um flashcard.',
      questionType: 'multiple_choice' as const,
    };

    return this.prisma.withConnection(() =>
      this.prisma.question.create({ data: questionData }),
    );
  }
}
