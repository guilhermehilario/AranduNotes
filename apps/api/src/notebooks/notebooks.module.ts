import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TrashModule } from '../trash/trash.module';
import { NotebooksController } from './notebooks.controller';
import { NotebooksService } from './notebooks.service';

@Module({
  imports: [AuthModule, TrashModule],
  controllers: [NotebooksController],
  providers: [NotebooksService],
  exports: [NotebooksService],
})
export class NotebooksModule {}
