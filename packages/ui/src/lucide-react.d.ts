import type { ComponentType, SVGProps, RefAttributes } from 'react'

declare module 'lucide-react' {
	export type LucideIcon = ComponentType<
		SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>
	>

	export const CheckIcon: LucideIcon
	export const ChevronDownIcon: LucideIcon
	export const ChevronUpIcon: LucideIcon
	export const XIcon: LucideIcon
	export const CircleIcon: LucideIcon
	export const ChevronRightIcon: LucideIcon
}
