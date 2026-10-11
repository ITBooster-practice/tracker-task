import {
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common'
import {
	REQUIRED_FEATURE_KEYS,
	getConnectedFeature,
	type CreateFeatureFlag,
	type FeatureFlagsList,
	type FeatureFlagsSnapshot,
	type UpdateFeatureFlag,
} from '@repo/types'
import { Subject } from 'rxjs'
import { PrismaService } from '../../prisma/prisma.service'
import { Prisma, type FeatureFlag } from '../../generated/prisma/client'

type Change = { flag: FeatureFlag; before: FeatureFlag | null; action: string }
const toJson = (value: FeatureFlag): Prisma.InputJsonValue =>
	JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
const toFlag = (flag: FeatureFlag, createdByName: string | null) => ({
	createdByName,
	...flag,
	createdAt: flag.createdAt.toISOString(),
	updatedAt: flag.updatedAt.toISOString(),
	archivedAt: flag.archivedAt?.toISOString() ?? null,
	expiresAt: flag.expiresAt?.toISOString() ?? null,
	required: REQUIRED_FEATURE_KEYS.includes(flag.key),
	connectedFeature: getConnectedFeature(flag.key),
})

@Injectable()
export class FeatureFlagsService {
	readonly changes = new Subject<number>()
	constructor(private readonly prisma: PrismaService) {}

	async isEnabled(key: string): Promise<boolean> {
		const flag = await this.prisma.featureFlag.findUnique({
			where: { key },
			select: { enabled: true, archivedAt: true },
		})
		return Boolean(flag?.enabled && !flag.archivedAt)
	}
	async requireEnabled(key: string): Promise<void> {
		if (!(await this.isEnabled(key)))
			throw new ForbiddenException({
				statusCode: 403,
				code: 'FEATURE_DISABLED',
				key,
				message: 'Функция временно недоступна',
			})
	}
	async snapshot(): Promise<FeatureFlagsSnapshot> {
		return this.prisma.$transaction(
			async (tx) => {
				const revision = await tx.featureFlagsRevision.findUniqueOrThrow({
					where: { id: 'global' },
				})
				const flags = await tx.featureFlag.findMany({
					where: { archivedAt: null },
					select: { key: true, enabled: true, updatedAt: true },
					orderBy: { key: 'asc' },
				})
				return {
					version: revision.version,
					flags: flags.map((flag) => ({
						...flag,
						updatedAt: flag.updatedAt.toISOString(),
					})),
				}
			},
			{ isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
		)
	}
	async list(): Promise<FeatureFlagsList> {
		return this.prisma.$transaction(
			async (tx) => {
				const revision = await tx.featureFlagsRevision.findUniqueOrThrow({
					where: { id: 'global' },
				})
				const flags = await tx.featureFlag.findMany({ orderBy: { key: 'asc' } })
				const names = await this.authorNames(
					tx,
					flags.map((flag) => flag.createdById),
				)
				return {
					version: revision.version,
					flags: flags.map((flag) => toFlag(flag, names.get(flag.createdById) ?? null)),
				}
			},
			{ isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
		)
	}
	async version(): Promise<number> {
		return (
			await this.prisma.featureFlagsRevision.findUniqueOrThrow({
				where: { id: 'global' },
			})
		).version
	}
	create(actorId: string, dto: CreateFeatureFlag) {
		return this.mutate(actorId, undefined, async (tx) => {
			this.validateDeadline(dto.expiresAt)
			return {
				flag: await tx.featureFlag.create({
					data: {
						...dto,
						enabled: false,
						expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
						createdById: actorId,
					},
				}),
				before: null,
				action: 'CREATE',
			}
		})
	}
	update(actorId: string, id: string, dto: UpdateFeatureFlag) {
		const { expectedVersion, ...data } = dto
		return this.mutate(actorId, expectedVersion, async (tx) => {
			const before = await this.activeFlag(tx, id)
			if (data.enabled === true && !getConnectedFeature(before.key))
				throw new UnprocessableEntityException(
					'Флаг не подключён к приложению. Добавьте проверки и запись в FEATURE_REGISTRY, затем выпустите обновление.',
				)
			if (
				data.expiresAt &&
				new Date(data.expiresAt).getTime() !== before.expiresAt?.getTime()
			)
				this.validateDeadline(data.expiresAt)
			const flag = await tx.featureFlag.update({
				where: { id },
				data: {
					...data,
					expiresAt:
						data.expiresAt === undefined
							? undefined
							: data.expiresAt
								? new Date(data.expiresAt)
								: null,
				},
			})
			return { flag, before, action: 'UPDATE' }
		})
	}
	archive(actorId: string, id: string, expectedVersion: number) {
		return this.mutate(actorId, expectedVersion, async (tx) => {
			const before = await this.activeFlag(tx, id)
			if (REQUIRED_FEATURE_KEYS.includes(before.key))
				throw new ConflictException(
					'Сначала удалите проверки из поддерживаемых версий кода и ключ из REQUIRED_FEATURE_KEYS',
				)
			const flag = await tx.featureFlag.update({
				where: { id },
				data: { enabled: false, archivedAt: new Date() },
			})
			return { flag, before, action: 'ARCHIVE' }
		})
	}
	async audit(id: string) {
		if (
			!(await this.prisma.featureFlag.findUnique({ where: { id }, select: { id: true } }))
		)
			throw new NotFoundException('Флаг не найден')
		const entries = await this.prisma.featureFlagAudit.findMany({
			where: { flagId: id },
			orderBy: { version: 'desc' },
			take: 100,
		})
		const names = await this.authorNames(
			this.prisma,
			entries.map((entry) => entry.actorId),
		)
		return entries.map((entry) => ({
			...entry,
			actorName: names.get(entry.actorId) ?? null,
		}))
	}
	private async authorNames(
		client: Pick<Prisma.TransactionClient, 'user'>,
		ids: string[],
	) {
		const names = new Map<string, string | null>([['bootstrap', 'Система']])
		const userIds = [...new Set(ids)].filter((id) => id !== 'bootstrap')
		if (userIds.length) {
			const users = await client.user.findMany({
				where: { id: { in: userIds } },
				select: { id: true, name: true },
			})
			for (const user of users) names.set(user.id, user.name?.trim() || null)
		}
		return names
	}
	private validateDeadline(value: string | null | undefined) {
		const milliseconds = value ? new Date(value).getTime() : null
		if (
			milliseconds !== null &&
			(!Number.isFinite(milliseconds) || milliseconds < Date.now())
		)
			throw new UnprocessableEntityException(
				'Плановая дата и время не могут быть раньше текущего времени сервера',
			)
	}
	private async activeFlag(tx: Prisma.TransactionClient, id: string) {
		const flag = await tx.featureFlag.findUnique({ where: { id } })
		if (!flag) throw new NotFoundException('Флаг не найден')
		if (flag.archivedAt)
			throw new ConflictException('Архивированный флаг нельзя изменить или восстановить')
		return flag
	}
	private async mutate(
		actorId: string,
		expectedVersion: number | undefined,
		operation: (tx: Prisma.TransactionClient) => Promise<Change>,
	) {
		try {
			const result = await this.prisma.$transaction(async (tx) => {
				// Блокировка общей версии сериализует записи и исключает изменения по устаревшему снимку.
				const revision = await tx.featureFlagsRevision.update({
					where: { id: 'global' },
					data: { version: { increment: 1 } },
				})
				if (expectedVersion !== undefined && revision.version !== expectedVersion + 1)
					throw new ConflictException(
						'Флаги уже изменились. Обновите список и повторите действие',
					)
				const change = await operation(tx)
				await tx.featureFlagAudit.create({
					data: {
						flagId: change.flag.id,
						actorId,
						action: change.action,
						before: change.before ? toJson(change.before) : Prisma.DbNull,
						after: toJson(change.flag),
						version: revision.version,
					},
				})
				const names = await this.authorNames(tx, [change.flag.createdById])
				return {
					version: revision.version,
					flag: toFlag(change.flag, names.get(change.flag.createdById) ?? null),
				}
			})
			this.changes.next(result.version)
			return result
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
				throw new ConflictException(
					'Этот технический ключ уже существует или зарезервирован архивом',
				)
			throw error
		}
	}
}
