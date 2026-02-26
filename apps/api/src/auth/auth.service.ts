import { ConflictException, Injectable } from '@nestjs/common'
import { RegisterRequestDto } from './dto/register.dto'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class AuthService {
	constructor(private readonly prismaService: PrismaService) {}

	async register(dto: RegisterRequestDto) {
		const { name, email, password } = dto

		const existUser = await this.prismaService.user.findUnique({
			where: {
				email,
			},
		})

		if (existUser) {
			throw new ConflictException('Пользователь с таким email уже существует')
		}

		const user = await this.prismaService.user.create({
			data: {
				name,
				email,
				password,
			},
		})

		return user
	}
}
