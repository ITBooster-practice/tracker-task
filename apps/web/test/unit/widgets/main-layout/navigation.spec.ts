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
		expect(find('Доска')?.href).toBe('/boards')
	})
	it('keeps unresolved selectors as placeholders', () => {
		expect(find('Проекты', snapshot, false, null)?.href).toBe('#')
		expect(find('Задачи', snapshot, false, 'team-1', null)?.href).toBe('#')
		expect(find('Обзор проекта', snapshot, false, 'team-1', null)).toBeUndefined()
	})
	it('hides flagged sections before loading', () => {
		for (const title of ['Проекты', 'Задачи', 'Доска', 'Бэклог', 'Настройки команды'])
			expect(find(title, null)).toBeUndefined()
		expect(find('Команды', null)).toBeDefined()
	})
	it('hides dependents when projects are disabled', () => {
		const disabled = {
			...snapshot,
			flags: snapshot.flags.map((flag) => ({
				...flag,
				enabled: flag.key !== 'projects',
			})),
		}
		for (const title of ['Проекты', 'Обзор проекта', 'Задачи', 'Доска'])
			expect(find(title, disabled)).toBeUndefined()
		expect(find('Настройки команды', disabled)).toBeDefined()
	})
	it('показывает пункт Бэклог только при включённом флаге', () => {
		expect(find('Бэклог')?.href).toBe('#')
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
