import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  IsUUID,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
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

export class CreateExamFromQuestionsDto {
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

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  questionIds: string[];
}
