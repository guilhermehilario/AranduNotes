import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EditHistoryService } from './edit-history.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class EditHistoryController {
  constructor(private readonly editHistoryService: EditHistoryService) {}

  @Get('history/leaves/:leafId')
  getLeafHistory(
    @Param('leafId') leafId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.editHistoryService.getLeafHistory(leafId, userId);
  }

  @Get('history/notebooks/:notebookId')
  getNotebookHistory(
    @Param('notebookId') notebookId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.editHistoryService.getNotebookHistory(notebookId, userId);
  }

  @Get('history/recent')
  getRecentActivity(@CurrentUser('id') userId: string) {
    return this.editHistoryService.getRecentActivity(userId);
  }
}
