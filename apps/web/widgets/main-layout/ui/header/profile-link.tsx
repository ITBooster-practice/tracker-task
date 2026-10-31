'use client'

import Link from 'next/link'

import { Avatar, AvatarFallback } from '@repo/ui'

import { useMe } from '@/shared/api/use-auth'
import { ROUTES } from '@/shared/config'
import { getNameInitials, getUserDisplayName } from '@/shared/lib/user'

export function ProfileLink() {
	const profileQuery = useMe()
	const displayName = getUserDisplayName(profileQuery.data)

	return (
		<Link
			href={ROUTES.profile}
			aria-label='Личный кабинет'
			title={displayName}
			className='inline-flex size-9 items-center justify-center rounded-full outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]'
		>
			<Avatar size='sm' aria-hidden='true'>
				<AvatarFallback>{getNameInitials(displayName)}</AvatarFallback>
			</Avatar>
		</Link>
	)
}
