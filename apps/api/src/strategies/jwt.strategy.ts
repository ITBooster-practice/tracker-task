import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { Request } from 'express'
import { AuthService } from 'src/auth/auth.service'
import { JwtPayload } from 'src/auth/interfaces/jwt.interface'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly authService: AuthService,
		private readonly configService: ConfigService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				// TODO: удалить после полного перехода на cookie
				ExtractJwt.fromAuthHeaderAsBearerToken(),
				(req: Request) => req?.cookies?.['accessToken'] ?? null,
			]),
			ignoreExpiration: false,
			secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
			algorithms: ['HS256'],
		})
	}

	async validate(payload: JwtPayload) {
		return await this.authService.validateUser(payload.id)
	}
}
