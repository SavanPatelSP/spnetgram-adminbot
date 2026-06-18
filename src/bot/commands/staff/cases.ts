import type { Telegraf } from 'telegraf'
import { CasesService } from '../../../modules/cases/cases.service.js'

const casesService = new CasesService()

export function registerCaseCommands(bot: Telegraf): void {
  bot.command('cases', async (ctx) => {
    const args = ctx.message?.text?.split(' ')
    const status = args?.[1]?.toUpperCase()

    const result = await casesService.findMany({
      status: status as any,
      page: 1,
      limit: 10,
    })

    if (result.items.length === 0) {
      await ctx.reply('No cases found.')
      return
    }

    let text = '*Cases*\n\n'
    for (const c of result.items) {
      text += `• [${c.referenceId}] ${c.title} - ${c.status}\n`
    }
    text += `\nPage ${result.page} of ${result.totalPages} (${result.total} total)`

    await ctx.replyWithMarkdown(text)
  })
}
