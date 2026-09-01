import {
  IsString,
  IsOptional,
  IsIn,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';

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
  @MaxLength(5) // "HH:mm"
  time?: string;

  @IsOptional()
  @IsString()
  @IsIn(['agenda', 'cronograma'])
  type?: string;

  @IsOptional()
  @IsString()
  @IsIn(['pending', 'completed', 'cancelled'])
  status?: string;
}
