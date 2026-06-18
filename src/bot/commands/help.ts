import type { Telegraf } from 'telegraf'

export function registerHelpCommand(bot: Telegraf): void {
  bot.command('help', async (ctx) => {
    const helpText =
      `*SPNETGRAM Admin Bot Commands*\n\n` +
      `*General*\n` +
      `/start - Start the bot\n` +
      `/help - Show this help\n\n` +
      `*Staff*\n` +
      `/staff - List staff members\n` +
      `/departments - List departments\n` +
      `/cases [status] - List cases\n` +
      `/tickets [status] - List tickets\n` +
      `/investigations [status] - List investigations\n` +
      `/warn <user> <reason> - Warn a user\n` +
      `/mute <user> <min> <reason> - Mute a user\n` +
      `/ban <user> <reason> - Ban a user\n`

    await ctx.replyWithMarkdown(helpText)
  })
}
