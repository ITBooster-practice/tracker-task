import { cookies } from 'next/headers'

import { InvitationPageView } from '@/views/invitations'

type InvitationTokenPageProps = {
	params: Promise<{
		token: string
	}>
}

export default async function InvitationTokenPage({ params }: InvitationTokenPageProps) {
	const { token } = await params
	const cookieStore = await cookies()
	const hasAuthSession = Boolean(
		cookieStore.get('accessToken')?.value || cookieStore.get('refreshToken')?.value,
	)

	return <InvitationPageView token={token} hasAuthSession={hasAuthSession} />
}
