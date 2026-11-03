import {
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { Prisma, TeamRole } from 'generated/prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { boardData } from './default-board'
import { saveBoardSettings } from './board-settings'
import { CreateBoardDto } from './dto/create-board.dto'
import { UpdateBoardDto } from './dto/update-board.dto'
import { ArchiveBoardDto } from './dto/archive-board.dto'

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
			where: { projectId, archivedAt: null },
			include: boardInclude,
			orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
		})
		return boards.map(toBoardListItem)
	}

	async create(teamId: string, projectId: string, userId: string, dto: CreateBoardDto) {
		await this.assertAccess(teamId, projectId, userId, true)
		try {
			const board = await this.prisma.$transaction(async (tx) => {
				await this.lockProject(tx, projectId)
				const primary = await tx.board.findFirst({
					where: { projectId, archivedAt: null, isDefault: true },
					select: { id: true },
				})
				return tx.board.create({
					data: {
						projectId,
						...boardData(dto.name, !primary),
						description: dto.description,
						...(dto.columns && {
							columns: {
								create: dto.columns.map(({ key, title, color }, position) => ({
									key,
									title,
									color,
									position,
									isSystem:
										!primary &&
										['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].includes(key),
								})),
							},
						}),
					},
					include: boardInclude,
				})
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
			const update = (tx: Pick<Prisma.TransactionClient, 'board'>) =>
				tx.board.update({
					where: { id: boardId, projectId, archivedAt: null },
					data: {
						name: dto.name,
						...(dto.description !== undefined && { description: dto.description }),
					},
					include: boardInclude,
				})
			const board =
				dto.columns || dto.expectedUpdatedAt
					? await this.prisma.$transaction(
							async (tx) => {
								await saveBoardSettings(tx, projectId, boardId, dto)
								return update(tx)
							},
							{ timeout: 15_000 },
						)
					: await update(this.prisma)
			return toBoardListItem(board)
		} catch (error) {
			this.writeError(error, 'update')
		}
	}

	async remove(teamId: string, projectId: string, boardId: string, userId: string) {
		await this.assertAccess(teamId, projectId, userId, true)
		const board = await this.prisma.board.findUnique({
			where: { id: boardId, projectId, archivedAt: null },
			select: { isDefault: true },
		})
		if (!board) throw new NotFoundException('Доска не найдена в этом проекте')
		if (board.isDefault) throw new ConflictException('Нельзя удалить основную доску')

		try {
			await this.prisma.board.delete({
				where: { id: boardId, projectId, isDefault: false, archivedAt: null },
			})
		} catch (error) {
			this.writeError(error, 'delete')
		}
	}

	private async lockProject(tx: Prisma.TransactionClient, projectId: string) {
		const projects = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
			SELECT "id" FROM "Project" WHERE "id" = ${projectId} FOR NO KEY UPDATE
		`)
		if (!projects.length) throw new NotFoundException('Проект больше не существует')
	}

	async archive(
		teamId: string,
		projectId: string,
		boardId: string,
		userId: string,
		dto: ArchiveBoardDto,
	) {
		await this.assertAccess(teamId, projectId, userId, true)
		try {
			await this.prisma.$transaction(
				async (tx) => {
					await this.lockProject(tx, projectId)
					// Общий порядок блокировок совпадает с переносом задач между досками.
					await tx.$queryRaw(Prisma.sql`
					SELECT "id" FROM "Board" WHERE "projectId" = ${projectId}
					AND "archivedAt" IS NULL ORDER BY "id" FOR UPDATE
				`)
					const board = await tx.board.findUnique({
						where: { id: boardId, projectId, archivedAt: null },
					})
					if (!board) throw new NotFoundException('Доска не найдена в этом проекте')
					if (board.updatedAt.getTime() !== new Date(dto.expectedUpdatedAt).getTime()) {
						throw new ConflictException(
							'Настройки доски изменились. Откройте их заново перед архивацией.',
						)
					}
					await tx.board.update({
						where: { id: boardId, projectId, archivedAt: null },
						data: { archivedAt: new Date(), isDefault: false },
					})
					if (board.isDefault) {
						const next = await tx.board.findFirst({
							where: { projectId, archivedAt: null },
							orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
							select: { id: true },
						})
						if (next)
							await tx.board.update({ where: { id: next.id }, data: { isDefault: true } })
					}
				},
				{ timeout: 15_000 },
			)
		} catch (error) {
			this.writeError(error, 'update')
		}
	}

	private writeError(error: unknown, operation: 'create' | 'update' | 'delete'): never {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === 'P2002') {
				throw new ConflictException('Название доски или колонки уже занято')
			}
			if (error.code === 'P2025' || (error.code === 'P2003' && operation === 'create')) {
				throw new NotFoundException('Доска или проект больше не существует')
			}
			if (error.code === 'P2003' && operation === 'delete') {
				throw new ConflictException('Перед удалением доски перенесите её задачи')
			}
			if (
				['P2003', 'P2034'].includes(error.code) ||
				(error.code === 'P2010' &&
					['23503', '40P01', '40001'].includes(String(error.meta?.code)))
			)
				throw new ConflictException('Данные доски изменились, повторите операцию')
		}
		throw error
	}
}
