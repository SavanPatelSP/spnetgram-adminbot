import Redis from 'ioredis'
import { env } from '../config/env'
import { safeStringify } from '../../shared/utils/safe-json.js'

export class RedisService {
  private static instance: RedisService
  public client: Redis

  private constructor() {
    this.client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 50, 2000)
      },
    })
  }

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService()
    }
    return RedisService.instance
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key)
    return value ? JSON.parse(value) : null
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = safeStringify(value)
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized)
    } else {
      await this.client.set(key, serialized)
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key)
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds)
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key)
  }

  async quit(): Promise<void> {
    await this.client.quit()
  }
}
