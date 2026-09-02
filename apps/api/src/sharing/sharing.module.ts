import { Module } from "@nestjs/common";
import { SharingController } from "./sharing.controller";
import { PublicContentController } from "./public-content.controller";
import { SharingService } from "./sharing.service";

@Module({
  controllers: [SharingController, PublicContentController],
  providers: [SharingService],
  exports: [SharingService],
})
export class SharingModule {}