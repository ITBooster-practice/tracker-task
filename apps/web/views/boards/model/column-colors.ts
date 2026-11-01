import type { BoardColumnColor } from '@repo/types'

export const columnColors: Record<
	BoardColumnColor,
	{ label: string; className: string; borderClassName: string }
> = {
	gray: {
		label: 'Серый',
		className: 'bg-board-gray',
		borderClassName: 'border-board-gray',
	},
	blue: {
		label: 'Синий',
		className: 'bg-board-blue',
		borderClassName: 'border-board-blue',
	},
	cyan: {
		label: 'Голубой',
		className: 'bg-board-cyan',
		borderClassName: 'border-board-cyan',
	},
	green: {
		label: 'Зелёный',
		className: 'bg-board-green',
		borderClassName: 'border-board-green',
	},
	yellow: {
		label: 'Жёлтый',
		className: 'bg-board-yellow',
		borderClassName: 'border-board-yellow',
	},
	orange: {
		label: 'Оранжевый',
		className: 'bg-board-orange',
		borderClassName: 'border-board-orange',
	},
	red: {
		label: 'Красный',
		className: 'bg-board-red',
		borderClassName: 'border-board-red',
	},
	violet: {
		label: 'Фиолетовый',
		className: 'bg-board-violet',
		borderClassName: 'border-board-violet',
	},
}
