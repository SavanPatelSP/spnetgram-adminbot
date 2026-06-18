import { PrismaService } from './infrastructure/database/prisma.service.js'
import { RedisService } from './infrastructure/redis/redis.service.js'
import { logger } from './infrastructure/logger/logger.js'
import { startServer } from './api/server.js'
import { startBot } from './bot/bot.js'
import { SchedulerService, type ScheduledTask } from './infrastructure/scheduler/scheduler.service.js'
import { Container } from './infrastructure/di/container.js'

import { SlaService } from './modules/sla/sla.service.js'
import { PremiumService } from './modules/premium/premium.service.js'
import { SyncProcessor, registerSyncConsumers } from './modules/sync/index.js'

export class App {
  private prisma = PrismaService.getInstance()
  private redis = RedisService.getInstance()
  private scheduler = new SchedulerService()
  private container = Container.getInstance()
  private syncProcessor = new SyncProcessor()

  async start(): Promise<void> {
    logger.info('Starting SPNETGRAM AdminBot...')

    await this.prisma.connect()
    logger.info('Database connected')

    this.container.register('SlaService', () => new SlaService())
    this.container.register('PremiumService', () => new PremiumService())

    const slaCheckTask: ScheduledTask = {
      name: 'sla-breach-check',
      intervalMs: 5 * 60 * 1000,
      execute: async () => {
        const service = this.container.resolve<SlaService>('SlaService')
        const breaches = await service.checkForBreaches()
        if (breaches.length > 0) {
          logger.warn({ count: breaches.length }, 'SLA breaches detected by scheduled check')
        }
      },
    }

    const premiumExpiryTask: ScheduledTask = {
      name: 'premium-expiry',
      intervalMs: 30 * 60 * 1000,
      execute: async () => {
        const service = this.container.resolve<PremiumService>('PremiumService')
        const result = await service.expireSubscriptions()
        if (result.count > 0) {
          logger.info({ count: result.count }, 'Subscriptions expired by scheduled check')
        }
      },
    }

    this.scheduler.registerTask(slaCheckTask)
    this.scheduler.registerTask(premiumExpiryTask)

    registerSyncConsumers(this.syncProcessor)
    this.syncProcessor.start()

    await startServer()
    await startBot()
    this.scheduler.start()

    logger.info('SPNETGRAM AdminBot started successfully')
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down...')
    this.scheduler.stop()
    await this.prisma.disconnect()
    await this.redis.quit()
    logger.info('Shutdown complete')
  }
}
