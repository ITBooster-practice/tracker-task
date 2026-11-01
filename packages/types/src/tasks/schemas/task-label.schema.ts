import { z } from 'zod'

export const MAX_TASK_LABELS = 20
export const MAX_TASK_LABEL_LENGTH = 40

export const normalizeTaskLabelName = (value: string) =>
	value.normalize('NFC').trim().replace(/\s+/gu, ' ')

export const taskLabelKey = (value: string) =>
	normalizeTaskLabelName(value).toLocaleLowerCase('ru-RU')

export const taskLabelNameSchema = z
	.string({ message: 'Название метки должно быть строкой' })
	.transform(normalizeTaskLabelName)
	.pipe(
		z
			.string()
			.min(1, 'Введите название метки')
			.max(
				MAX_TASK_LABEL_LENGTH,
				`Название метки — не более ${MAX_TASK_LABEL_LENGTH} символов`,
			),
	)

export const taskLabelsSchema = z
	.array(taskLabelNameSchema)
	.max(MAX_TASK_LABELS, `У задачи может быть не более ${MAX_TASK_LABELS} меток`)
	.transform((labels) => {
		const unique = new Map<string, string>()
		for (const name of labels) {
			const key = taskLabelKey(name)
			if (!unique.has(key)) unique.set(key, name)
		}
		return [...unique.values()]
	})

export const taskLabelsQuerySchema = z.object({
	search: z.string().trim().max(100).optional(),
})

export type TaskLabelsQuery = z.infer<typeof taskLabelsQuerySchema>
