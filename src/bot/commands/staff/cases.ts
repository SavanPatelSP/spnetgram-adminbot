import type { Telegraf } from 'telegraf'
import { CasesService } from '../../../modules/cases/cases.service.js'
import { bold, italic, divider, code } from '../../utils/message-builder.js'
import { splitTelegramMessage } from '../../utils/splitter.js'

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
      await ctx.replyWithHTML(`<b>ℹ️ No Cases</b>\n\nNo cases found.`)
      return
    }

    let text = `${bold('📁 CASES')}\n${divider()}\n`
    for (const c of result.items) {
      text += `\n${bold(code(c.referenceId))}\n${italic(c.title)} — ${c.status}\n`
    }
    text += `\n${divider()}\n${italic(`Page ${result.page} of ${result.totalPages} • ${result.total} total`)}`

    const parts = splitTelegramMessage(text)
    for (const part of parts) {
      await ctx.replyWithHTML(part)
    }
  })
}
