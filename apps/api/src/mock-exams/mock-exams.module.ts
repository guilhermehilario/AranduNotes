import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MockExamsController } from './mock-exams.controller';
import { MockExamsService } from './mock-exams.service';

@Module({
  imports: [AuthModule],
  controllers: [MockExamsController],
  providers: [MockExamsService],
  exports: [MockExamsService],
})
export class MockExamsModule {}
