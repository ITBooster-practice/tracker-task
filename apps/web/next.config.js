import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
	allowedDevOrigins: ['http://localhost:3000'],

	// Формирует самодостаточный серверный bundle в .next/standalone/.
	// Как он используется — смотри apps/web/Dockerfile.
	output: 'standalone',

	// Указывает Next.js трассировать файлы от корня монорепо, чтобы общие
	// пакеты (packages/ui, packages/types и др.) попали в standalone-bundle.
	// Без этого симлинки воркспейс-пакетов отсутствовали бы в production-образе.
	outputFileTracingRoot: path.join(__dirname, '../../'),
}

export default nextConfig
