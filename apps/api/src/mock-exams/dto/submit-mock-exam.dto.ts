import { IsObject, IsOptional } from 'class-validator';

export class SubmitMockExamDto {
  /** Respostas das questões objetivas: { questionId: resposta } */
  @IsOptional()
  @IsObject()
  answers?: Record<string, string>;

  /** Autoavaliação das questões dissertativas: { questionId: true|false } */
  @IsOptional()
  @IsObject()
  selfGrades?: Record<string, boolean>;
}