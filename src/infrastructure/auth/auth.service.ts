import jwt from 'jsonwebtoken'
import { randomBytes, createHash } from 'node:crypto'
import { env } from '../config/env.js'
import { RedisService } from '../redis/redis.service.js'
import { logger } from '../logger/logger.js'

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface TokenPayload {
  sub: string
  staffId: string
  role: string
  type: 'access' | 'refresh'
  jti?: string
  fingerprint?: string
}

export class AuthService {
  private readonly redis = RedisService.getInstance()
  private readonly ACCESS_TOKEN_EXPIRY = 900
  private readonly REFRESH_TOKEN_EXPIRY = 604800
  private readonly BLACKLIST_PREFIX = 'auth:blacklist:'
  private readonly REFRESH_PREFIX = 'auth:refresh:'

  generateTokenPair(payload: { sub: string; staffId: string; role: string }, fingerprint?: string): TokenPair {
    const jti = randomBytes(16).toString('hex')
    const accessToken = jwt.sign(
      { ...payload, type: 'access', jti, fingerprint },
      env.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY },
    )
    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh', jti },
      env.JWT_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY },
    )
    return { accessToken, refreshToken, expiresIn: this.ACCESS_TOKEN_EXPIRY }
  }

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const result = await this.redis.get(`${this.BLACKLIST_PREFIX}${jti}`)
    return result !== null
  }

  async blacklistToken(jti: string, expiresIn: number): Promise<void> {
    await this.redis.set(`${this.BLACKLIST_PREFIX}${jti}`, '1', expiresIn)
  }

  async storeRefreshToken(jti: string, staffId: string): Promise<void> {
    await this.redis.set(`${this.REFRESH_PREFIX}${jti}`, staffId, this.REFRESH_TOKEN_EXPIRY)
  }

  async validateRefreshToken(jti: string, staffId: string): Promise<boolean> {
    const stored = await this.redis.get(`${this.REFRESH_PREFIX}${jti}`)
    return stored === staffId
  }

  async revokeRefreshToken(jti: string): Promise<void> {
    await this.redis.del(`${this.REFRESH_PREFIX}${jti}`)
  }

  async revokeAllUserSessions(staffId: string): Promise<void> {
    await this.redis.set(`auth:version:${staffId}`, Date.now().toString())
    logger.warn({ staffId }, 'All sessions revoked for user')
  }

  async invalidateSession(staffId: string, jti: string): Promise<void> {
    await this.blacklistToken(jti, this.ACCESS_TOKEN_EXPIRY)
    await this.revokeRefreshToken(jti)
    logger.info({ staffId, jti }, 'Session invalidated')
  }

  computeFingerprint(ip: string, userAgent: string): string {
    return createHash('sha256').update(`${ip}|${userAgent}`).digest('hex')
  }
}
