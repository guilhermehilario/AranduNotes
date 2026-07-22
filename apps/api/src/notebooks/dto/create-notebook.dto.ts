import { IsString, IsOptional, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateNotebookDto {
  @IsString()
  @MinLength(1, { message: 'O título do caderno é obrigatório' })
  @MaxLength(50, { message: 'Título muito longo (máx. 50 caracteres)' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Descrição muito longa' })
  description?: string | null;

  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Cor inválida (deve ser hex, ex: #FF0000)',
  })
  color: string;
}
