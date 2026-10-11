'use client'

import { Button } from '@repo/ui'

import { useFeatureFlagAudit } from '@/shared/api/use-feature-flags'

import { FeatureFlagAuthor } from './feature-flag-author'

interface Props {
	flagId: string
	title: string
	onClose: () => void
}
const actionNames: Record<string, string> = {
	created: 'Создан',
	updated: 'Изменён',
	archived: 'Архивирован',
	CREATE: 'Создан',
	UPDATE: 'Изменён',
	ARCHIVE: 'Архивирован',
}
export function FeatureFlagHistory({ flagId, title, onClose }: Props) {
	const audit = useFeatureFlagAudit(flagId)
	return (
		<section
			id={'flag-history-' + flagId}
			className='grid min-w-0 gap-3 rounded-lg border p-4 [overflow-wrap:anywhere]'
			aria-label={'История флага ' + title}
		>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<h2 className='min-w-0 font-semibold'>История: {title}</h2>
				<Button variant='ghost' size='sm' onClick={onClose}>
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
				<ol className='grid min-w-0 gap-3'>
					{audit.data?.map((entry) => (
						<li key={entry.id} className='min-w-0 text-sm'>
							<p>
								{new Date(entry.createdAt).toLocaleString('ru-RU')} ·{' '}
								{actionNames[entry.action] ?? entry.action} · Автор:{' '}
								<FeatureFlagAuthor id={entry.actorId} name={entry.actorName} /> · Версия{' '}
								{entry.version}
							</p>
							<details className='min-w-0'>
								<summary className='cursor-pointer'>Изменения</summary>
								<pre className='max-w-full whitespace-pre-wrap rounded bg-muted p-2 text-xs [overflow-wrap:anywhere]'>
									{JSON.stringify({ before: entry.before, after: entry.after }, null, 2)}
								</pre>
							</details>
						</li>
					))}
				</ol>
			)}
		</section>
	)
}
