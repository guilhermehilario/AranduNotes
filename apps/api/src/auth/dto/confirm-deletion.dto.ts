import { IsString, MinLength, MaxLength } from 'class-validator';

export class ConfirmDeletionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  token: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  code: string;
}
