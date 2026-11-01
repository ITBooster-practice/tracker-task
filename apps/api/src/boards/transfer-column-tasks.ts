import { ConflictException } from '@nestjs/common'
import { Prisma, TaskStatus, type BoardColumn } from 'generated/prisma/client'

export async function transferColumnTasks(
	tx: Prisma.TransactionClient,
	source: BoardColumn,
	target: BoardColumn,
) {
	const tasks = await tx.$queryRaw<{ id: string; position: number }[]>(Prisma.sql`
		SELECT "id", "position" FROM "Task"
		WHERE "boardColumnId" = ${source.id}
		ORDER BY "position", "id" FOR UPDATE
	`)
	if (!tasks.length) return
	tasks.sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
	const aggregate = await tx.task.aggregate({
		where: { boardColumnId: target.id },
		_max: { position: true },
	})
	const lastPosition = Math.max(-1, aggregate._max.position ?? -1)
	if (lastPosition + tasks.length > 2_147_483_647)
		throw new ConflictException('Недостаточно позиций в целевой колонке')
	const status =
		target.isSystem && Object.values(TaskStatus).includes(target.key as TaskStatus)
			? Prisma.sql`, "status" = ${target.key}::"TaskStatus"`
			: Prisma.empty
	for (let offset = 0; offset < tasks.length; offset += 500) {
		const positions = tasks
			.slice(offset, offset + 500)
			.map(
				(task, index) =>
					Prisma.sql`(${task.id}, ${lastPosition + offset + index + 1}::integer)`,
			)
		await tx.$executeRaw(Prisma.sql`
			UPDATE "Task" AS task
			SET "boardColumnId" = ${target.id}, "position" = moved.position,
				"version" = task."version" + 1, "updatedAt" = ${new Date()} ${status}
			FROM (VALUES ${Prisma.join(positions)}) AS moved(id, position)
			WHERE task."id" = moved.id AND task."boardColumnId" = ${source.id}
		`)
	}
}
