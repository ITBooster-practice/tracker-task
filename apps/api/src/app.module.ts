import { Module } from '@nestjs/common'

import { AppService } from './app.service'
import { AppController } from './app.controller'

import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from './auth/auth.module'

@Module({
	imports: [PrismaModule, AuthModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
