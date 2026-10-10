import {
	Inject,
	Injectable,
	Logger,
	OnModuleDestroy,
	OnModuleInit,
	type MessageEvent,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Redis } from 'ioredis'
import { Observable, Subject, type Subscription } from 'rxjs'
import { PrismaService } from '../../prisma/prisma.service'
import { REDIS_CLIENT } from '../common/redis/redis.constants'
import { FeatureFlagsService } from './feature-flags.service'

export const FEATURE_FLAGS_CHANNEL = 'tracker:feature-flags:changed'

@Injectable()
export class FeatureFlagsEventsService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(FeatureFlagsEventsService.name)
	private readonly notifications = new Subject<number>()
	private readonly subscriber: Redis
	private changes?: Subscription
	private timer?: ReturnType<typeof setInterval>
	private observedVersion: number | undefined
	private checking = false
	private destroyed = false

	constructor(
		@Inject(REDIS_CLIENT) private readonly publisher: Redis,
		private readonly flags: FeatureFlagsService,
		private readonly jwt: JwtService,
		private readonly prisma: PrismaService,
	) {
		// A Pub/Sub connection cannot serve normal Redis commands.
		this.subscriber = publisher.duplicate({
			lazyConnect: true,
			enableOfflineQueue: false,
			maxRetriesPerRequest: 1,
		})
	}
	onModuleInit() {
		this.changes = this.flags.changes.subscribe((version) => {
			this.notifications.next(version)
			void this.publisher.publish(FEATURE_FLAGS_CHANNEL, String(version)).catch(() => {
				this.logger.warn(
					'Уведомление Redis не отправлено; состояние восстановится сверкой версии БД',
				)
			})
		})
		this.subscriber.on('error', () =>
			this.logger.warn('Подписка Redis недоступна; используется сверка версии БД'),
		)
		this.subscriber.on('ready', () => {
			void this.subscriber
				.subscribe(FEATURE_FLAGS_CHANNEL)
				.catch(() => this.logger.warn('Не удалось подписаться на изменения флагов'))
			void this.reconcile()
		})
		this.subscriber.on('message', (channel, message) => {
			const version = Number(message)
			if (
				channel === FEATURE_FLAGS_CHANNEL &&
				Number.isSafeInteger(version) &&
				version >= 0
			)
				this.notifications.next(version)
		})
		void this.subscriber
			.connect()
			.catch(() => this.logger.warn('Не удалось подключить подписку Redis'))
		this.timer = setInterval(() => void this.reconcile(), 5000)
		void this.reconcile()
	}
	async reconcile(): Promise<void> {
		if (this.checking || this.destroyed) return
		this.checking = true
		try {
			const version = await this.flags.version()
			if (version !== this.observedVersion) {
				this.observedVersion = version
				this.notifications.next(version)
			}
		} catch {
			this.logger.warn('Сверка версии флагов временно недоступна')
		} finally {
			this.checking = false
		}
	}
	stream(accessToken: string, userId: string): Observable<MessageEvent> {
		return new Observable((observer) => {
			const changes = this.notifications.subscribe({
				next: (version) =>
					observer.next({
						type: 'feature-flags-changed',
						id: String(version),
						data: { version },
					}),
				complete: () => observer.complete(),
			})
			const expired = () => {
				observer.next({ type: 'session-expired', data: {} })
				observer.complete()
			}
			const payload = this.jwt.decode<{ exp?: number }>(accessToken)
			const expiry = setTimeout(
				expired,
				Math.max(0, (payload?.exp ?? 0) * 1000 - Date.now()),
			)
			let checking = false
			const heartbeat = setInterval(() => {
				if (checking) return
				checking = true
				void this.checkSession(accessToken, userId)
					.then((valid) => {
						if (observer.closed) return
						if (!valid) expired()
						else observer.next({ type: 'heartbeat', data: {} })
					})
					.catch(() => {
						// A failed authorization check must not keep a stream open indefinitely.
						if (!observer.closed) expired()
					})
					.finally(() => {
						checking = false
					})
			}, 15000)
			// Subscribed before reading the version: changes during handshake are not lost.
			void this.flags
				.version()
				.then((version) => {
					if (!observer.closed)
						observer.next({
							type: 'feature-flags-changed',
							id: String(version),
							data: { version },
						})
				})
				.catch(() => {
					if (!observer.closed) observer.complete()
				})
			return () => {
				changes.unsubscribe()
				clearInterval(heartbeat)
				clearTimeout(expiry)
			}
		})
	}
	private async checkSession(token: string, userId: string): Promise<boolean> {
		const payload = await this.jwt.verifyAsync<{ id: string }>(token)
		return (
			payload.id === userId &&
			Boolean(
				await this.prisma.user.findUnique({
					where: { id: userId },
					select: { id: true },
				}),
			)
		)
	}
	onModuleDestroy() {
		this.destroyed = true
		if (this.timer) clearInterval(this.timer)
		this.changes?.unsubscribe()
		this.notifications.complete()
		this.subscriber.disconnect()
	}
}
