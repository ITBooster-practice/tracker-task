import { useBoardsList } from '@/shared/api/use-boards'

export function useTaskBoardColumns(teamId: string, projectId: string, columnId: string) {
	const query = useBoardsList(teamId, projectId)
	const board = query.data?.find((item) =>
		item.columns.some((column) => column.id === columnId),
	)
	return {
		columns: board?.columns ?? [],
		isPending: query.isPending,
		error: query.isError
			? 'Не удалось загрузить колонки доски.'
			: !query.isPending && !board
				? 'Колонка задачи недоступна. Обновите список колонок или откройте задачу заново.'
				: undefined,
		refetch: query.refetch,
	}
}
