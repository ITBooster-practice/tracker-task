import { normalizeTaskLabelName, taskLabelKey } from '@repo/types'
import type { Prisma } from 'generated/prisma/client'

export const taskLabelsInclude = {
	labelAssignments: {
		select: { label: { select: { name: true } } },
		orderBy: { label: { key: 'asc' } },
	},
} as const satisfies Prisma.TaskInclude

export function serializeTaskLabels<
	T extends { labelAssignments: { label: { name: string } }[] },
>(task: T) {
	const { labelAssignments, ...data } = task
	return { ...data, labels: labelAssignments.map(({ label }) => label.name) }
}

export const escapeTaskSearch = (search: string) => search.replace(/[\\%_]/g, '\\$&')

export async function resolveTaskLabels(
	tx: Prisma.TransactionClient,
	projectId: string,
	labels: string[],
) {
	const names = new Map<string, string>()
	for (const value of labels) {
		const name = normalizeTaskLabelName(value)
		const key = taskLabelKey(name)
		if (!names.has(key)) names.set(key, name)
	}
	const keys = [...names.keys()].sort()
	if (!keys.length) return []
	// Deterministic insertion order also avoids lock inversion for overlapping sets.
	await tx.taskLabel.createMany({
		data: keys.map((key) => ({ projectId, key, name: names.get(key)! })),
		skipDuplicates: true,
	})
	return tx.taskLabel.findMany({
		where: { projectId, key: { in: keys } },
		select: { id: true },
		orderBy: { key: 'asc' },
	})
}
