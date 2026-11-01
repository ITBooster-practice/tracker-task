import { BadRequestException } from '@nestjs/common'
import { Prisma, TaskStatus, type BoardColumn } from 'generated/prisma/client'
import { taskLabelsInclude } from './task-labels.util'

export type OrderedTask = {
	id: string
	boardColumnId: string
	position: number
	version: number
	priority: string
	assigneeId: string | null
	createdById: string
}

const byPosition = (a: OrderedTask, b: OrderedTask) =>
	a.position - b.position || a.id.localeCompare(b.id)

// The caller must lock all affected boards before locking tasks.
export function lockColumnTasks(
	tx: Prisma.TransactionClient,
	projectId: string,
	columnIds: string[],
) {
	return tx.$queryRaw<OrderedTask[]>(Prisma.sql`
		SELECT "id", "boardColumnId", "position", "version", "priority", "assigneeId", "createdById" FROM "Task"
		WHERE "projectId" = ${projectId} AND "boardColumnId" IN (${Prisma.join(columnIds)})
		ORDER BY "id" FOR UPDATE
	`)
}

export async function updateTaskPlacement(
	tx: Prisma.TransactionClient,
	options: {
		projectId: string
		source: BoardColumn
		target: BoardColumn
		moving: OrderedTask
		tasks: OrderedTask[]
		expectedVersion: number
		// An omitted position appends a transfer, preserving a task already in the target.
		position?: number
		data?: Prisma.TaskUncheckedUpdateInput
	},
) {
	const { projectId, source, target, moving, tasks, expectedVersion, data } = options
	const preservePosition = source.id === target.id && options.position === undefined
	const targetTasks = tasks
		.filter((task) => task.boardColumnId === target.id && task.id !== moving.id)
		.sort(byPosition)
	const position = preservePosition
		? moving.position
		: (options.position ?? targetTasks.length)
	if (!preservePosition && position > targetTasks.length) {
		throw new BadRequestException('Позиция задачи выходит за границы колонки')
	}
	const updated = await tx.task.update({
		include: taskLabelsInclude,
		where: {
			id: moving.id,
			projectId,
			boardColumnId: source.id,
			version: expectedVersion,
		},
		data: {
			...data,
			boardColumnId: target.id,
			position,
			version: { increment: 1 },
			...(target.isSystem && Object.values(TaskStatus).includes(target.key as TaskStatus)
				? { status: target.key as TaskStatus }
				: {}),
		},
	})
	if (preservePosition) return updated

	targetTasks.splice(position, 0, moving)
	await setPositions(
		tx,
		targetTasks
			.map((task, nextPosition) => ({ ...task, nextPosition }))
			.filter((task) => task.id !== moving.id),
	)
	if (source.id !== target.id) {
		const remaining = tasks
			.filter((task) => task.boardColumnId === source.id && task.id !== moving.id)
			.sort(byPosition)
		await setPositions(
			tx,
			remaining.map((task, nextPosition) => ({ ...task, nextPosition })),
		)
	}
	return updated
}

async function setPositions(
	tx: Prisma.TransactionClient,
	tasks: (OrderedTask & { nextPosition: number })[],
) {
	const changed = tasks.filter((task) => task.position !== task.nextPosition)
	for (let offset = 0; offset < changed.length; offset += 500) {
		const rows = changed
			.slice(offset, offset + 500)
			.map((task) => Prisma.sql`(${task.id}, ${task.nextPosition}::integer)`)
		await tx.$executeRaw(Prisma.sql`
			UPDATE "Task" AS task SET "position" = ordered.position, "version" = task."version" + 1, "updatedAt" = ${new Date()}
			FROM (VALUES ${Prisma.join(rows)}) AS ordered(id, position) WHERE task."id" = ordered.id
		`)
	}
}
