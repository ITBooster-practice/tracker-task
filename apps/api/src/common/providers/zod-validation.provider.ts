import { BadRequestException } from '@nestjs/common'
import { createZodValidationPipe } from 'nestjs-zod'

export const CustomZodValidationPipe = createZodValidationPipe({
	createValidationException: (error: any) => {
		const zodError = error as any
		const errors = zodError.issues

		const paths = errors.map((err: any) => err.path.join('.'))
		const messages = errors.map((err: any) => err.message)

		return new BadRequestException({
			statusCode: 400,
			path: paths,
			message: messages,
		})
	},
})
