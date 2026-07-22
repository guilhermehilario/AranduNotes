import { IsString, IsEmail, MinLength, IsBoolean, Equals } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'O nome deve ter pelo menos 2 caracteres' })
  name: string;

  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  password: string;

  @IsBoolean({ message: 'O campo de aceite dos Termos deve ser um valor booleano' })
  @Equals(true, { message: 'Você deve aceitar os Termos de Uso e Responsabilidade para criar uma conta.' })
  acceptedTerms: boolean;
}
