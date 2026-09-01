import { IsString, IsOptional, MinLength, MaxLength, IsUUID } from 'class-validator';

export class CreateBookmarkDto {
  @IsString()
  @MinLength(1, { message: 'O título é obrigatório' })
  @MaxLength(200, { message: 'O título deve ter no máximo 200 caracteres' })
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500, { message: 'O caminho deve ter no máximo 500 caracteres' })
  path: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  leafId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  notebookId?: string;
}