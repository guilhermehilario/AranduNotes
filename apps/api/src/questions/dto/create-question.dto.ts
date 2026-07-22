import { IsString, IsOptional, IsIn, MinLength, MaxLength, IsUUID } from 'class-validator';

export class CreateQuestionDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  leafId?: string;

  @IsString()
  @IsUUID()
  notebookId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  question: string;

  @IsOptional()
  @IsString()
  options?: string; // JSON array de opções

  @IsString()
  @MinLength(1)
  correctAnswer: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  explanation?: string;

  @IsOptional()
  @IsIn(['multiple_choice', 'true_false', 'short_answer'])
  questionType?: string;
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  question?: string;

  @IsOptional()
  @IsString()
  options?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  correctAnswer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  explanation?: string;

  @IsOptional()
  @IsIn(['multiple_choice', 'true_false', 'short_answer'])
  questionType?: string;
}
