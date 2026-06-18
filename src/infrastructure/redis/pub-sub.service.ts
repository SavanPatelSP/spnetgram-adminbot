import Redis from 'ioredis'
import { env } from '../config/env'

type MessageHandler = (channel: string, message: string) => void

export class PubSubService {
  private static instance: PubSubService
  private publisher: Redis
  private subscriber: Redis
  private handlers = new Map<string, MessageHandler[]>()

  private constructor() {
    this.publisher = new Redis(env.REDIS_URL)
    this.subscriber = new Redis(env.REDIS_URL)

    this.subscriber.on('message', (channel, message) => {
      const channelHandlers = this.handlers.get(channel)
      channelHandlers?.forEach((handler) => handler(channel, message))
    })
  }

  static getInstance(): PubSubService {
    if (!PubSubService.instance) {
      PubSubService.instance = new PubSubService()
    }
    return PubSubService.instance
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.publisher.publish(channel, message)
  }

  async subscribe(channel: string, handler: MessageHandler): Promise<void> {
    const existing = this.handlers.get(channel) || []
    existing.push(handler)
    this.handlers.set(channel, existing)
    await this.subscriber.subscribe(channel)
  }

  async unsubscribe(channel: string, handler: MessageHandler): Promise<void> {
    const existing = this.handlers.get(channel) || []
    const filtered = existing.filter((h) => h !== handler)
    if (filtered.length === 0) {
      this.handlers.delete(channel)
      await this.subscriber.unsubscribe(channel)
    } else {
      this.handlers.set(channel, filtered)
    }
  }

  async quit(): Promise<void> {
    await this.publisher.quit()
    await this.subscriber.quit()
  }
}
