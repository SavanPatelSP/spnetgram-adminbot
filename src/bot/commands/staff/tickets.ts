import type { Telegraf } from 'telegraf'
import { TicketsService } from '../../../modules/tickets/tickets.service.js'

const ticketsService = new TicketsService()

export function registerTicketCommands(bot: Telegraf): void {
  bot.command('tickets', async (ctx) => {
    const args = ctx.message?.text?.split(' ')
    const status = args?.[1]?.toUpperCase()

    const result = await ticketsService.findMany({
      status: status as any,
      page: 1,
      limit: 10,
    })

    if (result.items.length === 0) {
      await ctx.reply('No tickets found.')
      return
    }

    let text = '*Tickets*\n\n'
    for (const t of result.items) {
      text += `• [${t.referenceId}] ${t.subject} - ${t.status} (${t.priority})\n`
    }
    text += `\nPage ${result.page} of ${result.totalPages} (${result.total} total)`

    await ctx.replyWithMarkdown(text)
  })
}
