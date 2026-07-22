import { IsString, IsOptional, IsInt, Min, MaxLength, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMockExamDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  timeLimit?: number;

  @IsOptional()
  @IsString()
  @IsUUID()
  notebookId?: string;
}

export class AddQuestionToExamDto {
  @IsString()
  @IsUUID()
  questionId: string;
}
