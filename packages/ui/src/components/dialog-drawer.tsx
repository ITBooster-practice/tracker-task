'use client'

import * as React from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@repo/ui/components/dialog'
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from '@repo/ui/components/drawer'

import { useMediaQuery } from '@repo/ui/hooks/use-media-query'
import { cn } from '@repo/ui/lib/utils'

type RenderProp = React.ReactNode | ((isDesktop: boolean) => React.ReactNode)
type ClassNameProp = string | ((isDesktop: boolean) => string | undefined)

const resolve = (prop: RenderProp, isDesktop: boolean): React.ReactNode =>
	typeof prop === 'function' ? prop(isDesktop) : prop

const resolveClassName = (prop: ClassNameProp | undefined, isDesktop: boolean) =>
	typeof prop === 'function' ? prop(isDesktop) : prop

const DialogDrawerContext = React.createContext<boolean>(false)

function useDialogDrawer() {
	const context = React.useContext(DialogDrawerContext)

	return context
}

interface DialogDrawerProps {
	open?: boolean
	onOpenChange?: (open: boolean) => void
	mediaQuery?: string
	children: React.ReactNode
}

function DialogDrawer({
	open,
	onOpenChange,
	mediaQuery = '(min-width: 768px)',
	children,
}: DialogDrawerProps) {
	const isDesktop = useMediaQuery(mediaQuery)
	const Root = isDesktop ? Dialog : Drawer

	return (
		<DialogDrawerContext.Provider value={isDesktop}>
			<Root open={open} onOpenChange={onOpenChange}>
				{children}
			</Root>
		</DialogDrawerContext.Provider>
	)
}

function Trigger({ children }: { children: React.ReactNode }) {
	const isDesktop = useDialogDrawer()
	const TriggerComponent = isDesktop ? DialogTrigger : DrawerTrigger
	return <TriggerComponent asChild>{children}</TriggerComponent>
}

interface SlotProps {
	children?: RenderProp
	className?: ClassNameProp
}

function Content({ children, className }: SlotProps) {
	const isDesktop = useDialogDrawer()
	const resolved = resolve(children, isDesktop)
	const resolvedClassName = resolveClassName(className, isDesktop)

	const ContentComponent = isDesktop ? DialogContent : DrawerContent

	return <ContentComponent className={resolvedClassName}>{resolved}</ContentComponent>
}

function Header({ children, className }: SlotProps) {
	const isDesktop = useDialogDrawer()
	const resolved = resolve(children, isDesktop)
	const resolvedClassName = resolveClassName(className, isDesktop)

	const HeaderComponent = isDesktop ? DialogHeader : DrawerHeader

	return (
		<HeaderComponent className={cn({ 'text-left': !isDesktop }, resolvedClassName)}>
			{resolved}
		</HeaderComponent>
	)
}

function Title({ children, className }: SlotProps) {
	const isDesktop = useDialogDrawer()
	const resolved = resolve(children, isDesktop)
	const resolvedClassName = resolveClassName(className, isDesktop)

	const TitleComponent = isDesktop ? DialogTitle : DrawerTitle

	return <TitleComponent className={resolvedClassName}>{resolved}</TitleComponent>
}

function Description({ children, className }: SlotProps) {
	const isDesktop = useDialogDrawer()
	const resolved = resolve(children, isDesktop)
	const resolvedClassName = resolveClassName(className, isDesktop)

	const DescriptionComponent = isDesktop ? DialogDescription : DrawerDescription

	return (
		<DescriptionComponent className={resolvedClassName}>{resolved}</DescriptionComponent>
	)
}

function Footer({ children, className }: SlotProps) {
	const isDesktop = useDialogDrawer()
	const resolved = resolve(children, isDesktop)
	const resolvedClassName = resolveClassName(className, isDesktop)

	const FooterComponent = isDesktop ? DialogFooter : DrawerFooter

	return (
		<FooterComponent className={cn({ 'pt-2': !isDesktop }, resolvedClassName)}>
			{resolved}
		</FooterComponent>
	)
}

DialogDrawer.Trigger = Trigger
DialogDrawer.Content = Content
DialogDrawer.Header = Header
DialogDrawer.Title = Title
DialogDrawer.Description = Description
DialogDrawer.Footer = Footer

const DialogDrawerTrigger = Trigger
const DialogDrawerContent = Content
const DialogDrawerHeader = Header
const DialogDrawerTitle = Title
const DialogDrawerDescription = Description
const DialogDrawerFooter = Footer

export {
	DialogDrawer,
	DialogDrawerTrigger,
	DialogDrawerContent,
	DialogDrawerHeader,
	DialogDrawerTitle,
	DialogDrawerDescription,
	DialogDrawerFooter,
	useDialogDrawer,
}
