import { UnprocessableEntityException } from '@nestjs/common'
import { createZodValidationPipe } from 'nestjs-zod'

export const FeatureFlagValidationPipe = createZodValidationPipe({
	createValidationException: (error) => {
		const issues = (error as { issues: { path: unknown[]; message: string }[] }).issues
		return new UnprocessableEntityException({
			statusCode: 422,
			path: issues.map((issue) => issue.path.join('.')),
			message: issues.map((issue) => issue.message),
		})
	},
})
