import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BookmarksService } from './bookmarks.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get('bookmarks')
  findAll(@CurrentUser('id') userId: string) {
    return this.bookmarksService.findAll(userId);
  }

  @Get('bookmarks/:id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.bookmarksService.findOne(id, userId);
  }

  @Post('bookmarks')
  create(
    @CurrentUser('id') userId: string,
    @Body()
    data: {
      leafId?: string;
      notebookId?: string;
      title: string;
      path: string;
    },
  ) {
    return this.bookmarksService.create(userId, data);
  }

  @Delete('bookmarks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.bookmarksService.remove(id, userId);
  }


}
