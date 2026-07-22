import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePomodoroDto, UpdatePomodoroDto } from './dto/create-pomodoro.dto';

@Injectable()
export class PomodoroService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.pomodoroSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const session = await this.prisma.pomodoroSession.findFirst({
      where: { id, userId },
    });
    if (!session) throw new NotFoundException('Sessão Pomodoro não encontrada');
    return session;
  }

  async create(userId: string, dto: CreatePomodoroDto) {
    return this.prisma.pomodoroSession.create({
      data: {
        userId,
        taskName: dto.taskName ?? null,
        duration: dto.duration ?? 25,
        startedAt: new Date(),
      },
    });
  }

  async update(id: string, userId: string, dto: UpdatePomodoroDto) {
    const session = await this.prisma.pomodoroSession.findFirst({
      where: { id, userId },
    });
    if (!session) throw new NotFoundException('Sessão Pomodoro não encontrada');

    return this.prisma.pomodoroSession.update({
      where: { id },
      data: {
        ...(dto.taskName !== undefined && { taskName: dto.taskName }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
        ...(dto.completed !== undefined && { 
          completed: dto.completed,
          ...(dto.completed ? { endedAt: new Date() } : { endedAt: null }),
        }),
      },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const session = await this.prisma.pomodoroSession.findFirst({
      where: { id, userId },
    });
    if (!session) throw new NotFoundException('Sessão Pomodoro não encontrada');

    await this.prisma.pomodoroSession.delete({ where: { id } });
  }
}
