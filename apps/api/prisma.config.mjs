// Production ESM-конфиг для Prisma CLI — используется в Docker-контейнере.
// В разработке Prisma находит prisma.config.ts и использует его вместо этого файла.
// Этот файл (.mjs) специально не является TypeScript, чтобы он не компилировался
// NestJS-сборкой и оставался в ESM-формате, который требует Prisma 7.
import { defineConfig } from 'prisma/config'

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
	},
	datasource: {
		url: process.env.DATABASE_URL,
	},
})
