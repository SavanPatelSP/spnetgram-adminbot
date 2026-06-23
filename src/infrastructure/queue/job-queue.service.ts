import { RedisService } from '../redis/redis.service.js'
import { randomUUID } from 'node:crypto'
import { logger } from '../logger/logger.js'
import { safeStringify } from '../../shared/utils/safe-json.js'
import type Redis from 'ioredis'

export interface Job {
  id: string
  type: string
  data: unknown
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  startedAt?: string
  completedAt?: string
  error?: string
  retries: number
  maxRetries: number
}

export interface JobHandler {
  (job: Job): Promise<void>
}

export class JobQueueService {
  private readonly redis: Redis
  private readonly QUEUE_PREFIX = 'queue:jobs:'
  private readonly PROCESSING_PREFIX = 'queue:processing:'
  private readonly DLQ_PREFIX = 'queue:dlq:'
  private readonly handlers = new Map<string, JobHandler>()
  private polling = false
  private pollTimer: NodeJS.Timeout | null = null

  constructor() {
    this.redis = RedisService.getInstance().client
  }

  registerHandler(jobType: string, handler: JobHandler): void {
    this.handlers.set(jobType, handler)
  }

  async enqueue(type: string, data: unknown, maxRetries = 3): Promise<Job> {
    const job: Job = {
      id: randomUUID(),
      type,
      data,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retries: 0,
      maxRetries,
    }

    await this.redis.lpush(`${this.QUEUE_PREFIX}${type}`, safeStringify(job))
    logger.debug({ jobId: job.id, type }, 'Job enqueued')
    return job
  }

  async dequeue(type: string): Promise<Job | null> {
    const data = await this.redis.rpop(`${this.QUEUE_PREFIX}${type}`)
    if (!data) return null

    const job: Job = JSON.parse(data)
    job.status = 'processing'
    job.startedAt = new Date().toISOString()
    return job
  }

  async complete(job: Job): Promise<void> {
    job.status = 'completed'
    job.completedAt = new Date().toISOString()
    logger.debug({ jobId: job.id, type: job.type }, 'Job completed')
  }

  async fail(job: Job, error: string): Promise<void> {
    job.retries++
    job.error = error

    if (job.retries < job.maxRetries) {
      job.status = 'pending'
      job.startedAt = undefined
      await this.redis.lpush(`${this.QUEUE_PREFIX}${job.type}`, safeStringify(job))
      logger.warn({ jobId: job.id, type: job.type, retries: job.retries }, 'Job will be retried')
    } else {
      job.status = 'failed'
      await this.redis.lpush(`${this.DLQ_PREFIX}${job.type}`, safeStringify(job))
      logger.error({ jobId: job.id, type: job.type, error }, 'Job moved to dead-letter queue')
    }
  }

  startPolling(type: string, intervalMs = 1000): void {
    this.polling = true
    const poll = async () => {
      if (!this.polling) return
      try {
        const job = await this.dequeue(type)
        if (job) {
          const handler = this.handlers.get(type)
          if (handler) {
            try {
              await handler(job)
              await this.complete(job)
            } catch (err) {
              await this.fail(job, (err as Error).message)
            }
          } else {
            await this.fail(job, `No handler registered for job type: ${type}`)
          }
        }
      } catch (err) {
        logger.error({ err, type }, 'Job polling error')
      }
      this.pollTimer = setTimeout(poll, intervalMs)
    }
    poll()
  }

  stopPolling(): void {
    this.polling = false
    if (this.pollTimer) {
      clearTimeout(this.pollTimer)
      this.pollTimer = null
    }
  }

  async getDeadLetterJobs(type: string): Promise<Job[]> {
    const data = await this.redis.lrange(`${this.DLQ_PREFIX}${type}`, 0, -1)
    return data.map((d: string) => JSON.parse(d))
  }

  async requeueDeadLetter(type: string): Promise<number> {
    const dlqKey = `${this.DLQ_PREFIX}${type}`
    const queueKey = `${this.QUEUE_PREFIX}${type}`
    const jobs = await this.redis.lrange(dlqKey, 0, -1)
    if (jobs.length > 0) {
      for (const jobData of jobs) {
        const job: Job = JSON.parse(jobData)
        job.status = 'pending'
        job.retries = 0
        job.error = undefined
        await this.redis.lpush(queueKey, safeStringify(job))
      }
      await this.redis.del(dlqKey)
      logger.info({ type, count: jobs.length }, 'Dead-letter jobs requeued')
    }
    return jobs.length
  }
}
