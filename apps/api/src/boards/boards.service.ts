import {
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { Prisma, TeamRole } from 'generated/prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { boardData } from './default-board'
import { CreateBoardDto } from './dto/create-board.dto'
import { UpdateBoardDto } from './dto/update-board.dto'

const boardInclude = {
	columns: {
		orderBy: { position: 'asc' },
		include: { _count: { select: { tasks: true } } },
	},
} as const

const toBoardListItem = (
	board: Prisma.BoardGetPayload<{ include: typeof boardInclude }>,
) => {
	let taskCount = 0
	const columns = board.columns.map(({ _count, ...column }) => {
		taskCount += _count.tasks
		return column
	})
	return { ...board, taskCount, columns }
}

@Injectable()
export class BoardsService {
	constructor(private readonly prisma: PrismaService) {}

	private async assertAccess(
		teamId: string,
		projectId: string,
		userId: string,
		manage = false,
	) {
		const member = await this.prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId } },
		})
		if (!member) throw new ForbiddenException('У вас нет доступа к этой команде')

		const project = await this.prisma.project.findFirst({
			where: { id: projectId, teamId },
			select: { id: true },
		})
		if (!project) throw new NotFoundException('Проект не найден в этой команде')

		if (manage && member.role !== TeamRole.OWNER && member.role !== TeamRole.ADMIN) {
			throw new ForbiddenException('Управлять досками могут только OWNER и ADMIN')
		}
	}

	async findAll(teamId: string, projectId: string, userId: string) {
		await this.assertAccess(teamId, projectId, userId)
		const boards = await this.prisma.board.findMany({
			where: { projectId },
			include: boardInclude,
			orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
		})
		return boards.map(toBoardListItem)
	}

	async create(teamId: string, projectId: string, userId: string, dto: CreateBoardDto) {
		await this.assertAccess(teamId, projectId, userId, true)
		try {
			const board = await this.prisma.board.create({
				data: { projectId, ...boardData(dto.name) },
				include: boardInclude,
			})
			return toBoardListItem(board)
		} catch (error) {
			this.writeError(error, 'create')
		}
	}

	async update(
		teamId: string,
		projectId: string,
		boardId: string,
		userId: string,
		dto: UpdateBoardDto,
	) {
		await this.assertAccess(teamId, projectId, userId, true)
		try {
			const board = await this.prisma.board.update({
				where: { id: boardId, projectId },
				data: { name: dto.name },
				include: boardInclude,
			})
			return toBoardListItem(board)
		} catch (error) {
			this.writeError(error, 'update')
		}
	}

	async remove(teamId: string, projectId: string, boardId: string, userId: string) {
		await this.assertAccess(teamId, projectId, userId, true)
		const board = await this.prisma.board.findUnique({
			where: { id: boardId, projectId },
			select: { isDefault: true },
		})
		if (!board) throw new NotFoundException('Доска не найдена в этом проекте')
		if (board.isDefault) throw new ConflictException('Нельзя удалить основную доску')

		try {
			await this.prisma.board.delete({
				where: { id: boardId, projectId, isDefault: false },
			})
		} catch (error) {
			this.writeError(error, 'delete')
		}
	}

	private writeError(error: unknown, operation: 'create' | 'update' | 'delete'): never {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === 'P2002') {
				throw new ConflictException('Доска с таким названием уже существует в проекте')
			}
			if (error.code === 'P2025' || (error.code === 'P2003' && operation === 'create')) {
				throw new NotFoundException('Доска или проект больше не существует')
			}
			if (error.code === 'P2003' && operation === 'delete') {
				throw new ConflictException('Перед удалением доски перенесите её задачи')
			}
		}
		throw error
	}
}
