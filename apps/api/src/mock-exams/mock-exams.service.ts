import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MockExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, notebookId?: string) {
    const where: any = { userId };
    if (notebookId) where.notebookId = notebookId;
    return this.prisma.mockExam.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        notebook: { select: { title: true, color: true } },
        _count: { select: { questions: true } },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const exam = await this.prisma.mockExam.findFirst({
      where: { id, userId },
      include: {
        notebook: { select: { title: true, color: true } },
        questions: {
          orderBy: { order: 'asc' },
          include: {
            question: {
              include: {
                notebook: { select: { title: true, color: true } },
              },
            },
          },
        },
      },
    });
    if (!exam) throw new NotFoundException('Simulado não encontrado');
    return exam;
  }

  async create(
    userId: string,
    data: {
      title: string;
      description?: string;
      timeLimit?: number;
      notebookId?: string;
    },
  ) {
    if (data.notebookId) {
      const notebook = await this.prisma.notebook.findFirst({
        where: { id: data.notebookId, userId },
      });
      if (!notebook) throw new NotFoundException('Caderno não encontrado');
    }

    return this.prisma.mockExam.create({
      data: {
        userId,
        title: data.title,
        description: data.description || null,
        timeLimit: data.timeLimit || null,
        notebookId: data.notebookId || null,
      },
    });
  }

  async addQuestion(examId: string, questionId: string, userId: string) {
    const exam = await this.prisma.mockExam.findFirst({
      where: { id: examId, userId },
    });
    if (!exam) throw new NotFoundException('Simulado não encontrado');

    const question = await this.prisma.question.findFirst({
      where: { id: questionId, userId },
    });
    if (!question) throw new NotFoundException('Questão não encontrada');

    // Verifica se já existe
    const existing = await this.prisma.mockExamQuestion.findUnique({
      where: { examId_questionId: { examId, questionId } },
    });
    if (existing) throw new BadRequestException('Questão já adicionada ao simulado');

    // Próxima ordem
    const maxOrder = await this.prisma.mockExamQuestion.aggregate({
      where: { examId },
      _max: { order: true },
    });

    return this.prisma.mockExamQuestion.create({
      data: {
        examId,
        questionId,
        order: (maxOrder._max.order ?? -1) + 1,
      },
      include: {
        question: {
          include: {
            notebook: { select: { title: true, color: true } },
          },
        },
      },
    });
  }

  async removeQuestion(examId: string, questionId: string, userId: string) {
    const exam = await this.prisma.mockExam.findFirst({
      where: { id: examId, userId },
    });
    if (!exam) throw new NotFoundException('Simulado não encontrado');

    await this.prisma.mockExamQuestion.delete({
      where: { examId_questionId: { examId, questionId } },
    });

    return { success: true };
  }

  async generateFromNotebook(userId: string, notebookId: string, title?: string) {
    const questions = await this.prisma.question.findMany({
      where: { userId, notebookId },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    if (questions.length === 0) {
      throw new BadRequestException('Nenhuma questão encontrada neste caderno');
    }

    const notebook = await this.prisma.notebook.findFirst({
      where: { id: notebookId, userId },
    });

    // Embaralha as questões
    const shuffled = [...questions].sort(() => Math.random() - 0.5);

    const exam = await this.prisma.mockExam.create({
      data: {
        userId,
        notebookId,
        title: title || `Simulado - ${notebook?.title || 'Sem título'}`,
        description: `Simulado gerado automaticamente com ${shuffled.length} questões`,
        timeLimit: Math.ceil(shuffled.length * 1.5), // 1.5 min per question
      },
    });

    // Adiciona questões
    await this.prisma.mockExamQuestion.createMany({
      data: shuffled.map((q, idx) => ({
        examId: exam.id,
        questionId: q.id,
        order: idx,
      })),
    });

    return this.findOne(exam.id, userId);
  }

  async remove(examId: string, userId: string): Promise<void> {
    const exam = await this.prisma.mockExam.findFirst({
      where: { id: examId, userId },
    });
    if (!exam) throw new NotFoundException('Simulado não encontrado');

    await this.prisma.mockExam.delete({ where: { id: examId } });
  }
}
