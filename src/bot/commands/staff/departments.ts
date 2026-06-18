import type { Telegraf } from 'telegraf'
import { DepartmentsService } from '../../../modules/departments/departments.service.js'

const departmentsService = new DepartmentsService()

export function registerDepartmentCommands(bot: Telegraf): void {
  bot.command('departments', async (ctx) => {
    const result = await departmentsService.findMany({ page: 1, limit: 20 })

    if (result.items.length === 0) {
      await ctx.reply('No departments found.')
      return
    }

    let text = '*Departments*\n\n'
    for (const dept of result.items) {
      text += `• ${dept.name} (${dept.type}) - ${dept.isActive ? 'Active' : 'Inactive'}\n`
      if (dept.members?.length) {
        text += `  Members: ${dept.members.length}\n`
      }
    }

    await ctx.replyWithMarkdown(text)
  })
}
