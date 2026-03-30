import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function isPrimitive(value: unknown): value is string | number | boolean {
	return (
		typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
	)
}
