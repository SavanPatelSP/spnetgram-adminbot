import { PrismaService } from '../database/prisma.service.js'
import { RedisService } from '../redis/redis.service.js'
import { logger } from '../logger/logger.js'

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  uptime: number
  timestamp: string
  checks: {
    database: { status: string; latency?: number; error?: string }
    redis: { status: string; latency?: number; error?: string }
    memory: { status: string; usage: number; heapUsed: number; heapTotal: number }
    uptime: { status: string; seconds: number }
  }
}

export class HealthService {
  private readonly startTime = Date.now()

  async check(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
    ])

    const allHealthy = checks.every(c => c.status === 'healthy')
    const anyDegraded = checks.some(c => c.status === 'degraded')

    return {
      status: allHealthy ? 'healthy' : anyDegraded ? 'degraded' : 'unhealthy',
      version: process.env.npm_package_version || '0.1.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      checks: {
        database: checks[0],
        redis: checks[1],
        memory: checks[2],
        uptime: { status: 'healthy', seconds: Math.floor((Date.now() - this.startTime) / 1000) },
      },
    }
  }

  async checkReadiness(): Promise<boolean> {
    try {
      const db = await this.checkDatabase()
      const redis = await this.checkRedis()
      return db.status === 'healthy' && redis.status === 'healthy'
    } catch {
      return false
    }
  }

  async checkLiveness(): Promise<boolean> {
    return true
  }

  private async checkDatabase(): Promise<{ status: string; latency?: number; error?: string }> {
    try {
      const prisma = PrismaService.getInstance().client
      const start = performance.now()
      await prisma.$queryRaw`SELECT 1`
      const latency = performance.now() - start
      return { status: latency < 1000 ? 'healthy' : 'degraded', latency }
    } catch (err) {
      logger.error({ err }, 'Database health check failed')
      return { status: 'unhealthy', error: (err as Error).message }
    }
  }

  private async checkRedis(): Promise<{ status: string; latency?: number; error?: string }> {
    try {
      const redis = RedisService.getInstance()
      const start = performance.now()
      await redis.set('health:ping', '1', 5)
      const result = await redis.get('health:ping')
      const latency = performance.now() - start
      if (result !== '1') return { status: 'unhealthy', error: 'Redis read/write mismatch' }
      return { status: latency < 500 ? 'healthy' : 'degraded', latency }
    } catch (err) {
      logger.error({ err }, 'Redis health check failed')
      return { status: 'unhealthy', error: (err as Error).message }
    }
  }

  private async checkMemory(): Promise<{ status: string; usage: number; heapUsed: number; heapTotal: number }> {
    const mem = process.memoryUsage()
    const usage = mem.heapUsed / mem.heapTotal
    return {
      status: usage < 0.9 ? 'healthy' : usage < 0.95 ? 'degraded' : 'unhealthy',
      usage,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
    }
  }

  getUptimeSeconds(): number {
    return Math.floor((Date.now() - this.startTime) / 1000)
  }
}
