import { Controller, Get, Post, Put, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FlashcardsService } from './flashcards.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { ReviewFlashcardDto } from './dto/review-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Post('flashcards')
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFlashcardDto,
  ) {
    return this.flashcardsService.create(userId, dto);
  }

  @Get('notebooks/:notebookId/flashcards')
  findByNotebook(
    @Param('notebookId') notebookId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.flashcardsService.findByNotebook(notebookId, userId);
  }

  @Put('flashcards/:cardId')
  update(
    @Param('cardId') cardId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateFlashcardDto,
  ) {
    return this.flashcardsService.update(cardId, userId, dto);
  }

  @Post('flashcards/:cardId/review')
  review(
    @Param('cardId') cardId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ReviewFlashcardDto,
  ) {
    return this.flashcardsService.review(cardId, userId, dto.score);
  }
}
