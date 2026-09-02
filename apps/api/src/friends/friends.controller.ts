import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { FriendsService } from "./friends.service";
import { MessagesService } from "./messages.service";
import {
  ListMessagesDto,
  SearchUsersDto,
  SendFriendRequestDto,
  SendMessageDto,
  SetPresenceDto,
} from "./dto/friends.dto";

@Controller("friends")
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(
    private readonly friends: FriendsService,
    private readonly messages: MessagesService,
  ) {}

  // ── Presença / status ──────────────────────────────────────────────────

  @Get("presence/me")
  async myPresence(@CurrentUser("id") userId: string) {
    return this.friends.getMyPresence(userId);
  }

  @Put("status")
  async setStatus(
    @CurrentUser("id") userId: string,
    @Body() dto: SetPresenceDto,
  ) {
    return this.friends.setStatus(userId, dto.status);
  }

  @Post("heartbeat")
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async heartbeat(@CurrentUser("id") userId: string) {
    return this.friends.heartbeat(userId);
  }

  // ── Código de amigo ─────────────────────────────────────────────────────

  @Get("code")
  async myFriendCode(@CurrentUser("id") userId: string) {
    return this.friends.getMyFriendCode(userId);
  }

  // ── Solicitações ───────────────────────────────────────────────────────

  @Post("requests")
  async sendRequest(
    @CurrentUser("id") userId: string,
    @Body() dto: SendFriendRequestDto,
  ) {
    return this.friends.sendRequest(userId, {
      userId: dto.userId,
      email: dto.email,
      code: dto.code,
    });
  }

  @Get("requests")
  async listRequests(@CurrentUser("id") userId: string) {
    return this.friends.listRequests(userId);
  }

  @Post("requests/:id/accept")
  async acceptRequest(
    @CurrentUser("id") userId: string,
    @Param("id") requestId: string,
  ) {
    return this.friends.acceptRequest(requestId, userId);
  }

  @Post("requests/:id/decline")
  async declineRequest(
    @CurrentUser("id") userId: string,
    @Param("id") requestId: string,
  ) {
    return this.friends.declineRequest(requestId, userId);
  }

  @Post("requests/:id/cancel")
  async cancelRequest(
    @CurrentUser("id") userId: string,
    @Param("id") requestId: string,
  ) {
    return this.friends.cancelRequest(requestId, userId);
  }

  // ── Amigos ─────────────────────────────────────────────────────────────

  @Get()
  async listFriends(@CurrentUser("id") userId: string) {
    return this.friends.listFriends(userId);
  }

  @Delete(":friendId")
  async removeFriend(
    @CurrentUser("id") userId: string,
    @Param("friendId") friendId: string,
  ) {
    return this.friends.removeFriend(userId, friendId);
  }

  @Get("search")
  async searchUsers(
    @CurrentUser("id") userId: string,
    @Query() query: SearchUsersDto,
  ) {
    return this.friends.searchUsers(userId, query.q);
  }

  // ── Mensagens ──────────────────────────────────────────────────────────

  @Get(":friendId/messages")
  async listMessages(
    @CurrentUser("id") userId: string,
    @Param("friendId") friendId: string,
    @Query() query: ListMessagesDto,
  ) {
    return this.messages.listConversation(userId, friendId, {
      cursor: query.cursor,
      limit: query.limit ? Number(query.limit) : undefined,
    });
  }

  @Post(":friendId/messages")
  async sendMessage(
    @CurrentUser("id") userId: string,
    @Param("friendId") friendId: string,
    @Body() dto: SendMessageDto,
  ) {
    if (dto.contentType === "content_link" && dto.contentRef) {
      return this.messages.sendContentLink(userId, friendId, dto.contentRef);
    }
    return this.messages.sendText(userId, friendId, dto.content ?? "");
  }

  @Post(":friendId/read")
  async markRead(
    @CurrentUser("id") userId: string,
    @Param("friendId") friendId: string,
  ) {
    return this.messages.markConversationRead(userId, friendId);
  }
}
