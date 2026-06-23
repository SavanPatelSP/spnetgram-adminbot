import { RedisService } from '../redis/redis.service.js'
import { logger } from '../logger/logger.js'
import { safeStringify } from '../../shared/utils/safe-json.js'

interface IpReputation {
  score: number
  lastSeen: string
  failedAttempts: number
  flagged: boolean
}

export class IpReputationService {
  private readonly redis = RedisService.getInstance()
  private readonly PREFIX = 'ip:rep:'
  private readonly FAIL_PREFIX = 'ip:fail:'
  private readonly FAIL_THRESHOLD = 10
  private readonly BAN_DURATION = 86400

  async recordAttempt(ip: string, success: boolean): Promise<void> {
    if (!success) {
      const key = `${this.FAIL_PREFIX}${ip}`
      const count = await this.redis.incr(key)
      if (count === 1) {
        await this.redis.expire(key, 3600)
      }
      if (count >= this.FAIL_THRESHOLD) {
        await this.ban(ip)
        logger.warn({ ip, count }, 'IP banned due to excessive failures')
      }
    } else {
      await this.redis.del(`${this.FAIL_PREFIX}${ip}`)
    }

    const repKey = `${this.PREFIX}${ip}`
    const existing = await this.redis.get<string>(repKey)
    const rep: IpReputation = existing
      ? JSON.parse(existing)
      : { score: 0, lastSeen: new Date().toISOString(), failedAttempts: 0, flagged: false }

    rep.lastSeen = new Date().toISOString()
    if (!success) {
      rep.failedAttempts++
      rep.score = Math.max(-100, rep.score - 10)
    } else {
      rep.failedAttempts = 0
      rep.score = Math.min(100, rep.score + 1)
    }

    if (rep.score <= -50) rep.flagged = true
    await this.redis.set(repKey, safeStringify(rep), 86400 * 7)
  }

  async check(ip: string): Promise<{ allowed: boolean; reason?: string }> {
    const banned = await this.redis.get<string>(`ip:banned:${ip}`)
    if (banned) return { allowed: false, reason: 'IP is banned' }

    const key = `${this.FAIL_PREFIX}${ip}`
    const fails = await this.redis.get<string>(key)
    if (fails && Number(fails) >= this.FAIL_THRESHOLD) {
      return { allowed: false, reason: 'Too many failed attempts' }
    }

    const repKey = `${this.PREFIX}${ip}`
    const rep = await this.redis.get<string>(repKey)
    if (rep) {
      const data: IpReputation = JSON.parse(rep)
      if (data.flagged) return { allowed: false, reason: 'Low IP reputation' }
    }

    return { allowed: true }
  }

  async ban(ip: string): Promise<void> {
    await this.redis.set(`ip:banned:${ip}`, '1', this.BAN_DURATION)
    logger.warn({ ip }, 'IP address banned')
  }

  async unban(ip: string): Promise<void> {
    await this.redis.del(`ip:banned:${ip}`)
    await this.redis.del(`${this.FAIL_PREFIX}${ip}`)
    logger.info({ ip }, 'IP address unbanned')
  }
}
