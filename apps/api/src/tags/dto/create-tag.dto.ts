import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Cor inválida (deve ser hex, ex: #FF0000)',
  })
  color?: string;
}
