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
  @MaxLength(10000)
  options?: string; // JSON array de opções

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  correctAnswer: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  explanation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  theme?: string;

  @IsOptional()
  @IsIn(['multiple_choice', 'true_false', 'short_answer', 'dissertative'])
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
  @MaxLength(10000)
  options?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  correctAnswer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  explanation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  theme?: string;

  @IsOptional()
  @IsIn(['multiple_choice', 'true_false', 'short_answer', 'dissertative'])
  questionType?: string;
}
