import { IsString } from 'class-validator';

export class ConfirmDeletionDto {
  @IsString()
  token: string;

  @IsString()
  code: string;
}
