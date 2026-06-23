import type { Telegraf } from 'telegraf'
import { InvestigationsService } from '../../../modules/investigations/investigations.service.js'
import { bold, italic, divider, code } from '../../utils/message-builder.js'
import { splitTelegramMessage } from '../../utils/splitter.js'

const investigationsService = new InvestigationsService()

export function registerInvestigationCommands(bot: Telegraf): void {
  bot.command('investigations', async (ctx) => {
    const args = ctx.message?.text?.split(' ')
    const status = args?.[1]?.toUpperCase()

    const result = await investigationsService.findMany({
      status: status as any,
      page: 1,
      limit: 10,
    })

    if (result.items.length === 0) {
      await ctx.replyWithHTML(`<b>ℹ️ No Investigations</b>\n\nNo investigations found.`)
      return
    }

    let text = `${bold('🔍 INVESTIGATIONS')}\n${divider()}\n`
    for (const inv of result.items) {
      text += `\n${bold(code(inv.referenceId))}\n${italic(inv.title)} — ${inv.status}\n`
    }
    text += `\n${divider()}\n${italic(`Page ${result.page} of ${result.totalPages} • ${result.total} total`)}`

    const parts = splitTelegramMessage(text)
    for (const part of parts) {
      await ctx.replyWithHTML(part)
    }
  })
}
