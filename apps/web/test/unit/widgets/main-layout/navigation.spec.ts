import { describe, expect, it } from 'vitest'

import { FEATURE_KEYS, type FeatureFlagsSnapshot } from '@repo/types'

import { getSidebarSections } from '@/widgets/main-layout/model/sidebar/navigation'

const snapshot: FeatureFlagsSnapshot = {
	version: 1,
	flags: Object.values(FEATURE_KEYS).map((key) => ({
		key,
		enabled: true,
		updatedAt: '2026-10-10T00:00:00.000Z',
	})),
}
const find = (
	title: string,
	data: FeatureFlagsSnapshot | null = snapshot,
	developer = false,
	team: string | null = 'team-1',
	project: string | null = 'project-1',
) =>
	getSidebarSections(team, project, data, developer)
		.flatMap((section) => section.items)
		.find((item) => item.title === title)
describe('Runtime sidebar navigation', () => {
	it('keeps team/project-specific links', () => {
		expect(find('Проекты')?.href).toBe('/teams/team-1/projects')
		expect(find('Обзор проекта')?.href).toBe('/teams/team-1/projects/project-1')
		expect(find('Задачи')?.href).toBe('/teams/team-1/projects/project-1/tasks')
		expect(find('Настройки команды')?.href).toBe('/teams/team-1/settings')
		expect(find('Доска')?.href).toBe('/teams/team-1/projects/project-1/board')
	})
	it('keeps missing-context entries in place with explicit reasons and no fake links', () => {
		expect(find('Проекты', snapshot, false, null)).toMatchObject({
			disabledReason: 'Сначала выберите команду',
		})
		for (const title of ['Обзор проекта', 'Задачи', 'Доска']) {
			expect(find(title, snapshot, false, 'team-1', null)).toMatchObject({
				disabledReason: 'Сначала выберите проект',
			})
			expect(find(title, snapshot, false, 'team-1', null)?.href).toBeUndefined()
			expect(find(title, snapshot, false, null, 'project-1')).toMatchObject({
				disabledReason: 'Сначала выберите команду',
			})
		}
		const titles = (team: string | null, project: string | null) =>
			getSidebarSections(team, project, snapshot)
				.flatMap((section) => section.items)
				.map((item) => item.title)
		expect(titles(null, null)).toEqual(titles('team-1', null))
		expect(titles(null, null)).toEqual(titles('team-1', 'project-1'))
		for (const item of getSidebarSections(null, null, snapshot).flatMap(
			(section) => section.items,
		))
			expect(item.href).not.toBe('#')
	})
	it('hides team settings for members and keeps the team selection hint without a team', () => {
		const sections = getSidebarSections('team-1', null, snapshot, false, false)
		expect(
			sections
				.flatMap((section) => section.items)
				.find((item) => item.title === 'Настройки команды'),
		).toBeUndefined()
		expect(
			getSidebarSections(null, null, snapshot, false, null)
				.flatMap((section) => section.items)
				.find((item) => item.title === 'Настройки команды'),
		).toMatchObject({ disabledReason: 'Сначала выберите команду' })
	})
	it('hides flagged sections before loading', () => {
		for (const title of ['Задачи', 'Доска', 'Бэклог', 'AI Ассистент', 'Уведомления'])
			expect(find(title, null)).toBeUndefined()
		for (const title of ['Команды', 'Проекты', 'Обзор проекта', 'Настройки команды'])
			expect(find(title, null)).toBeDefined()
	})
	it('controls the AI and notification entries independently', () => {
		const disabled = {
			...snapshot,
			flags: snapshot.flags.map((flag) => ({
				...flag,
				enabled:
					flag.key !== FEATURE_KEYS.AI_ASSISTANT &&
					flag.key !== FEATURE_KEYS.NOTIFICATIONS,
			})),
		}
		for (const title of ['AI Ассистент', 'Уведомления'])
			expect(find(title, disabled)).toBeUndefined()
		for (const title of [
			'Проекты',
			'Обзор проекта',
			'Задачи',
			'Доска',
			'Настройки команды',
		])
			expect(find(title, disabled)).toBeDefined()
		expect(find('AI Ассистент')).toBeDefined()
		expect(find('Уведомления')).toBeDefined()
	})
	it('показывает пункт Бэклог только при включённом флаге', () => {
		expect(find('Бэклог')).toMatchObject({ disabledReason: 'Раздел пока недоступен' })
		const disabled = {
			...snapshot,
			flags: snapshot.flags.map((flag) => ({
				...flag,
				enabled: flag.key !== FEATURE_KEYS.BACKLOG,
			})),
		}
		expect(find('Бэклог', disabled)).toBeUndefined()
		expect(find('Доска', disabled)).toBeDefined()
		const missing = {
			...snapshot,
			flags: snapshot.flags.filter((flag) => flag.key !== FEATURE_KEYS.BACKLOG),
		}
		expect(find('Бэклог', missing)).toBeUndefined()
	})
	it('shows the management link only to the system developer', () => {
		expect(find('Флаги функций')).toBeUndefined()
		expect(find('Флаги функций', snapshot, true)?.href).toBe('/admin/feature-flags')
	})
})
