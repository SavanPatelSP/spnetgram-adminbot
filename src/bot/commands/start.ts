import type { Telegraf } from 'telegraf'
import { UsersService } from '../../modules/users/users.service.js'

const usersService = new UsersService()

export function registerStartCommand(bot: Telegraf): void {
  bot.command('start', async (ctx) => {
    const from = ctx.from
    if (!from) return

    await usersService.upsertByTelegram({
      telegramId: BigInt(from.id),
      telegramUsername: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
      languageCode: from.language_code,
    })

    await ctx.reply(
      `Welcome to SPNETGRAM Admin Bot!\n\n` +
      `Use /help to see available commands.`,
    )
  })
}
