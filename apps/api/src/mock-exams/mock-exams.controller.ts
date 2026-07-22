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
import { MockExamsService } from './mock-exams.service';
import { CreateMockExamDto, AddQuestionToExamDto } from './dto/create-mock-exam.dto';

@UseGuards(JwtAuthGuard)
@Controller('mock-exams')
export class MockExamsController {
  constructor(private readonly mockExamsService: MockExamsService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('notebookId') notebookId?: string,
  ) {
    return this.mockExamsService.findAll(userId, notebookId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.mockExamsService.findOne(id, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateMockExamDto) {
    return this.mockExamsService.create(userId, dto);
  }

  @Post('generate/:notebookId')
  @HttpCode(HttpStatus.CREATED)
  generateFromNotebook(
    @Param('notebookId') notebookId: string,
    @CurrentUser('id') userId: string,
    @Query('title') title?: string,
  ) {
    return this.mockExamsService.generateFromNotebook(userId, notebookId, title);
  }

  @Post(':examId/questions')
  @HttpCode(HttpStatus.CREATED)
  addQuestion(
    @Param('examId') examId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddQuestionToExamDto,
  ) {
    return this.mockExamsService.addQuestion(examId, dto.questionId, userId);
  }

  @Delete(':examId/questions/:questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeQuestion(
    @Param('examId') examId: string,
    @Param('questionId') questionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.mockExamsService.removeQuestion(examId, questionId, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.mockExamsService.remove(id, userId);
  }
}
