export const boardsKeys = {
	all: ['boards'] as const,
	lists: () => [...boardsKeys.all, 'list'] as const,
	list: (teamId: string, projectId: string) =>
		[...boardsKeys.lists(), teamId, projectId] as const,
}
