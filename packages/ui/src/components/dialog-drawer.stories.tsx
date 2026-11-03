import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Button } from './button'
import { DialogDrawer } from './dialog-drawer'
import { useOverlayClose } from '../hooks/use-overlay-close'
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from './sheet'

function DialogDrawerExample({ mediaQuery }: { mediaQuery?: string }) {
	const [open, setOpen] = useState(false)
	return (
		<DialogDrawer open={open} onOpenChange={setOpen} mediaQuery={mediaQuery}>
			<DialogDrawer.Trigger>
				<Button>Открыть окно</Button>
			</DialogDrawer.Trigger>
			<DialogDrawer.Content>
				<DialogDrawer.Header>
					<DialogDrawer.Title>Плавное появление окна</DialogDrawer.Title>
					<DialogDrawer.Description>
						Оболочка и затемнение появляются вместе. Настройка уменьшения анимации
						учитывается автоматически.
					</DialogDrawer.Description>
				</DialogDrawer.Header>
				<DialogDrawer.Footer>
					<Button variant='outline' onClick={() => setOpen(false)}>
						Закрыть
					</Button>
				</DialogDrawer.Footer>
			</DialogDrawer.Content>
		</DialogDrawer>
	)
}

const meta = {
	title: 'Shared/UI/DialogDrawer',
	component: DialogDrawerExample,
	tags: ['autodocs'],
	render: (args) => <DialogDrawerExample {...args} />,
} satisfies Meta<typeof DialogDrawerExample>

export default meta
type Story = StoryObj<typeof meta>

export const Responsive: Story = {}
export const Modal: Story = { args: { mediaQuery: 'all' } }
export const Drawer: Story = { args: { mediaQuery: 'not all' } }

function ClosingDialog({ onClose }: { onClose: () => void }) {
	const { open, close, completeClose } = useOverlayClose(onClose)
	return (
		<DialogDrawer open={open} onOpenChange={(nextOpen) => !nextOpen && void close()}>
			<DialogDrawer.Content onCloseAutoFocus={completeClose}>
				<DialogDrawer.Header>
					<DialogDrawer.Title>Закрытие перед размонтированием</DialogDrawer.Title>
					<DialogDrawer.Description>
						Окно остаётся в DOM до конца анимации закрытия.
					</DialogDrawer.Description>
				</DialogDrawer.Header>
				<DialogDrawer.Footer>
					<Button variant='outline' onClick={() => void close()}>
						Закрыть
					</Button>
				</DialogDrawer.Footer>
			</DialogDrawer.Content>
		</DialogDrawer>
	)
}

function UnmountOnCloseExample() {
	const [mounted, setMounted] = useState(false)
	return (
		<>
			<Button onClick={() => setMounted(true)}>Открыть окно</Button>
			{mounted && <ClosingDialog onClose={() => setMounted(false)} />}
		</>
	)
}

export const UnmountOnClose: Story = { render: () => <UnmountOnCloseExample /> }
export const SidePanel: Story = {
	render: () => (
		<Sheet>
			<SheetTrigger asChild>
				<Button>Открыть боковую панель</Button>
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Боковая панель</SheetTitle>
					<SheetDescription>Плавный выезд от края экрана.</SheetDescription>
				</SheetHeader>
				<SheetFooter>
					<SheetClose asChild>
						<Button variant='outline'>Закрыть</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	),
}
