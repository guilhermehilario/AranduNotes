import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PomodoroService } from './pomodoro.service';
import { CreatePomodoroDto, UpdatePomodoroDto } from './dto/create-pomodoro.dto';

@UseGuards(JwtAuthGuard)
@Controller('planning/pomodoro')
export class PomodoroController {
  constructor(private readonly pomodoroService: PomodoroService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.pomodoroService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.pomodoroService.findOne(id, userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreatePomodoroDto) {
    return this.pomodoroService.create(userId, dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePomodoroDto,
  ) {
    return this.pomodoroService.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.pomodoroService.remove(id, userId);
  }
}
