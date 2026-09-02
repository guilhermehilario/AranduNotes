import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SharingModule } from '../sharing/sharing.module';
import { FlashcardsController } from './flashcards.controller';
import { FlashcardsService } from './flashcards.service';

@Module({
  imports: [AuthModule, SharingModule],
  controllers: [FlashcardsController],
  providers: [FlashcardsService],
  exports: [FlashcardsService],
})
export class FlashcardsModule {}
