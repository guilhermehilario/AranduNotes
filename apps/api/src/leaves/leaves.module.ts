import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TrashModule } from '../trash/trash.module';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';
import { AiLeavesService } from './ai-leaves.service';
import { AiMockService } from './utils/ai-mock.service';

@Module({
  imports: [AuthModule, TrashModule],
  controllers: [LeavesController],
  providers: [LeavesService, AiLeavesService, AiMockService],
  exports: [LeavesService],
})
export class LeavesModule {}
