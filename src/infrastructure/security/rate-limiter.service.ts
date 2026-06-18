import { RedisService } from '../redis/redis.service.js'
import { logger } from '../logger/logger.js'

interface RateLimitConfig {
  points: number
  duration: number
  blockDuration: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  blocked: boolean
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  api: { points: 100, duration: 60, blockDuration: 300 },
  auth: { points: 10, duration: 60, blockDuration: 900 },
  bot: { points: 30, duration: 60, blockDuration: 120 },
  sensitive: { points: 3, duration: 300, blockDuration: 1800 },
}

export class RateLimiterService {
  private readonly redis = RedisService.getInstance()
  private readonly PREFIX = 'ratelimit:'
  private readonly BLOCK_PREFIX = 'ratelimit:blocked:'

  async check(key: string, tier: keyof typeof DEFAULT_CONFIGS = 'api'): Promise<RateLimitResult> {
    const config = DEFAULT_CONFIGS[tier]
    const blockKey = `${this.BLOCK_PREFIX}${key}`
    const rateKey = `${this.PREFIX}${key}`

    const blocked = await this.redis.get<string>(blockKey)
    if (blocked) {
      const ttl = await this.redis.ttl(blockKey)
      return { allowed: false, remaining: 0, resetAt: Date.now() + ttl * 1000, blocked: true }
    }

    const current = await this.redis.get<string>(rateKey)
    const count = current ? Number.parseInt(current, 10) : 0

    if (count >= config.points) {
      await this.redis.set(blockKey, '1', config.blockDuration)
      await this.redis.del(rateKey)
      logger.warn({ key, tier, count }, 'Rate limit exceeded, user blocked')
      return { allowed: false, remaining: 0, resetAt: Date.now() + config.blockDuration * 1000, blocked: true }
    }

    if (count === 0) {
      await this.redis.set(rateKey, '1', config.duration)
    } else {
      await this.redis.incr(rateKey)
    }

    const ttl = await this.redis.ttl(rateKey)
    return {
      allowed: true,
      remaining: config.points - (count + 1),
      resetAt: Date.now() + (ttl > 0 ? ttl : config.duration) * 1000,
      blocked: false,
    }
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(`${this.PREFIX}${key}`)
    await this.redis.del(`${this.BLOCK_PREFIX}${key}`)
  }
}
