import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: 'A senha atual é obrigatória' })
  @MaxLength(128, { message: 'A senha atual deve ter no máximo 128 caracteres' })
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres' })
  @MaxLength(128, { message: 'A nova senha deve ter no máximo 128 caracteres' })
  newPassword: string;
}
