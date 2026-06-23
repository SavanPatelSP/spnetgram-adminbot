import { Markup } from 'telegraf'
import type { Telegraf } from 'telegraf'
import { bold, italic, divider, section } from '../utils/message-builder.js'

const CATEGORIES: { emoji: string; label: string; commands: string }[] = [
  { emoji: '👥', label: 'Staff', commands: '/staff /departments /grantrole /revokerole /grantpermission /revokepermission /temporaryaccess /accessaudit' },
  { emoji: '🎫', label: 'Tickets', commands: '/tickets /ticketsummary' },
  { emoji: '📁', label: 'Cases', commands: '/cases' },
  { emoji: '🛡', label: 'Moderation', commands: '/warn /mute /ban /unban /unmute' },
  { emoji: '💎', label: 'Premium', commands: '/premium /plans /requestpremium /mypremium' },
  { emoji: '💰', label: 'Economy', commands: '/economy (via API)' },
  { emoji: '🚨', label: 'Security', commands: '/security /securitylogs /risk /fraud /sessionaudit /lockdown /liftlockdown' },
  { emoji: '⚙', label: 'System', commands: '/health /system /stats /services /latency /syncstatus /deeplinks /incident /incidentstatus /resolveincident /incidenttimeline' },
  { emoji: '📊', label: 'Analytics', commands: '/executivedashboard /companyreport /ticketsummary /recommendation' },
  { emoji: '🔍', label: 'Investigations', commands: '/investigations' },
  { emoji: '📋', label: 'Audit', commands: '/audit /audituser /auditstaff' },
  { emoji: '📈', label: 'Dashboards', commands: '/staffdashboard /activedashboard /dashboard' },
]

function buildHelpText(): string {
  let text = `${bold('📚 SPNETGRAM ADMINBOT — HELP')}${divider()}`
  text += `\n${italic('Enterprise Administration Platform')}\n\n`
  for (const cat of CATEGORIES) {
    text += `${cat.emoji} ${bold(cat.label)}\n<code>${cat.commands}</code>\n\n`
  }
  text += `${divider()}${italic('Use /guide [section] for detailed guides')}`
  return text
}

function buildCategoryKeyboard(): ReturnType<typeof Markup.inlineKeyboard> {
  const rows: any[] = []
  for (let i = 0; i < CATEGORIES.length; i += 3) {
    const row = CATEGORIES.slice(i, i + 3).map(cat =>
      Markup.button.callback(`${cat.emoji} ${cat.label}`, `help_cat_${cat.label.toLowerCase()}`)
    )
    rows.push(row)
  }
  rows.push([Markup.button.callback('🏠 Main Menu', 'guide_main')])
  return Markup.inlineKeyboard(rows)
}

function buildCategoryDetail(label: string): string | null {
  const cat = CATEGORIES.find(c => c.label.toLowerCase() === label)
  if (!cat) return null
  return `${cat.emoji} ${bold(cat.label.toUpperCase())}${divider()}\n${bold('Commands:')}\n<code>${cat.commands}</code>\n\n${italic('Use /guide for detailed instructions')}`
}

export function registerHelpCommand(bot: Telegraf): void {
  bot.command('help', async (ctx) => {
    try {
      const text = buildHelpText()
      const keyboard = buildCategoryKeyboard()
      await ctx.replyWithHTML(text, { reply_markup: keyboard.reply_markup })
    } catch (err) {
      await ctx.replyWithHTML(`<b>❌ Help Error</b>\n\n${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.action(/help_cat_(\w+)/, async (ctx) => {
    try {
      const label = ctx.match[1]
      const detail = buildCategoryDetail(label)
      if (detail) {
        await ctx.editMessageText(detail, {
          parse_mode: 'HTML',
          reply_markup: buildCategoryKeyboard().reply_markup,
        })
      }
    } catch {
      await ctx.answerCbQuery()
    }
  })

  bot.action('help_main', async (ctx) => {
    try {
      const text = buildHelpText()
      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: buildCategoryKeyboard().reply_markup,
      })
    } catch {
      await ctx.answerCbQuery()
    }
  })
}
