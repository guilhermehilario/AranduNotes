import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  // ── CRUD Tags ──

  @Get('tags')
  findAll(@CurrentUser('id') userId: string) {
    return this.tagsService.findAll(userId);
  }

  @Get('tags/:id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tagsService.findOne(id, userId);
  }

  @Post('tags')
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTagDto) {
    return this.tagsService.create(userId, dto);
  }

  @Put('tags/:id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTagDto,
  ) {
    return this.tagsService.update(id, userId, dto);
  }

  @Delete('tags/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tagsService.remove(id, userId);
  }

  // ── Leaf-Tag associations ──

  @Get('leaves/:leafId/tags')
  getLeafTags(@Param('leafId') leafId: string, @CurrentUser('id') userId: string) {
    return this.tagsService.getLeafTags(leafId, userId);
  }

  @Post('leaves/:leafId/tags/:tagId')
  addTagToLeaf(
    @Param('leafId') leafId: string,
    @Param('tagId') tagId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tagsService.addTagToLeaf(leafId, tagId, userId);
  }

  @Delete('leaves/:leafId/tags/:tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTagFromLeaf(
    @Param('leafId') leafId: string,
    @Param('tagId') tagId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tagsService.removeTagFromLeaf(leafId, tagId, userId);
  }
}
