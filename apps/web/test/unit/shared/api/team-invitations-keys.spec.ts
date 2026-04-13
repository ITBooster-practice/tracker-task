import { describe, expect, it } from 'vitest'

import { teamInvitationsKeys } from '@/shared/api/use-team-invitations'

describe('teamInvitationsKeys', () => {
	it('all', () => {
		expect(teamInvitationsKeys.all).toEqual(['teams', 'invitations'])
	})

	it('teamLists', () => {
		expect(teamInvitationsKeys.teamLists()).toEqual(['teams', 'invitations', 'team-list'])
	})

	it('teamList', () => {
		expect(teamInvitationsKeys.teamList('team-1')).toEqual([
			'teams',
			'invitations',
			'team-list',
			'team-1',
		])
	})

	it('send', () => {
		expect(teamInvitationsKeys.send('team-1')).toEqual([
			'teams',
			'invitations',
			'send',
			'team-1',
		])
	})

	it('revoke', () => {
		expect(teamInvitationsKeys.revoke('team-1')).toEqual([
			'teams',
			'invitations',
			'revoke',
			'team-1',
		])
	})

	it('myLists', () => {
		expect(teamInvitationsKeys.myLists()).toEqual(['teams', 'invitations', 'my-list'])
	})

	it('myList', () => {
		expect(teamInvitationsKeys.myList()).toEqual(['teams', 'invitations', 'my-list'])
	})

	it('accept', () => {
		expect(teamInvitationsKeys.accept()).toEqual(['teams', 'invitations', 'accept'])
	})

	it('decline', () => {
		expect(teamInvitationsKeys.decline()).toEqual(['teams', 'invitations', 'decline'])
	})
})
