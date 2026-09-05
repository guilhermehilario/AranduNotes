import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: 'A senha atual é obrigatória' })
  @MaxLength(128, { message: 'A senha atual deve ter no máximo 128 caracteres' })
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres' })
  @MaxLength(128, { message: 'A nova senha deve ter no máximo 128 caracteres' })
  @Matches(/[A-Z]/, { message: 'A nova senha deve conter pelo menos uma letra maiúscula' })
  @Matches(/[a-z]/, { message: 'A nova senha deve conter pelo menos uma letra minúscula' })
  @Matches(/\d/, { message: 'A nova senha deve conter pelo menos um número' })
  newPassword: string;
}
