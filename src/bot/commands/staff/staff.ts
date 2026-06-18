import type { Telegraf } from 'telegraf'
import { StaffService } from '../../../modules/staff/staff.service.js'

const staffService = new StaffService()

export function registerStaffCommand(bot: Telegraf): void {
  bot.command('staff', async (ctx) => {
    const from = ctx.from
    if (!from) return

    const user = await ctx.telegram.getChat(from.id)
    if (!user) return

    const staffList = await staffService.list()
    if (staffList.length === 0) {
      await ctx.reply('No staff members found.')
      return
    }

    let text = '*Staff Members*\n\n'
    for (const member of staffList) {
      const roles = member.roleAssignments.map(r => r.role.name).join(', ')
      const name = member.user.firstName || member.user.telegramUsername || 'Unknown'
      text += `• ${name} - ${roles} (${member.isActive ? 'Active' : 'Inactive'})\n`
    }

    await ctx.replyWithMarkdown(text)
  })
}
