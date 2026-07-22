import { IsString, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CreateFlashcardDto {
  @IsString()
  @IsUUID()
  leafId: string;

  @IsString()
  @IsUUID()
  notebookId: string;

  @IsString()
  @MinLength(1, { message: 'A pergunta do card é obrigatória' })
  @MaxLength(500, { message: 'Pergunta muito longa (máx. 500 caracteres)' })
  front: string;

  @IsString()
  @MinLength(1, { message: 'A resposta do card é obrigatória' })
  @MaxLength(1000, { message: 'Resposta muito longa (máx. 1000 caracteres)' })
  back: string;
}
