import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { PRESENCE_STATUSES } from "../friends.types";

export class SendFriendRequestDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;
}

export class SetPresenceDto {
  @IsIn(PRESENCE_STATUSES as unknown as string[])
  status: string;
}

export class SearchUsersDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(80)
  q: string;
}

export class ContentRefDto {
  @IsString()
  @IsNotEmpty()
  resourceType: string;

  @IsUUID()
  resourceId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsIn(["viewer", "editor"])
  permission?: "viewer" | "editor";
}

export class SendMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  content?: string;

  @IsOptional()
  @IsIn(["text", "content_link"])
  contentType?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ContentRefDto)
  contentRef?: ContentRefDto;
}

export class ListMessagesDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
