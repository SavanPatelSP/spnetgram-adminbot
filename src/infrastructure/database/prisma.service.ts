import { PrismaClient } from '@prisma/client'
import { logger } from '../logger/logger.js'
import { safeStringify } from '../../shared/utils/safe-json.js'

export class PrismaService {
  private static instance: PrismaService
  public client: PrismaClient

  private constructor() {
    const base = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    })

    this.client = base.$extends({
      name: 'slow-query-monitor',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const start = performance.now()
            const result = await query(args)
            const duration = performance.now() - start

            if (duration > 100) {
              logger.warn({
                query: model,
                action: operation,
                duration: `${duration.toFixed(2)}ms`,
                args: safeStringify(args).slice(0, 200),
              }, 'Slow database query')
            }

            return result
          },
        },
      },
    }) as unknown as PrismaClient
  }

  static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService()
    }
    return PrismaService.instance
  }

  async connect(): Promise<void> {
    await this.client.$connect()
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect()
  }
}
