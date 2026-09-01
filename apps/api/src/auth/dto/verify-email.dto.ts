import { IsString, MinLength, MaxLength } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  token: string;
}
