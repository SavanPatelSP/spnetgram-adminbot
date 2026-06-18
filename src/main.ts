import { App } from './app.js'
import { logger } from './infrastructure/logger/logger.js'

const app = new App()

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM')
  await app.shutdown()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('Received SIGINT')
  await app.shutdown()
  process.exit(0)
})

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection')
})

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception')
  process.exit(1)
})

try {
  await app.start()
} catch (err) {
  logger.error({ err }, 'Failed to start application')
  process.exit(1)
}
