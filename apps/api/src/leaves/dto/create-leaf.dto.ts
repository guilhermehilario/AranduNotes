import { IsString, IsOptional, MinLength, MaxLength, IsUUID } from 'class-validator';

export class CreateLeafDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(200000)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200000)
  rawText?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  parentId?: string;
}
