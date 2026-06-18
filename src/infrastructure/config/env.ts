import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  BOT_TOKEN: z.string().default(''),
  DATABASE_URL: z.string().default('postgresql://localhost:5432/spnetgram_adminbot'),
  REDIS_URL: z.string().default('redis://localhost:6379/0'),
  JWT_SECRET: z.string().default('dev-secret'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
