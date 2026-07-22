import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LeavesService } from './leaves.service';
import { CreateLeafDto } from './dto/create-leaf.dto';
import { UpdateLeafDto } from './dto/update-leaf.dto';
import { ReorderLeavesDto } from './dto/reorder-leaves.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Get('notebooks/:notebookId/leaves')
  findByNotebook(
    @Param('notebookId') notebookId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.leavesService.findByNotebook(notebookId, userId);
  }

  @Post('notebooks/:notebookId/leaves')
  create(
    @Param('notebookId') notebookId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateLeafDto,
  ) {
    return this.leavesService.create(notebookId, userId, dto);
  }

  @Get('notebooks/:notebookId/leaves/hierarchy')
  getLeafHierarchy(
    @Param('notebookId') notebookId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.leavesService.getLeafHierarchy(notebookId, userId);
  }

  @Get('leaves/archived')
  findArchived(@CurrentUser('id') userId: string) {
    return this.leavesService.findArchived(userId);
  }

  @Get('leaves/:leafId')
  findOne(@Param('leafId') leafId: string, @CurrentUser('id') userId: string) {
    return this.leavesService.findOne(leafId, userId);
  }

  @Put('leaves/:leafId')
  update(
    @Param('leafId') leafId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLeafDto,
  ) {
    return this.leavesService.update(leafId, userId, dto);
  }

  @Patch('leaves/reorder')
  reorder(
    @CurrentUser('id') userId: string,
    @Body() dto: ReorderLeavesDto,
  ) {
    return this.leavesService.reorder(userId, dto);
  }

  @Post('leaves/:leafId/summary')
  generateSummary(
    @Param('leafId') leafId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.leavesService.generateSummary(leafId, userId);
  }

  @Post('leaves/:leafId/flashcards')
  generateFlashcards(
    @Param('leafId') leafId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.leavesService.generateFlashcards(leafId, userId);
  }

  @Get('leaves/:leafId/flashcards')
  findFlashcards(
    @Param('leafId') leafId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.leavesService.findFlashcards(leafId, userId);
  }

  @Post('leaves/:leafId/archive')
  archive(
    @Param('leafId') leafId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.leavesService.archive(leafId, userId);
  }

  @Post('leaves/:leafId/unarchive')
  unarchive(
    @Param('leafId') leafId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.leavesService.unarchive(leafId, userId);
  }
}
