import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SharingModule } from '../sharing/sharing.module';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
  imports: [AuthModule, SharingModule],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
