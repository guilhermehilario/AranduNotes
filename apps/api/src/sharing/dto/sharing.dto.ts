import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
import { SHAREABLE_TYPES } from "../sharing.types";

export class CreateShareDto {
  @IsIn(SHAREABLE_TYPES as unknown as string[])
  resourceType: string;

  @IsUUID()
  resourceId: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class ListSharesDto {
  @IsIn(SHAREABLE_TYPES as unknown as string[])
  resourceType: string;

  @IsUUID()
  resourceId: string;
}

export class SetPublicDto {
  @IsBoolean()
  isPublic: boolean;
}

export class PublicTokenDto {
  @IsString()
  @MinLength(16)
  token: string;
}