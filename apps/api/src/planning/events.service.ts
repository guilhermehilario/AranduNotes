import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, type?: string) {
    return this.prisma.event.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
    });
  }

  async findOne(id: string, userId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, userId },
    });
    if (!event) throw new NotFoundException('Evento não encontrado');
    return event;
  }

  async create(userId: string, dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description ?? null,
        date: new Date(dto.date),
        time: dto.time ?? null,
        type: dto.type ?? 'agenda',
        status: dto.status ?? 'pending',
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findFirst({
      where: { id, userId },
    });
    if (!event) throw new NotFoundException('Evento não encontrado');

    return this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.time !== undefined && { time: dto.time }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const event = await this.prisma.event.findFirst({
      where: { id, userId },
    });
    if (!event) throw new NotFoundException('Evento não encontrado');

    await this.prisma.event.delete({ where: { id } });
  }
}
