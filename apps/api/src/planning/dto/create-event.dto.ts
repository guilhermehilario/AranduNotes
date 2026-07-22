import { IsString, IsOptional, IsDateString, MinLength, MaxLength } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsString()
  type?: string; // "agenda" | "cronograma"

  @IsOptional()
  @IsString()
  status?: string; // "pending" | "completed" | "cancelled"
}
