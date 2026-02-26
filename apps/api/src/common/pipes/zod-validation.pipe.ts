import { PipeTransform, BadRequestException } from '@nestjs/common'
import { z } from 'zod'

export class ZodValidationPipe implements PipeTransform {
	constructor(private schema: z.ZodTypeAny) {}

	transform(value: unknown) {
		const result = this.schema.safeParse(value)

		if (!result.success) {
			throw new BadRequestException(result.error.flatten())
		}

		return result.data
	}
}
