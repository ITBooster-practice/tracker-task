import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react'
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest'

import type { FeatureFlag } from '@repo/types'

import { FeatureFlagsPageView } from '@/views/feature-flags'
import { featureFlagsKeys } from '@/shared/api/use-feature-flags'
import { FeatureFlagsContext } from '@/shared/lib/feature-flags/context'
import { featureFlagsService } from '@/shared/lib/feature-flags/feature-flags-service'

vi.mock('@/shared/lib/feature-flags/feature-flags-service', () => ({
	featureFlagsService: {
		list: vi.fn(),
		serverTime: vi.fn().mockResolvedValue({ serverTime: '2026-10-10T12:34:30.000Z' }),
		create: vi.fn(),
		update: vi.fn(),
		archive: vi.fn(),
		audit: vi.fn(),
	},
}))
const flag: FeatureFlag = {
	id: 'flag-1',
	key: 'new-dashboard-v2',
	title: 'Новая панель',
	enabled: false,
	description: null,
	expiresAt: null,
	archivedAt: null,
	createdById: 'developer',
	createdAt: '2026-10-10T00:00:00.000Z',
	updatedAt: '2026-10-10T00:00:00.000Z',
	required: false,
	connectedFeature: null,
}
const connectedFlag: FeatureFlag = {
	...flag,
	key: 'boards',
	connectedFeature: 'Доски',
	required: true,
}
function mount(canManage = true) {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	})
	const view = render(
		<QueryClientProvider client={client}>
			<FeatureFlagsContext.Provider
				value={{
					canManage,
					status: 'ready',
					snapshot: null,
					connection: 'connected',
					retry: vi.fn(),
				}}
			>
				<FeatureFlagsPageView />
			</FeatureFlagsContext.Provider>
		</QueryClientProvider>,
	)
	return { ...view, client }
}
describe('Developer flag panel', () => {
	const scrollIntoView = Object.getOwnPropertyDescriptor(
		Element.prototype,
		'scrollIntoView',
	)
	beforeAll(() => {
		// Radix Select прокручивает список к выбранному пункту; jsdom не поддерживает scrollIntoView.
		Object.defineProperty(Element.prototype, 'scrollIntoView', {
			configurable: true,
			value: vi.fn(),
		})
	})
	afterAll(() => {
		if (scrollIntoView)
			Object.defineProperty(Element.prototype, 'scrollIntoView', scrollIntoView)
		else Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
	})
	beforeEach(() => {
		vi.clearAllMocks()
		vi.stubGlobal(
			'matchMedia',
			vi.fn().mockImplementation((query: string) => ({
				matches: true,
				media: query,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			})),
		)
		vi.stubGlobal(
			'ResizeObserver',
			class {
				observe = vi.fn()
				unobserve = vi.fn()
				disconnect = vi.fn()
			},
		)
		vi.mocked(featureFlagsService.list).mockResolvedValue({ version: 5, flags: [flag] })
		vi.mocked(featureFlagsService.create).mockResolvedValue({ version: 6, flag })
		vi.mocked(featureFlagsService.update).mockResolvedValue({ version: 6, flag })
		vi.mocked(featureFlagsService.archive).mockResolvedValue({
			version: 6,
			flag: { ...flag, archivedAt: flag.createdAt },
		})
		vi.mocked(featureFlagsService.audit).mockResolvedValue([
			{
				id: 'audit-1',
				flagId: flag.id,
				actorId: 'developer',
				action: 'CREATE',
				before: null,
				after: flag,
				version: 5,
				createdAt: flag.createdAt,
			},
		])
	})
	afterEach(() => {
		cleanup()
		vi.unstubAllGlobals()
	})
	it('denies ordinary users without requesting the private list', () => {
		mount(false)
		expect(screen.getByText('Доступ запрещён')).toBeDefined()
		expect(featureFlagsService.list).not.toHaveBeenCalled()
	})

	it('блокирует включение заготовки и объясняет причину', async () => {
		mount()
		const button = await screen.findByRole('button', { name: 'Включить ' + flag.title })
		expect(button.hasAttribute('disabled')).toBe(true)
		expect(screen.getByText('Не подключён к приложению')).toBeDefined()
		expect(screen.getByText(/Включение станет доступно после подключения/)).toBeDefined()
		fireEvent.click(button)
		expect(featureFlagsService.update).not.toHaveBeenCalled()
	})
	it('показывает подключение из ответа API независимо от названия флага', async () => {
		vi.mocked(featureFlagsService.list).mockResolvedValue({
			version: 5,
			flags: [connectedFlag],
		})
		mount()
		await screen.findByText('Подключён: Доски')
		expect(
			screen
				.getByRole('button', { name: 'Включить ' + flag.title })
				.hasAttribute('disabled'),
		).toBe(false)
	})
	it('разрешает выключить старый неподключённый флаг', async () => {
		vi.mocked(featureFlagsService.list).mockResolvedValue({
			version: 5,
			flags: [{ ...flag, enabled: true }],
		})
		mount()
		fireEvent.click(
			await screen.findByRole('button', { name: 'Выключить ' + flag.title }),
		)
		await waitFor(() =>
			expect(featureFlagsService.update).toHaveBeenCalledWith(flag.id, {
				enabled: false,
				expectedVersion: 5,
			}),
		)
	})
	it('на мобильном открывает форму в Drawer и закрывает по отмене', async () => {
		vi.stubGlobal(
			'matchMedia',
			vi.fn().mockImplementation((query: string) => ({
				matches: false,
				media: query,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			})),
		)
		mount()
		await screen.findByText(flag.title)
		fireEvent.click(screen.getByRole('button', { name: 'Создать флаг' }))
		const dialog = await screen.findByRole('dialog')
		expect(dialog.getAttribute('data-slot')).toBe('drawer-content')
		expect(within(dialog).queryByText(/Новый флаг будет выключен/)).toBeNull()
		fireEvent.change(screen.getByLabelText('Технический ключ'), {
			target: { value: 'drawer-test' },
		})
		fireEvent.click(within(dialog).getByRole('button', { name: 'Отмена' }))
		// В jsdom анимация Vaul не завершается; проверяем закрытие и очистку формы.
		await waitFor(() => expect(dialog.getAttribute('data-state')).toBe('closed'))
		expect(screen.queryByLabelText('Технический ключ')).toBeNull()
		expect(featureFlagsService.create).not.toHaveBeenCalled()
	})
	it('на компьютере открывает модалку без пояснения состояния', async () => {
		mount()
		fireEvent.click(
			await screen.findByRole('button', { name: 'Редактировать ' + flag.title }),
		)
		const dialog = await screen.findByRole('dialog')
		expect(dialog.getAttribute('data-slot')).toBe('dialog-content')
		expect(within(dialog).queryByText(/Состояние флага меняется кнопкой/)).toBeNull()
		fireEvent.click(within(dialog).getByRole('button', { name: 'Отмена' }))
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
	})
	it('creates a disabled flag with a permanent technical key', async () => {
		mount()
		await screen.findByText(flag.title)
		fireEvent.click(screen.getByRole('button', { name: 'Создать флаг' }))
		fireEvent.change(screen.getByLabelText('Технический ключ'), {
			target: { value: 'new-search-v1' },
		})
		fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Поиск' } })
		fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
		await waitFor(() =>
			expect(featureFlagsService.create).toHaveBeenCalledWith({
				key: 'new-search-v1',
				title: 'Поиск',
				description: null,
				expiresAt: null,
			}),
		)
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
	})
	it('toggles using the current revision and waits for acknowledgment', async () => {
		vi.mocked(featureFlagsService.list).mockResolvedValue({
			version: 5,
			flags: [{ ...connectedFlag, enabled: false }],
		})
		let resolve!: (value: { version: number; flag: FeatureFlag }) => void
		vi.mocked(featureFlagsService.update).mockImplementation(
			() =>
				new Promise((done) => {
					resolve = done
				}),
		)
		mount()
		fireEvent.click(await screen.findByRole('button', { name: 'Включить ' + flag.title }))
		await waitFor(() =>
			expect(featureFlagsService.update).toHaveBeenCalledWith(flag.id, {
				enabled: true,
				expectedVersion: 5,
			}),
		)
		expect(
			screen
				.getByRole('button', { name: 'Включить ' + flag.title })
				.hasAttribute('disabled'),
		).toBe(true)
		resolve({ version: 6, flag: { ...flag, enabled: true } })
	})
	it('keeps the technical key read-only when editing and excludes it from PATCH', async () => {
		vi.mocked(featureFlagsService.list).mockResolvedValue({
			version: 5,
			flags: [{ ...connectedFlag, enabled: true }],
		})
		mount()
		fireEvent.click(
			await screen.findByRole('button', { name: 'Редактировать ' + flag.title }),
		)
		expect(screen.getByLabelText('Технический ключ').hasAttribute('readonly')).toBe(true)
		fireEvent.change(screen.getByLabelText('Название'), {
			target: { value: 'Другое название' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
		await waitFor(() =>
			expect(featureFlagsService.update).toHaveBeenCalledWith(flag.id, {
				title: 'Другое название',
				description: null,
				expiresAt: null,
				expectedVersion: 5,
			}),
		)
	})
	it('requires confirmation before archive and preserves access to audit', async () => {
		mount()
		fireEvent.click(
			await screen.findByRole('button', { name: 'Архивировать ' + flag.title }),
		)
		expect(featureFlagsService.archive).not.toHaveBeenCalled()
		fireEvent.click(
			within(screen.getByRole('dialog')).getByRole('button', { name: 'Архивировать' }),
		)
		await waitFor(() =>
			expect(featureFlagsService.archive).toHaveBeenCalledWith(flag.id, 5),
		)
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
		fireEvent.click(screen.getByRole('button', { name: 'История ' + flag.title }))
		await screen.findByText(/Создан · Автор: developer/)
		expect(featureFlagsService.audit).toHaveBeenCalledWith(flag.id)
	})
	it('keeps the confirmation revision and shows conflicts inside the dialog', async () => {
		vi.mocked(featureFlagsService.archive).mockRejectedValue({
			message: 'Conflict',
			statusCode: 409,
		})
		const { client } = mount()
		fireEvent.click(
			await screen.findByRole('button', { name: 'Архивировать ' + flag.title }),
		)
		act(() =>
			client.setQueryData(featureFlagsKeys.list, {
				version: 6,
				flags: [{ ...flag, title: 'Изменено другим клиентом' }],
			}),
		)
		fireEvent.click(
			within(screen.getByRole('dialog')).getByRole('button', { name: 'Архивировать' }),
		)
		await waitFor(() =>
			expect(featureFlagsService.archive).toHaveBeenCalledWith(flag.id, 5),
		)
		await within(screen.getByRole('dialog')).findByRole('alert')
		expect(screen.getByRole('dialog')).toBeDefined()
	})
	it('prevents archiving flags still required by application code', async () => {
		vi.mocked(featureFlagsService.list).mockResolvedValue({
			version: 5,
			flags: [{ ...flag, required: true }],
		})
		mount()
		expect(
			(
				await screen.findByRole('button', { name: 'Архивировать ' + flag.title })
			).hasAttribute('disabled'),
		).toBe(true)
	})
	it('reports concurrent edits and refreshes rather than overwriting', async () => {
		vi.mocked(featureFlagsService.list).mockResolvedValue({
			version: 5,
			flags: [{ ...connectedFlag, enabled: false }],
		})
		vi.mocked(featureFlagsService.update).mockRejectedValue({
			message: 'Conflict',
			statusCode: 409,
		})
		mount()
		fireEvent.click(await screen.findByRole('button', { name: 'Включить ' + flag.title }))
		await screen.findByText(/Данные изменились или ключ уже занят/)
		await waitFor(() => expect(featureFlagsService.list).toHaveBeenCalledTimes(2))
	})
	it('filters archived flags separately and searches by key', async () => {
		vi.mocked(featureFlagsService.list).mockResolvedValue({
			version: 5,
			flags: [
				flag,
				{
					...flag,
					id: 'old',
					key: 'old-key',
					title: 'Архивная панель',
					archivedAt: flag.createdAt,
				},
			],
		})
		mount()
		await screen.findByText(flag.title)
		expect(screen.queryByText('Архивная панель')).toBeNull()
		fireEvent.keyDown(screen.getByRole('combobox', { name: 'Состояние' }), {
			key: 'ArrowDown',
		})
		fireEvent.click(await screen.findByRole('option', { name: 'Архивные' }))
		expect(screen.getByText('Архивная панель')).toBeDefined()
		fireEvent.change(screen.getByLabelText('Поиск по названию или ключу'), {
			target: { value: 'old-key' },
		})
		expect(screen.getByText('Архивная панель')).toBeDefined()
	})
})
