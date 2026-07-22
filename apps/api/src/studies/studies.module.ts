import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StudiesController } from './studies.controller';
import { StudiesService } from './studies.service';

@Module({
  imports: [AuthModule],
  controllers: [StudiesController],
  providers: [StudiesService],
  exports: [StudiesService],
})
export class StudiesModule {}
