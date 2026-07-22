import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotebooksService } from './notebooks.service';
import { CreateNotebookDto } from './dto/create-notebook.dto';
import { UpdateNotebookDto } from './dto/update-notebook.dto';

@Controller('notebooks')
@UseGuards(JwtAuthGuard)
export class NotebooksController {
  constructor(private readonly notebooksService: NotebooksService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.notebooksService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notebooksService.findOne(id, userId);
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateNotebookDto,
  ) {
    return this.notebooksService.create(userId, dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNotebookDto,
  ) {
    return this.notebooksService.update(id, userId, dto);
  }
}
