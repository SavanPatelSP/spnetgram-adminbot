import { RedisService } from '../redis/redis.service.js'
import { logger } from '../logger/logger.js'
import { safeStringify } from '../../shared/utils/safe-json.js'
import type Redis from 'ioredis'

export interface CacheOptions {
  ttl: number
  tags?: string[]
}

export class CacheService {
  private readonly redis: Redis
  private readonly TAG_PREFIX = 'cache:tag:'
  private readonly KEY_PREFIX = 'cache:'

  constructor() {
    this.redis = RedisService.getInstance().client
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = `${this.KEY_PREFIX}${key}`
    const data = await this.redis.get(fullKey)
    if (!data) return null
    return JSON.parse(data) as T
  }

  async set<T>(key: string, value: T, options: CacheOptions): Promise<void> {
    const fullKey = `${this.KEY_PREFIX}${key}`
    const serialized = safeStringify(value)
    await this.redis.setex(fullKey, options.ttl, serialized)

    if (options.tags && options.tags.length > 0) {
      for (const tag of options.tags) {
        const tagKey = `${this.TAG_PREFIX}${tag}`
        await this.redis.sadd(tagKey, fullKey)
        await this.redis.expire(tagKey, options.ttl + 3600)
      }
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = `${this.KEY_PREFIX}${key}`
    await this.redis.del(fullKey)
  }

  async invalidateByTag(tag: string): Promise<void> {
    const tagKey = `${this.TAG_PREFIX}${tag}`
    const keys = await this.redis.smembers(tagKey)
    if (keys.length > 0) {
      await this.redis.del(...keys)
      await this.redis.del(tagKey)
      logger.debug({ tag, count: keys.length }, 'Cache invalidated by tag')
    }
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, options: CacheOptions): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) return cached

    const value = await factory()
    await this.set(key, value, options)
    return value
  }

  async clear(): Promise<void> {
    const keys = await this.redis.keys(`${this.KEY_PREFIX}*`)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
    const tagKeys = await this.redis.keys(`${this.TAG_PREFIX}*`)
    if (tagKeys.length > 0) {
      await this.redis.del(...tagKeys)
    }
    logger.info('Cache fully cleared')
  }

  async refresh<T>(key: string, factory: () => Promise<T>, options: CacheOptions): Promise<T> {
    const value = await factory()
    await this.set(key, value, options)
    return value
  }
}
