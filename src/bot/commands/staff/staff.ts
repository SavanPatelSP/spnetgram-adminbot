import type { Telegraf } from 'telegraf'
import { StaffService } from '../../../modules/staff/staff.service.js'
import { bold, italic, divider, code, userCard } from '../../utils/message-builder.js'
import { splitTelegramMessage } from '../../utils/splitter.js'

const staffService = new StaffService()

export function registerStaffCommand(bot: Telegraf): void {
  bot.command('staff', async (ctx) => {
    const from = ctx.from
    if (!from) return

    const user = await ctx.telegram.getChat(from.id)
    if (!user) return

    const staffList = await staffService.list()
    if (staffList.length === 0) {
      await ctx.replyWithHTML(`<b>ℹ️ No Staff</b>\n\nNo staff members found.`)
      return
    }

    let text = `${bold('👥 STAFF MEMBERS')}\n${divider()}\n`
    for (const member of staffList) {
      const roles = member.roleAssignments.map(r => r.role.name).join(', ')
      const name = member.user.firstName || member.user.telegramUsername || 'Unknown'
      const status = member.isActive ? '🟢 Active' : '🔴 Inactive'
      text += `\n${bold(name)} — ${roles}\n${italic(status)}\n`
    }
    text += `\n${divider()}\n${italic(`Total: ${staffList.length} members`)}`

    const parts = splitTelegramMessage(text)
    for (const part of parts) {
      await ctx.replyWithHTML(part)
    }
  })
}
