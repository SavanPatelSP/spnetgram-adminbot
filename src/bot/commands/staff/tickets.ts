import type { Telegraf } from 'telegraf'
import { TicketsService } from '../../../modules/tickets/tickets.service.js'
import { bold, italic, divider, code } from '../../utils/message-builder.js'
import { splitTelegramMessage } from '../../utils/splitter.js'

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
      await ctx.replyWithHTML(`<b>ℹ️ No Tickets</b>\n\nNo tickets found.`)
      return
    }

    let text = `${bold('🎫 TICKETS')}\n${divider()}\n`
    for (const t of result.items) {
      text += `\n${bold(code(t.referenceId))}\n${italic(t.subject)} — ${t.status} (${t.priority})\n`
    }
    text += `\n${divider()}\n${italic(`Page ${result.page} of ${result.totalPages} • ${result.total} total`)}`

    const parts = splitTelegramMessage(text)
    for (const part of parts) {
      await ctx.replyWithHTML(part)
    }
  })
}
