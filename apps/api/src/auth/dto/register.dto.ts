import { IsString, IsEmail, MinLength, MaxLength, IsBoolean, Equals } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'O nome deve ter pelo menos 2 caracteres' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres' })
  name: string;

  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  @MaxLength(128, { message: 'A senha deve ter no máximo 128 caracteres' })
  password: string;

  @IsBoolean({ message: 'O campo de aceite dos Termos deve ser um valor booleano' })
  @Equals(true, { message: 'Você deve aceitar os Termos de Uso e Responsabilidade para criar uma conta.' })
  acceptedTerms: boolean;
}
