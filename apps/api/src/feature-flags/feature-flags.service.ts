import {
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common'
import {
	getConnectedFeature,
	type FeatureFlagsList,
	type FeatureFlagsSnapshot,
	type UpdateFeatureFlag,
} from '@repo/types'
import { Subject } from 'rxjs'
import { PrismaService } from '../../prisma/prisma.service'
import { Prisma, type FeatureFlag } from '../../generated/prisma/client'

const toFlag = (flag: FeatureFlag) => ({
	id: flag.id,
	key: flag.key,
	enabled: flag.enabled,
	updatedAt: flag.updatedAt.toISOString(),
	connectedFeature: getConnectedFeature(flag.key),
})

@Injectable()
export class FeatureFlagsService {
	readonly changes = new Subject<number>()
	constructor(private readonly prisma: PrismaService) {}

	async isEnabled(key: string): Promise<boolean> {
		if (!getConnectedFeature(key)) return false
		const flag = await this.prisma.featureFlag.findUnique({
			where: { key },
			select: { enabled: true },
		})
		return flag?.enabled ?? false
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
					select: { key: true, enabled: true, updatedAt: true },
					orderBy: { key: 'asc' },
				})
				return {
					version: revision.version,
					flags: flags.map((flag) => ({
						key: flag.key,
						enabled: flag.enabled && Boolean(getConnectedFeature(flag.key)),
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
				return { version: revision.version, flags: flags.map(toFlag) }
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

	async update(id: string, { enabled, expectedVersion }: UpdateFeatureFlag) {
		const result = await this.prisma.$transaction(async (tx) => {
			// Общая версия сериализует записи и откатывается вместе с неуспешным изменением.
			const revision = await tx.featureFlagsRevision.update({
				where: { id: 'global' },
				data: { version: { increment: 1 } },
			})
			if (revision.version !== expectedVersion + 1)
				throw new ConflictException(
					'Флаги уже изменились. Обновите список и повторите действие',
				)
			const current = await tx.featureFlag.findUnique({ where: { id } })
			if (!current) throw new NotFoundException('Флаг не найден')
			if (enabled && !getConnectedFeature(current.key))
				throw new UnprocessableEntityException('Флаг не подключён к приложению')
			const flag = await tx.featureFlag.update({ where: { id }, data: { enabled } })
			return { version: revision.version, flag: toFlag(flag) }
		})
		this.changes.next(result.version)
		return result
	}
}
