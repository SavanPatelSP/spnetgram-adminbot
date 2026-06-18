import { Telegraf } from 'telegraf'
import { env } from '../infrastructure/config/env.js'
import { logger } from '../infrastructure/logger/logger.js'
import { registerStartCommand } from './commands/start.js'
import { registerHelpCommand } from './commands/help.js'
import { registerStaffCommands } from './commands/staff/index.js'

export function createBot(): Telegraf {
  const bot = new Telegraf(env.BOT_TOKEN, {
    handlerTimeout: 30_000,
  })

  bot.use(async (ctx, next) => {
    const start = Date.now()
    await next()
    const ms = Date.now() - start
    logger.debug({ updateId: ctx.update.update_id, ms }, 'processed update')
  })

  registerStartCommand(bot)
  registerHelpCommand(bot)
  registerStaffCommands(bot)

  bot.catch((err, ctx) => {
    logger.error({ err, updateId: ctx.update.update_id }, 'bot error')
  })

  return bot
}

export async function startBot(): Promise<Telegraf> {
  const bot = createBot()

  if (!env.BOT_TOKEN) {
    throw new Error('BOT_TOKEN is not set — bot cannot start')
  }

  await bot.launch()
  logger.info('Bot started')

  return bot
}
