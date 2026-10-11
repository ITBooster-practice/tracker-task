'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import type { CreateFeatureFlag, FeatureFlag, UpdateFeatureFlag } from '@repo/types'
import {
	Button,
	ConfirmDialog,
	DialogDrawer,
	DialogDrawerContent,
	DialogDrawerDescription,
	DialogDrawerHeader,
	DialogDrawerTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui'

import {
	featureFlagsKeys,
	useFeatureFlagAudit,
	useFeatureFlagsList,
} from '@/shared/api/use-feature-flags'
import { isApiError } from '@/shared/lib/api/utils'
import { useFeatureFlags } from '@/shared/lib/feature-flags/context'
import { featureFlagsService } from '@/shared/lib/feature-flags/feature-flags-service'

import { FeatureFlagForm } from './feature-flag-form'
import { FeatureFlagStatus } from './feature-flag-status'
import { FeatureFlagsAccessDenied } from './feature-flags-access-denied'

type Editor = { flag: FeatureFlag | null; version: number }
type Action =
	| { type: 'create'; value: CreateFeatureFlag }
	| {
			type: 'update'
			id: string
			value: Omit<UpdateFeatureFlag, 'expectedVersion'>
			version: number
	  }
	| { type: 'archive'; id: string; version: number }
const date = (value: string) => new Date(value).toLocaleString('ru-RU')
const actionNames: Record<string, string> = {
	created: 'Создан',
	updated: 'Изменён',
	archived: 'Архивирован',
	CREATE: 'Создан',
	UPDATE: 'Изменён',
	ARCHIVE: 'Архивирован',
}

export function FeatureFlagsPageView() {
	const { canManage } = useFeatureFlags()
	const queryClient = useQueryClient()
	const list = useFeatureFlagsList(canManage)
	const [search, setSearch] = useState('')
	const [filter, setFilter] = useState('active')
	const [editor, setEditor] = useState<Editor | null>(null)
	const [archive, setArchive] = useState<FeatureFlag | null>(null)
	const [archiveVersion, setArchiveVersion] = useState(0)
	const [auditId, setAuditId] = useState('')
	const [error, setError] = useState('')
	const audit = useFeatureFlagAudit(canManage ? auditId : '')
	const mutation = useMutation({
		mutationFn: (action: Action) => {
			if (action.type === 'create') return featureFlagsService.create(action.value)
			if (action.type === 'archive')
				return featureFlagsService.archive(action.id, action.version)
			return featureFlagsService.update(action.id, {
				...action.value,
				expectedVersion: action.version,
			})
		},
		onSuccess: async () => {
			setError('')
			await queryClient.invalidateQueries({ queryKey: featureFlagsKeys.all })
		},
		onError: (cause) => {
			setError(
				isApiError(cause) && cause.statusCode === 409
					? 'Данные изменились или ключ уже занят. Список обновлён; проверьте изменения и откройте форму заново.'
					: isApiError(cause) && cause.statusCode === 403
						? 'Право управления недоступно.'
						: isApiError(cause) && cause.statusCode === 422
							? cause.message
							: 'Не удалось сохранить изменение. Повторите попытку.',
			)
			if (isApiError(cause) && cause.statusCode === 403)
				queryClient.setQueryData(featureFlagsKeys.access, { canManage: false })
			void queryClient.invalidateQueries({ queryKey: featureFlagsKeys.all })
		},
	})
	const run = async (action: Action) => {
		try {
			await mutation.mutateAsync(action)
			return true
		} catch {
			return false
		}
	}
	if (!canManage) return <FeatureFlagsAccessDenied />
	const flags = (list.data?.flags ?? []).filter((flag) => {
		const matches = (flag.key + ' ' + flag.title)
			.toLowerCase()
			.includes(search.toLowerCase())
		return (
			matches &&
			(filter === 'all' ||
				(filter === 'archived'
					? Boolean(flag.archivedAt)
					: !flag.archivedAt &&
						(filter === 'active' ||
							(filter === 'enabled' ? flag.enabled : !flag.enabled))))
		)
	})
	return (
		<section className='mx-auto grid w-full max-w-5xl gap-6 p-4 sm:p-6'>
			<header className='flex flex-wrap items-start justify-between gap-4'>
				<div>
					<h1 className='text-2xl font-semibold'>Флаги функций</h1>
					<p className='text-sm text-muted-foreground'>
						Изменения применяются ко всем пользователям. Версия:{' '}
						{list.data?.version ?? '…'}
					</p>
				</div>
				<Button
					disabled={mutation.isPending || !list.data || list.isError}
					onClick={() => {
						setError('')
						setEditor({ flag: null, version: list.data?.version ?? 0 })
					}}
				>
					Создать флаг
				</Button>
			</header>
			<p className='rounded-md border p-3 text-sm'>
				Чтобы завершённый блок стал постоянным, сначала удалите его проверки флага и
				старый код, выпустите обновление и обновите старые вкладки. Затем архивируйте
				флаг. Архивация сохраняет историю и закрывает оставшиеся проверки.
			</p>
			<div className='flex flex-wrap items-end gap-4'>
				<div className='grid min-w-56 flex-1 gap-2'>
					<Label htmlFor='flags-search'>Поиск по названию или ключу</Label>
					<Input
						id='flags-search'
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</div>
				<div className='grid gap-2'>
					<Label htmlFor='flags-filter'>Состояние</Label>
					<Select value={filter} onValueChange={setFilter}>
						<SelectTrigger id='flags-filter' className='w-44 data-[size=default]:h-9'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent position='popper' align='start'>
							<SelectItem value='active'>Активные</SelectItem>
							<SelectItem value='enabled'>Включённые</SelectItem>
							<SelectItem value='disabled'>Отключённые</SelectItem>
							<SelectItem value='archived'>Архивные</SelectItem>
							<SelectItem value='all'>Все</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<Button
					variant='outline'
					disabled={list.isFetching}
					onClick={() => void list.refetch()}
				>
					Обновить
				</Button>
			</div>
			{error && !editor && !archive && (
				<p role='alert' className='text-destructive'>
					{error}
				</p>
			)}
			{list.isPending ? (
				<p role='status'>Загрузка флагов…</p>
			) : list.isError ? (
				<p role='alert'>Не удалось загрузить флаги. Нажмите «Обновить».</p>
			) : flags.length === 0 ? (
				<p>Флаги не найдены.</p>
			) : (
				<ul className='grid gap-3'>
					{flags.map((flag) => (
						<li key={flag.id} className='grid gap-3 rounded-lg border bg-card p-4'>
							<div className='flex flex-wrap items-start justify-between gap-3'>
								<div>
									<h2 className='font-semibold'>{flag.title}</h2>
									<code className='text-sm text-muted-foreground'>{flag.key}</code>
								</div>
								<FeatureFlagStatus flag={flag} />
							</div>
							<p
								className={
									flag.connectedFeature
										? 'text-sm text-sky-700 dark:text-sky-300'
										: 'text-sm text-muted-foreground'
								}
							>
								{flag.connectedFeature
									? 'Подключён: ' + flag.connectedFeature
									: 'Не подключён к приложению'}
							</p>
							{!flag.connectedFeature && !flag.archivedAt && (
								<p className='text-xs text-muted-foreground'>
									Включение станет доступно после подключения и выпуска обновления.
								</p>
							)}
							{flag.description && (
								<p className='whitespace-pre-wrap text-sm'>{flag.description}</p>
							)}
							<p className='text-xs text-muted-foreground'>
								Автор: {flag.createdById} · Обновлён: {date(flag.updatedAt)}
								{flag.expiresAt ? ' · План завершения: ' + date(flag.expiresAt) : ''}
							</p>
							<div className='flex flex-wrap gap-2'>
								{!flag.archivedAt && (
									<>
										<Button
											size='sm'
											variant='outline'
											disabled={
												mutation.isPending ||
												list.isError ||
												(!flag.enabled && !flag.connectedFeature)
											}
											aria-label={
												(flag.enabled ? 'Выключить ' : 'Включить ') + flag.title
											}
											onClick={() =>
												void run({
													type: 'update',
													id: flag.id,
													value: { enabled: !flag.enabled },
													version: list.data?.version ?? 0,
												})
											}
										>
											{flag.enabled ? 'Выключить' : 'Включить'}
										</Button>
										<Button
											size='sm'
											variant='outline'
											disabled={mutation.isPending}
											aria-label={'Редактировать ' + flag.title}
											onClick={() => {
												setError('')
												setEditor({ flag, version: list.data?.version ?? 0 })
											}}
										>
											Редактировать
										</Button>
										<Button
											size='sm'
											variant='outline'
											disabled={mutation.isPending || flag.required}
											aria-label={'Архивировать ' + flag.title}
											title={
												flag.required
													? 'Сначала удалите проверки из всех поддерживаемых версий и реестра REQUIRED_FEATURE_KEYS.'
													: undefined
											}
											onClick={() => {
												setError('')
												setArchiveVersion(list.data?.version ?? 0)
												setArchive(flag)
											}}
										>
											Архивировать
										</Button>
									</>
								)}
								<Button
									size='sm'
									variant='ghost'
									aria-label={'История ' + flag.title}
									onClick={() => setAuditId(flag.id)}
								>
									История
								</Button>
							</div>
							{flag.required && (
								<p className='text-xs text-muted-foreground'>
									Флаг используется приложением; архивация заблокирована до удаления
									проверок.
								</p>
							)}
						</li>
					))}
				</ul>
			)}
			<DialogDrawer
				open={Boolean(editor)}
				onOpenChange={(open) => {
					if (!open && !mutation.isPending) setEditor(null)
				}}
			>
				<DialogDrawerContent
					className={(isDesktop) =>
						isDesktop ? 'max-h-[90dvh] overflow-y-auto pt-4' : 'overflow-hidden'
					}
				>
					<DialogDrawerHeader className='gap-2 md:pt-0 md:pr-8'>
						<DialogDrawerTitle>
							{editor?.flag ? 'Редактировать флаг' : 'Создать флаг'}
						</DialogDrawerTitle>
						<DialogDrawerDescription>
							Технический ключ сохраняется навсегда. Название можно изменить.
						</DialogDrawerDescription>
					</DialogDrawerHeader>
					<div className='min-h-0 overflow-y-auto px-4 pb-4 md:p-0'>
						{editor && (
							<FeatureFlagForm
								key={editor.flag?.id ?? 'new'}
								flag={editor.flag}
								pending={mutation.isPending}
								error={error}
								onCancel={() => setEditor(null)}
								onSubmit={async (value) => {
									const saved = await run(
										editor.flag
											? {
													type: 'update',
													id: editor.flag.id,
													value: {
														title: value.title,
														description: value.description,
														expiresAt: value.expiresAt,
													},
													version: editor.version,
												}
											: { type: 'create', value },
									)
									if (saved) setEditor(null)
								}}
							/>
						)}
					</div>
				</DialogDrawerContent>
			</DialogDrawer>
			<ConfirmDialog
				open={Boolean(archive)}
				onOpenChange={(open) => {
					if (!open) setArchive(null)
				}}
				title={'Архивировать «' + (archive?.title ?? '') + '»?'}
				description='Флаг больше не разрешит работу функции. История сохранится, а технический ключ останется занят навсегда. Убедитесь, что проверки удалены из выпущенного кода.'
				confirmLabel='Архивировать'
				isPending={mutation.isPending}
				confirmDisabled={Boolean(archive?.required)}
				onConfirm={async () => {
					if (
						archive &&
						(await run({
							type: 'archive',
							id: archive.id,
							version: archiveVersion,
						}))
					)
						setArchive(null)
				}}
			>
				{error && (
					<p role='alert' className='text-sm text-destructive'>
						{error}
					</p>
				)}
			</ConfirmDialog>
			{auditId && (
				<section className='grid gap-3 rounded-lg border p-4' aria-label='История флага'>
					<div className='flex items-center justify-between'>
						<h2 className='font-semibold'>
							История: {list.data?.flags.find((flag) => flag.id === auditId)?.title}
						</h2>
						<Button variant='ghost' size='sm' onClick={() => setAuditId('')}>
							Закрыть историю
						</Button>
					</div>
					{audit.isPending ? (
						<p>Загрузка истории…</p>
					) : audit.isError ? (
						<p role='alert'>
							Не удалось загрузить историю.{' '}
							<Button variant='outline' onClick={() => void audit.refetch()}>
								Повторить
							</Button>
						</p>
					) : audit.data?.length === 0 ? (
						<p>История пуста.</p>
					) : (
						<ol className='grid gap-3'>
							{audit.data?.map((entry) => (
								<li key={entry.id} className='text-sm'>
									<p>
										{date(entry.createdAt)} · {actionNames[entry.action] ?? entry.action}{' '}
										· Автор: {entry.actorId} · Версия {entry.version}
									</p>
									<details>
										<summary className='cursor-pointer'>Изменения</summary>
										<pre className='overflow-x-auto rounded bg-muted p-2 text-xs'>
											{JSON.stringify(
												{ before: entry.before, after: entry.after },
												null,
												2,
											)}
										</pre>
									</details>
								</li>
							))}
						</ol>
					)}
				</section>
			)}
		</section>
	)
}
