import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/create-question.dto';

@UseGuards(JwtAuthGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('notebookId') notebookId?: string,
  ) {
    return this.questionsService.findAll(userId, notebookId);
  }

  @Get('random')
  getRandom(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('notebookId') notebookId?: string,
  ) {
    return this.questionsService.getRandomQuestions(
      userId,
      limit ? parseInt(limit, 10) : 10,
      notebookId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.questionsService.findOne(id, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateQuestionDto) {
    return this.questionsService.create(userId, dto);
  }

  @Post('from-flashcard/:flashcardId')
  @HttpCode(HttpStatus.CREATED)
  generateFromFlashcard(
    @Param('flashcardId') flashcardId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.questionsService.generateFromFlashcard(flashcardId, userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.questionsService.remove(id, userId);
  }
}
