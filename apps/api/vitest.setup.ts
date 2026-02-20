import 'reflect-metadata'
import { config } from 'dotenv'
import { resolve } from 'path'

// Загружаем .env файл перед запуском тестов
config({ path: resolve(__dirname, '.env') })
