import { Module } from '@nestjs/common'
import { APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core'
import { ZodSerializerInterceptor } from 'nestjs-zod'

import { AppService } from './app.service'
import { AppController } from './app.controller'

import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { CustomZodValidationPipe } from './common/providers/zod-validation.provider'

@Module({
	imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule],
	controllers: [AppController],
	providers: [
		AppService,
		{ provide: APP_PIPE, useClass: CustomZodValidationPipe },
		{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
	],
})
export class AppModule {}
