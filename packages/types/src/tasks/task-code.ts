export function formatTaskCode(id: string): string {
	return `TT-${id.slice(0, 8).toLowerCase()}`
}

export function parseTaskCode(value: string): string | null {
	return /^TT-([0-9a-f]{1,8})$/i.exec(value.trim())?.[1]?.toLowerCase() ?? null
}
