import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { SharingService } from "./sharing.service";
import {
  CreateShareDto,
  ListSharesDto,
  SetPublicDto,
  SetShareScopeDto,
} from "./dto/sharing.dto";
import { ResourceType } from "./sharing.types";

@Controller("shares")
@UseGuards(JwtAuthGuard)
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateShareDto,
  ) {
    return this.sharingService.createShare(
      userId,
      dto.resourceType as ResourceType,
      dto.resourceId,
      { email: dto.email, userId: dto.userId },
      dto.leafIds,
    );
  }

  @Get()
  async list(
    @CurrentUser("id") userId: string,
    @Query() query: ListSharesDto,
  ) {
    return this.sharingService.listShares(
      query.resourceType as ResourceType,
      query.resourceId,
      userId,
    );
  }

  @Get("inbox")
  async inbox(@CurrentUser("id") userId: string) {
    return this.sharingService.listSharedWithMe(userId);
  }

  @Delete(":id")
  async remove(@CurrentUser("id") userId: string, @Param("id") shareId: string) {
    await this.sharingService.removeShare(shareId, userId);
    return { success: true };
  }

  @Patch(":id/scope")
  async setScope(
    @CurrentUser("id") userId: string,
    @Param("id") shareId: string,
    @Body() dto: SetShareScopeDto,
  ) {
    return this.sharingService.setShareScope(shareId, userId, dto.leafIds);
  }

  @Patch(":type/:id/public")
  async setPublic(
    @CurrentUser("id") userId: string,
    @Param("type") type: ResourceType,
    @Param("id") resourceId: string,
    @Body() dto: SetPublicDto,
  ) {
    return this.sharingService.setPublic(userId, type, resourceId, dto.isPublic);
  }
}