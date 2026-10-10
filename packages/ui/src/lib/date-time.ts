// Значения формы хранятся в местном часовом поясе; преобразование в UTC выполняется перед отправкой в API.
export const pad = (value: number) => String(value).padStart(2, '0')

export function localDay(date: Date) {
	return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-')
}
export function localTime(date: Date) {
	return pad(date.getHours()) + ':' + pad(date.getMinutes())
}
export function minuteCeiling(date: Date) {
	return new Date(Math.ceil(date.getTime() / 60_000) * 60_000)
}
export function parseLocalDateTime(value: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(value)
	if (!match) return null
	const [, year, month, day, hours = '00', minutes = '00'] = match
	const date = new Date(
		Number(year),
		Number(month) - 1,
		Number(day),
		Number(hours),
		Number(minutes),
	)
	// Date исправляет невозможные даты и время; проверка исключает 31 февраля, 25:00 и пропущенные при смене часового пояса часы.
	return localDay(date) === [year, month, day].join('-') &&
		localTime(date) === hours + ':' + minutes
		? date
		: null
}
export function displayDay(value: string) {
	const [year, month, day] = value.split('T')[0]!.split('-')
	return year && month && day ? [day, month, year].join('.') : ''
}
export function formatDayInput(value: string) {
	const parsed = parseDayInput(value)
	if (parsed) return displayDay(parsed)
	const digits = value.replace(/\D/g, '').slice(0, 8)
	const formatted = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)]
		.filter(Boolean)
		.join('.')
	return value.endsWith('.') && (digits.length === 2 || digits.length === 4)
		? formatted + '.'
		: formatted
}
export function parseDayInput(value: string): string | null {
	const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value.trim())
	if (!match) return null
	const day = match[3] + '-' + pad(Number(match[2])) + '-' + pad(Number(match[1]))
	return parseLocalDateTime(day) ? day : null
}
export function normalizeTime(value: string): string | null {
	const match =
		/^(\d{1,2}):([0-5]\d)$/.exec(value.trim()) ?? /^(\d{2})([0-5]\d)$/.exec(value.trim())
	return match && Number(match[1]) <= 23 ? pad(Number(match[1])) + ':' + match[2] : null
}
