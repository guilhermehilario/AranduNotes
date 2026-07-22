import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { NotebooksModule } from './notebooks/notebooks.module';
import { LeavesModule } from './leaves/leaves.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { StudyModule } from './study/study.module';
import { TagsModule } from './tags/tags.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { TrashModule } from './trash/trash.module';
import { TodosModule } from './todos/todos.module';
import { PlanningModule } from './planning/planning.module';
import { QuestionsModule } from './questions/questions.module';
import { MockExamsModule } from './mock-exams/mock-exams.module';
import { StudiesModule } from './studies/studies.module';
import { AppController } from './app.controller';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,      // 1 minuto
      limit: 60,        // 60 requisições por minuto (global)
    }]),
    PrismaModule,
    AuthModule,
    NotebooksModule,
    LeavesModule,
    FlashcardsModule,
    StudyModule,
    TagsModule,
    BookmarksModule,
    TrashModule,
    TodosModule,
    PlanningModule,
    QuestionsModule,
    MockExamsModule,
    StudiesModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: process.env.NODE_ENV === 'production',
          transform: true,
          transformOptions: {
            enableImplicitConversion: true,
          },
        }),
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
