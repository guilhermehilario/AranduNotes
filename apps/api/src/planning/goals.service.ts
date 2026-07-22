import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId },
    });
    if (!goal) throw new NotFoundException('Meta não encontrada');
    return goal;
  }

  async create(userId: string, dto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description ?? null,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        progress: dto.progress ?? 0,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateGoalDto) {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId },
    });
    if (!goal) throw new NotFoundException('Meta não encontrada');

    return this.prisma.goal.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.targetDate !== undefined && { targetDate: dto.targetDate ? new Date(dto.targetDate) : null }),
        ...(dto.progress !== undefined && { progress: dto.progress }),
      },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId },
    });
    if (!goal) throw new NotFoundException('Meta não encontrada');

    await this.prisma.goal.delete({ where: { id } });
  }
}
