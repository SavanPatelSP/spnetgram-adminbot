import { Markup } from 'telegraf'
import type { Telegraf } from 'telegraf'
import { UsersService } from '../../modules/users/users.service.js'
import { bold, italic, divider } from '../utils/message-builder.js'

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

    const text = `${bold('🏢 SPNETGRAM ADMINBOT')}${divider()}\n` +
      `${bold('Welcome')}, ${from.first_name ? `<b>${from.first_name}</b>` : 'staff member'}!\n\n` +
      `Enterprise Administration Platform\n\n` +
      `${italic('Use /help to see available commands or /guide for the full guide.')}`

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📚 Help', 'help_main')],
      [Markup.button.callback('📖 Guide', 'guide_main')],
    ])

    await ctx.replyWithHTML(text, { reply_markup: keyboard.reply_markup })
  })
}
