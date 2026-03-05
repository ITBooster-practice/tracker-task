/** Все варианты единиц → миллисекунды */
const UNIT_MAP: Record<string, number> = {
	// миллисекунды
	ms: 1,
	millisecond: 1,
	milliseconds: 1,
	// секунды
	s: 1_000,
	sec: 1_000,
	secs: 1_000,
	second: 1_000,
	seconds: 1_000,
	// минуты
	m: 60_000,
	min: 60_000,
	mins: 60_000,
	minute: 60_000,
	minutes: 60_000,
	// часы
	h: 3_600_000,
	hr: 3_600_000,
	hrs: 3_600_000,
	hour: 3_600_000,
	hours: 3_600_000,
	// дни
	d: 86_400_000,
	day: 86_400_000,
	days: 86_400_000,
	// недели
	w: 604_800_000,
	week: 604_800_000,
	weeks: 604_800_000,
}

const UNIT_PATTERN = Object.keys(UNIT_MAP)
	.sort((a, b) => b.length - a.length) // длинные первыми, чтобы "minutes" не матчилось как "m"
	.join('|')

const TTL_REGEX = new RegExp(`^(\\d+)\\s*(${UNIT_PATTERN})$`, 'i')

export function parseTTLToMs(value: string): number {
	const match = value.trim().match(TTL_REGEX)

	if (!match) {
		throw new Error(
			`Неверный формат TTL: "${value}". Ожидается формат вида "7d", "1h", "30min", "2 weeks", "500ms".`,
		)
	}

	const amount = parseInt(match[1], 10)
	const unit = match[2].toLowerCase()

	return amount * UNIT_MAP[unit]
}
