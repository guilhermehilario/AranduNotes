import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { PomodoroController } from './pomodoro.controller';
import { PomodoroService } from './pomodoro.service';

@Module({
  controllers: [EventsController, GoalsController, PomodoroController],
  providers: [EventsService, GoalsService, PomodoroService],
  exports: [EventsService, GoalsService, PomodoroService],
})
export class PlanningModule {}
