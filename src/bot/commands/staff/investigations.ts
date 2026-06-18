import type { Telegraf } from 'telegraf'
import { InvestigationsService } from '../../../modules/investigations/investigations.service.js'

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
      await ctx.reply('No investigations found.')
      return
    }

    let text = '*Investigations*\n\n'
    for (const inv of result.items) {
      text += `• [${inv.referenceId}] ${inv.title} - ${inv.status}\n`
    }
    text += `\nPage ${result.page} of ${result.totalPages} (${result.total} total)`

    await ctx.replyWithMarkdown(text)
  })
}
