import { IsBoolean, IsNumber, IsArray, IsObject, IsOptional } from 'class-validator';

export class SaveSessionDto {
  @IsOptional()
  @IsNumber()
  currentIndex?: number;

  @IsOptional()
  @IsNumber()
  reviewedCount?: number;

  @IsOptional()
  @IsBoolean()
  showAnswer?: boolean;

  @IsOptional()
  @IsBoolean()
  sessionActive?: boolean;

  @IsOptional()
  @IsArray()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  flashcards?: any[];

  @IsOptional()
  @IsArray()
  completedCardIds?: string[];

  @IsOptional()
  @IsObject()
  scores?: Record<string, number>;
}
