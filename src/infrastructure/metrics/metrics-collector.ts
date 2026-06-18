import { RedisService } from '../redis/redis.service.js'
import { logger } from '../logger/logger.js'

interface MetricPoint {
  value: number
  timestamp: string
  tags?: Record<string, string>
}

interface HttpMetric {
  method: string
  path: string
  statusCode: number
  duration: number
  correlationId?: string
}

export class MetricsCollector {
  private readonly redis = RedisService.getInstance()
  private readonly METRICS_PREFIX = 'metrics:'
  private readonly counters = new Map<string, number>()
  private readonly gauges = new Map<string, number>()
  private flushTimer: NodeJS.Timeout | null = null

  startFlushLoop(intervalMs = 30000): void {
    this.flushTimer = setInterval(() => this.flush(), intervalMs)
  }

  stopFlushLoop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  incrementCounter(name: string, value = 1, tags?: Record<string, string>): void {
    const key = tags ? `${name}:${JSON.stringify(tags)}` : name
    this.counters.set(key, (this.counters.get(key) || 0) + value)
  }

  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = tags ? `${name}:${JSON.stringify(tags)}` : name
    this.gauges.set(key, value)
  }

  recordHttpRequest(metric: HttpMetric): void {
    this.incrementCounter('http.requests', 1, { method: metric.method, path: metric.path, status: String(metric.statusCode) })
    this.setGauge('http.duration', metric.duration, { method: metric.method, path: metric.path })
    
    if (metric.duration > 1000) {
      logger.warn({
        ...metric,
        metricType: 'slow_request',
      }, 'Slow HTTP request detected')
    }
  }

  recordDbQuery(model: string, action: string, duration: number): void {
    this.incrementCounter('db.queries', 1, { model, action })
    this.setGauge('db.duration', duration, { model, action })
    
    if (duration > 500) {
      logger.warn({ model, action, duration, metricType: 'slow_query' }, 'Slow database query detected')
    }
  }

  recordBotCommand(command: string, userId: string, duration: number): void {
    this.incrementCounter('bot.commands', 1, { command })
    this.setGauge('bot.duration', duration, { command })
  }

  recordSecurityEvent(eventType: string, severity: string): void {
    this.incrementCounter('security.events', 1, { eventType, severity })
  }

  async getMetric(name: string): Promise<number> {
    const redisKey = `${this.METRICS_PREFIX}${name}`
    const val = await this.redis.get<string>(redisKey)
    return val ? Number(val) : 0
  }

  private async flush(): Promise<void> {
    try {
      const pipeline = (this.redis as any).client.pipeline()
      for (const [key, value] of this.counters) {
        const redisKey = `${this.METRICS_PREFIX}counter:${key}`
        pipeline.incrby(redisKey, value)
        pipeline.expire(redisKey, 86400 * 7)
      }
      for (const [key, value] of this.gauges) {
        const redisKey = `${this.METRICS_PREFIX}gauge:${key}`
        pipeline.set(redisKey, String(value))
        pipeline.expire(redisKey, 86400 * 7)
      }
      await pipeline.exec()
      this.counters.clear()
      this.gauges.clear()
    } catch (err) {
      logger.error({ err }, 'Failed to flush metrics')
    }
  }
}

export const metricsCollector = new MetricsCollector()
