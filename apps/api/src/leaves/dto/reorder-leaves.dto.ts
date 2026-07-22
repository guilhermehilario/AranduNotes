import { IsString, IsUUID, IsArray, ArrayNotEmpty, IsOptional } from 'class-validator';

export class ReorderLeavesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  orderedIds: string[];

  @IsOptional()
  @IsString()
  parentId?: string;
}
