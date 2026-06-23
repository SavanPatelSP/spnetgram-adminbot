import type { Telegraf } from 'telegraf'
import { DepartmentsService } from '../../../modules/departments/departments.service.js'
import { bold, italic, divider } from '../../utils/message-builder.js'
import { splitTelegramMessage } from '../../utils/splitter.js'

const departmentsService = new DepartmentsService()

export function registerDepartmentCommands(bot: Telegraf): void {
  bot.command('departments', async (ctx) => {
    const result = await departmentsService.findMany({ page: 1, limit: 20 })

    if (result.items.length === 0) {
      await ctx.replyWithHTML(`<b>ℹ️ No Departments</b>\n\nNo departments found.`)
      return
    }

    let text = `${bold('🏢 DEPARTMENTS')}\n${divider()}\n`
    for (const dept of result.items) {
      const status = dept.isActive ? '🟢 Active' : '🔴 Inactive'
      text += `\n${bold(dept.name)} (${dept.type}) — ${status}\n`
      if (dept.members?.length) {
        text += `  Members: ${dept.members.length}\n`
      }
    }
    text += `\n${divider()}\n${italic(`Total: ${result.total} departments`)}`

    const parts = splitTelegramMessage(text)
    for (const part of parts) {
      await ctx.replyWithHTML(part)
    }
  })
}
