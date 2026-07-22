import { IsInt, Min, Max } from 'class-validator';

export class ReviewFlashcardDto {
  @IsInt({ message: 'Score deve ser um número inteiro' })
  @Min(0, { message: 'Score mínimo é 0' })
  @Max(5, { message: 'Score máximo é 5' })
  score: number;
}
