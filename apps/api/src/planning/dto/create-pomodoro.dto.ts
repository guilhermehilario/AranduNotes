import { IsString, IsOptional, IsInt, IsBoolean, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreatePomodoroDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  taskName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  duration?: number;
}

export class UpdatePomodoroDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  taskName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  duration?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
