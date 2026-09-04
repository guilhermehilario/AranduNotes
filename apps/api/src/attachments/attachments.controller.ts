import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AttachmentsService, MAX_FILE_SIZE } from "./attachments.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post("leaves/:leafId/attachments")
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  upload(
    @Param("leafId") leafId: string,
    @CurrentUser("id") userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.attachmentsService.upload(leafId, userId, file);
  }

  @Get("leaves/:leafId/attachments")
  list(
    @Param("leafId") leafId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.attachmentsService.list(leafId, userId);
  }

  @Get("leaves/:leafId/attachments/:attachmentId")
  getOne(
    @Param("leafId") leafId: string,
    @Param("attachmentId") attachmentId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.attachmentsService.getOne(leafId, attachmentId, userId);
  }

  @Delete("attachments/:attachmentId")
  remove(
    @Param("attachmentId") attachmentId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.attachmentsService.remove(attachmentId, userId);
  }
}