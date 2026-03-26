import { Skeleton } from '@repo/ui'

export default function Loading() {
	return (
		<div className='bg-background text-foreground w-full h-full'>
			<div className='mx-auto flex w-full max-w-[2100px] flex-col gap-8 px-5 py-8 md:px-8'>
				<header className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
					<h1 className='text-3xl font-semibold tracking-tight'>Задачи</h1>
					<Skeleton className='h-10 w-36 rounded-[var(--radius-control)]' />
				</header>

				<section className='grid grid-cols-1 gap-4 xl:grid-cols-[2.2fr_0.75fr_0.8fr_0.85fr]'>
					<Skeleton className='h-10 rounded-[var(--radius-control)]' />
					<Skeleton className='h-10 rounded-[var(--radius-control)]' />
					<Skeleton className='h-10 rounded-[var(--radius-control)]' />
					<Skeleton className='h-10 rounded-[var(--radius-control)]' />
				</section>

				<div className='overflow-x-auto rounded-[var(--radius-surface)] border border-border bg-card'>
					<table className='min-w-full border-collapse'>
						<thead className='border-b border-border'>
							<tr className='text-left text-base text-muted-foreground'>
								<th className='w-12 px-4 py-4'>
									<Skeleton className='h-5 w-5 rounded-[calc(var(--radius-control)-2px)]' />
								</th>
								<th className='min-w-28 px-3 py-4 font-semibold'>Ключ</th>
								<th className='min-w-[360px] px-3 py-4 font-semibold'>Название</th>
								<th className='min-w-28 px-3 py-4 font-semibold'>Тип</th>
								<th className='min-w-36 px-3 py-4 font-semibold'>Статус</th>
								<th className='min-w-24 px-3 py-4 font-semibold'>Приор.</th>
								<th className='min-w-36 px-3 py-4 font-semibold'>Исполнитель</th>
							</tr>
						</thead>
						<tbody>
							{Array.from({ length: 4 }).map((_, index) => (
								<tr key={index} className='border-b border-border last:border-b-0'>
									<td className='px-4 py-4'>
										<Skeleton className='h-5 w-5 rounded-[calc(var(--radius-control)-2px)]' />
									</td>
									<td className='px-3 py-4'>
										<Skeleton className='h-4 w-14' />
									</td>
									<td className='px-3 py-4'>
										<Skeleton className='h-4 w-64 max-w-full' />
									</td>
									<td className='px-3 py-4'>
										<Skeleton className='h-4 w-24' />
									</td>
									<td className='px-3 py-4'>
										<Skeleton className='h-4 w-28' />
									</td>
									<td className='px-3 py-4'>
										<Skeleton className='h-4 w-20' />
									</td>
									<td className='px-3 py-4'>
										<Skeleton className='h-4 w-24' />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
