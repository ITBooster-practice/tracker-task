import 'reflect-metadata'
import { config } from 'dotenv'
import { resolve } from 'path'

// Загружаем .env, потом .env.test (override: false — не перезаписывает уже установленные)
config({ path: resolve(__dirname, '.env.test'), override: false })
