import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TrashService } from './trash.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class TrashController {
  constructor(private readonly trashService: TrashService) {}

  @Get('trash')
  findAll(@CurrentUser('id') userId: string) {
    return this.trashService.findAll(userId);
  }

  // ── Soft-delete (mover para lixeira) ──

  @Post('trash/notebooks/:notebookId')
  softDeleteNotebook(
    @Param('notebookId') notebookId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.trashService.softDeleteNotebook(notebookId, userId);
  }

  @Post('trash/leaves/:leafId')
  softDeleteLeaf(
    @Param('leafId') leafId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.trashService.softDeleteLeaf(leafId, userId);
  }

  // ── Restore ──

  @Post('trash/notebooks/:notebookId/restore')
  restoreNotebook(
    @Param('notebookId') notebookId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.trashService.restoreNotebook(notebookId, userId);
  }

  @Post('trash/leaves/:leafId/restore')
  restoreLeaf(
    @Param('leafId') leafId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.trashService.restoreLeaf(leafId, userId);
  }

  // ── Permanent delete ──

  @Delete('trash/notebooks/:notebookId')
  @HttpCode(HttpStatus.NO_CONTENT)
  permanentDeleteNotebook(
    @Param('notebookId') notebookId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.trashService.permanentDeleteNotebook(notebookId, userId);
  }

  @Delete('trash/leaves/:leafId')
  @HttpCode(HttpStatus.NO_CONTENT)
  permanentDeleteLeaf(
    @Param('leafId') leafId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.trashService.permanentDeleteLeaf(leafId, userId);
  }

  // ── Clean old trash (15+ days) ──

  @Post('trash/clean')
  cleanOldTrash(@CurrentUser('id') userId: string) {
    return this.trashService.cleanOldTrash(userId);
  }
}
