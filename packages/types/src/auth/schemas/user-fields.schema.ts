import { z } from 'zod'

type CreateEmailSchemaMessages = {
	invalid?: string
	required?: string
}

const createEmailSchema = (messages?: CreateEmailSchemaMessages) =>
	z
		.email({ message: messages?.invalid ?? 'Email некорректный' })
		.min(1, { message: messages?.required ?? 'Email не может быть пустым' })

const userEmailSchema = createEmailSchema()

const userNameSchema = z
	.string({ message: 'Имя должно быть строкой' })
	.max(50, { message: 'Имя должно быть не длиннее 50 символов' })

export { createEmailSchema, userEmailSchema, userNameSchema }
