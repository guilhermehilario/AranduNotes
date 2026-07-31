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
  flashcards?: Array<Record<string, unknown>>;

  @IsOptional()
  @IsArray()
  completedCardIds?: string[];

  @IsOptional()
  @IsObject()
  scores?: Record<string, number>;
}
