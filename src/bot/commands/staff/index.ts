import type { Telegraf } from 'telegraf'
import { staffGuard } from '../../middleware/auth-guard.js'
import { registerStaffCommand } from './staff.js'
import { registerCaseCommands } from './cases.js'
import { registerTicketCommands } from './tickets.js'
import { registerInvestigationCommands } from './investigations.js'
import { registerModerationCommands } from './moderation.js'
import { registerDepartmentCommands } from './departments.js'
import { registerNewModuleCommands } from './new-modules.js'
import { registerGuideCommands } from './guide.js'
import { registerPremiumCommands } from './premium.js'

export function registerStaffCommands(bot: Telegraf): void {
  bot.use(staffGuard())

  registerStaffCommand(bot)
  registerCaseCommands(bot)
  registerTicketCommands(bot)
  registerInvestigationCommands(bot)
  registerModerationCommands(bot)
  registerDepartmentCommands(bot)
  registerNewModuleCommands(bot)
  registerPremiumCommands(bot)
  registerGuideCommands(bot)
}
