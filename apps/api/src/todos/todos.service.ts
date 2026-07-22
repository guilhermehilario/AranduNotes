import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto, UpdateTodoDto } from './dto/create-todo.dto';

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const todo = await this.prisma.todo.findFirst({
      where: { id, userId },
    });
    if (!todo) throw new NotFoundException('Tarefa não encontrada');
    return todo;
  }

  async create(userId: string, dto: CreateTodoDto) {
    return this.prisma.todo.create({
      data: {
        userId,
        title: dto.title,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateTodoDto) {
    const todo = await this.prisma.todo.findFirst({
      where: { id, userId },
    });
    if (!todo) throw new NotFoundException('Tarefa não encontrada');

    return this.prisma.todo.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.completed !== undefined && { completed: dto.completed }),
      },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const todo = await this.prisma.todo.findFirst({
      where: { id, userId },
    });
    if (!todo) throw new NotFoundException('Tarefa não encontrada');

    await this.prisma.todo.delete({ where: { id } });
  }
}
