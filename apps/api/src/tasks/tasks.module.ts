import { Module } from '@nestjs/common'
import { TasksService } from './tasks.service'
import { TasksController } from './tasks.controller'
import { BoardTasksService } from './board-tasks.service'

@Module({
	providers: [TasksService, BoardTasksService],
	controllers: [TasksController],
	exports: [TasksService],
})
export class TasksModule {}
