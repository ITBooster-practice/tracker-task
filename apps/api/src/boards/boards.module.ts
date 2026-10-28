import { Module } from '@nestjs/common'
import { BoardColumnsController } from './board-columns.controller'
import { BoardColumnsService } from './board-columns.service'
import { BoardsController } from './boards.controller'
import { BoardsService } from './boards.service'

@Module({
	controllers: [BoardsController, BoardColumnsController],
	providers: [BoardsService, BoardColumnsService],
})
export class BoardsModule {}
