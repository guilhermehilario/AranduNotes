import { Module } from '@nestjs/common';
import { TrashService } from './trash.service';
import { TrashController } from './trash.controller';
import { EditHistoryService } from './edit-history.service';

@Module({
  controllers: [TrashController],
  providers: [TrashService, EditHistoryService],
  exports: [TrashService, EditHistoryService],
})
export class TrashModule {}
