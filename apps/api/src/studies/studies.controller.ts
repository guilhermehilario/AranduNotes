import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StudiesService } from './studies.service';

@UseGuards(JwtAuthGuard)
@Controller('studies')
export class StudiesController {
  constructor(private readonly studiesService: StudiesService) {}

  @Get('content')
  getAllContent(
    @CurrentUser('id') userId: string,
    @Query('notebookId') notebookId?: string,
  ) {
    return this.studiesService.getAllStudyContent(userId, notebookId);
  }

  @Get('stats')
  getStats(@CurrentUser('id') userId: string) {
    return this.studiesService.getStats(userId);
  }
}
