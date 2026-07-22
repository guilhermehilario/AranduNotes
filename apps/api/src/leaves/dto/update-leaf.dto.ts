import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateLeafDto } from './create-leaf.dto';

export class UpdateLeafDto extends PartialType(CreateLeafDto) {
  @IsOptional()
  @IsString()
  summary?: string | null;
}
