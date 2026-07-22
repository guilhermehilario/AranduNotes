import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StudyService } from './study.service';
import { SaveSessionDto } from './dto/save-session.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class StudyController {
  constructor(private readonly studyService: StudyService) {}

  // ── Study Sessions ──

  @Put('study-sessions/:notebookId')
  saveSession(
    @Param('notebookId') notebookId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SaveSessionDto,
  ) {
    return this.studyService.saveSession(notebookId, userId, dto);
  }

  @Get('study-sessions/:notebookId')
  loadSession(
    @Param('notebookId') notebookId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.studyService.loadSession(notebookId, userId);
  }

  @Delete('study-sessions/:notebookId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSession(
    @Param('notebookId') notebookId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.studyService.deleteSession(notebookId, userId);
  }

  // ── Stats ──

  @Get('study/stats')
  getStats(@CurrentUser('id') userId: string) {
    return this.studyService.getStats(userId);
  }
}
