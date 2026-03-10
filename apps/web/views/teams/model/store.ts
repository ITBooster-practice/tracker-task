'use client'

import { create } from 'zustand'

import { mockTeams } from './mock-teams'
import type { TeamCardModel } from './types'

interface TeamsStore {
	teams: TeamCardModel[]
	createTeam: (name: string) => TeamCardModel | null
}

function getTeamAvatar(name: string): string {
	const [firstWord = '', secondWord = ''] = name.trim().split(/\s+/)

	return `${firstWord[0] ?? ''}${secondWord[0] ?? ''}`.toUpperCase() || 'TM'
}

function getUniqueTeamId(teams: TeamCardModel[], name: string) {
	const baseId = name.toLowerCase().trim().replace(/\s+/g, '-') || 'team'

	if (!teams.some((team) => team.id === baseId)) {
		return baseId
	}

	let suffix = 2

	while (teams.some((team) => team.id === `${baseId}-${suffix}`)) {
		suffix += 1
	}

	return `${baseId}-${suffix}`
}

export const useTeamsStore = create<TeamsStore>((set) => ({
	teams: mockTeams,
	createTeam: (name) => {
		const trimmedName = name.trim()

		if (!trimmedName) {
			return null
		}

		let createdTeam: TeamCardModel | null = null

		set((state) => {
			createdTeam = {
				id: getUniqueTeamId(state.teams, trimmedName),
				name: trimmedName,
				projectCount: 0,
				members: [
					{
						id: 'current-user',
						name: 'Алексей Иванов',
						avatar: getTeamAvatar(trimmedName),
						role: 'owner',
					},
				],
			}

			return {
				teams: createdTeam ? [createdTeam, ...state.teams] : state.teams,
			}
		})

		return createdTeam
	},
}))
