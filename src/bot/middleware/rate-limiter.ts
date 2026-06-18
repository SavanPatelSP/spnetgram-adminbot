import type { Context, Middleware } from 'telegraf'
import { RedisService } from '../../infrastructure/redis/redis.service.js'

const redis = RedisService.getInstance()

export function rateLimiter(maxRequests = 10, windowSeconds = 60): Middleware<Context> {
  return async (ctx, next) => {
    const userId = ctx.from?.id
    if (!userId) {
      await next()
      return
    }

    const key = `ratelimit:bot:${userId}`
    const current = await redis.client.incr(key)

    if (current === 1) {
      await redis.client.expire(key, windowSeconds)
    }

    if (current > maxRequests) {
      await ctx.reply('Too many requests. Please slow down.')
      return
    }

    await next()
  }
}
