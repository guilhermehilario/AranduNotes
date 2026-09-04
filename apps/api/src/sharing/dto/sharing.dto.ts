import { IsArray, IsBoolean, IsEmail, IsIn, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
import { SHAREABLE_TYPES } from "../sharing.types";

export const SHARE_PERMISSIONS = ["viewer", "editor"] as const;

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

  @IsOptional()
  @IsIn(SHARE_PERMISSIONS as unknown as string[])
  permission?: "viewer" | "editor";

  @IsOptional()
  @IsBoolean()
  canEditContent?: boolean;

  @IsOptional()
  @IsBoolean()
  canCreateLeaves?: boolean;

  @IsOptional()
  @IsBoolean()
  canUploadFiles?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID("all", { each: true })
  leafIds?: string[];
}

export class UpdateSharePermissionDto {
  @IsIn(SHARE_PERMISSIONS as unknown as string[])
  permission: "viewer" | "editor";

  @IsOptional()
  @IsBoolean()
  canEditContent?: boolean;

  @IsOptional()
  @IsBoolean()
  canCreateLeaves?: boolean;

  @IsOptional()
  @IsBoolean()
  canUploadFiles?: boolean;
}

export class SetShareScopeDto {
  @IsArray()
  @IsUUID("all", { each: true })
  leafIds: string[];
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