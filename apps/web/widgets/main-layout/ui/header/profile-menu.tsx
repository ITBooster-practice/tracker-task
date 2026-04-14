'use client'

import { useRouter } from 'next/navigation'

import {
	Avatar,
	AvatarFallback,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@repo/ui'

import { useLogout, useMe } from '@/shared/api/use-auth'
import { ROUTE_QUERY_PARAMS, ROUTES } from '@/shared/config'
import { getNameInitials, getUserDisplayName } from '@/shared/lib/user'

const ProfileMenu = () => {
	const router = useRouter()
	const logoutMutation = useLogout()
	const profileQuery = useMe()
	const displayName = getUserDisplayName(profileQuery.data)
	const initials = getNameInitials(displayName)

	const handleLogout = () => {
		logoutMutation.mutateAsync()
		const url = new URL(ROUTES.login, window.location.origin)
		url.searchParams.set(ROUTE_QUERY_PARAMS.clearAuth, '1')
		window.location.assign(url)
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='ghost' className='h-9 gap-2 px-2'>
					<Avatar size='sm'>
						<AvatarFallback>{initials}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-56'>
				<DropdownMenuLabel className='py-2'>
					<div className='flex items-center gap-2'>
						<Avatar size='sm'>
							<AvatarFallback>{initials}</AvatarFallback>
						</Avatar>
						<div className='min-w-0'>
							<p className='truncate text-sm font-medium text-foreground'>
								{displayName}
							</p>
							{profileQuery.data?.email ? (
								<p className='truncate text-xs text-muted-foreground'>
									{profileQuery.data.email}
								</p>
							) : null}
						</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => router.push(ROUTES.profile)}>
					Личный кабинет
				</DropdownMenuItem>
				<DropdownMenuItem variant='destructive' onClick={handleLogout}>
					Выйти
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

export { ProfileMenu }
