import { Module } from "@nestjs/common";
import { FriendsController } from "./friends.controller";
import { FriendsService } from "./friends.service";
import { MessagesService } from "./messages.service";

@Module({
  controllers: [FriendsController],
  providers: [FriendsService, MessagesService],
  exports: [FriendsService, MessagesService],
})
export class FriendsModule {}
