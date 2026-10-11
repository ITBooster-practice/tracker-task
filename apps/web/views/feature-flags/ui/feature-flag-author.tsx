interface Props {
	id: string
	name?: string | null
}
export function FeatureFlagAuthor({ id, name }: Props) {
	return (
		<span className='[overflow-wrap:anywhere]'>
			{name?.trim() || (id === 'bootstrap' ? 'Система' : 'Имя недоступно')} ({id})
		</span>
	)
}
