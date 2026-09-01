import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateFlashcardDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  front?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  back?: string;
}
