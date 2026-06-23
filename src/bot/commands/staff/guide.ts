import { Markup } from 'telegraf'
import type { Telegraf } from 'telegraf'
import { bold, italic, divider, code, section } from '../../utils/message-builder.js'

type PageKey = 'main' | 'staff' | 'tickets' | 'cases' | 'moderation' | 'premium' | 'economy' | 'security' | 'analytics' | 'system' | 'commands' | 'examples'

const PAGE_ORDER: PageKey[] = ['main', 'staff', 'tickets', 'cases', 'moderation', 'premium', 'economy', 'security', 'analytics', 'system', 'commands', 'examples']

const GUIDE_PAGES: Record<PageKey, { title: string; emoji: string; content: string }> = {
  main: {
    title: 'SPNETGRAM ADMINBOT',
    emoji: '🏢',
    content: `Enterprise Administration Platform

${bold('👥 Staff Management')}
Manage staff, roles, departments & permissions

${bold('🎫 Tickets')}
Handle user support tickets & escalations

${bold('📁 Cases')}
Track & manage investigation cases

${bold('🔍 Investigations')}
Deep-dive forensics & evidence collection

${bold('🛡 Moderation')}
Warn, mute, ban & content moderation

${bold('💎 Premium')}
Subscription plans & premium management

${bold('💰 Economy')}
Virtual economy & transaction management

${bold('🚨 Security')}
Security ops, risk analysis & fraud detection

${bold('📊 Analytics')}
Executive dashboards & company reports

${bold('⚙ System')}
Health checks, sync status & incidents

${italic('Use /guide [section] for details')}

${bold('See also:')}
/commands  /examples  /help  /dashboard`,
  },
  staff: {
    title: 'Staff Management',
    emoji: '👥',
    content: `Manage your workforce efficiently.

${bold('Key Commands:')}
• /staff — List all staff members
• /departments — Browse departments
• /grantrole <staffId> <role> — Assign role
• /revokerole <staffId> <role> — Remove role
• /grantpermission <staffId> <res> <act> — Grant permission
• /revokepermission <staffId> <res> <act> — Revoke permission
• /temporaryaccess <staffId> <res> <act> <hours> — Temp grant
• /accessaudit <staffId> — View permissions

${bold('Role Hierarchy:')}
• OWNER (1000) — Full platform ownership
• SUPER_ADMINISTRATOR (900) — System-wide access
• ADMIN (700) — Administrative oversight
• DEPARTMENT_HEAD (600) — Dept authority
• MANAGER (500) — Team supervision
• SENIOR_STAFF (400) — Advanced privileges
• STAFF (300) — Standard access
• HELPER (100) — Limited entry-level

${italic('Roles determine default permission levels.')}`,
  },
  tickets: {
    title: 'Ticket Management',
    emoji: '🎫',
    content: `User support and issue resolution.

${bold('Key Commands:')}
• /tickets [status] — List tickets (filter: OPEN, CLOSED)
• /ticketsummary — Ticket statistics & metrics

${bold('Status Flow:')}
OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED

${bold('Features:')}
• Priority-based routing
• SLA tracking & escalation
• Assignment management
• Resolution time analytics

${italic('Tickets sync bidirectionally with SPNET-ADMIN.')}`,
  },
  cases: {
    title: 'Case Management',
    emoji: '📁',
    content: `Structured case tracking and resolution.

${bold('Key Commands:')}
• /cases [status] — List cases (filter: ACTIVE, COMPLETED)

${bold('Status Flow:')}
ACTIVE → UNDER_REVIEW → COMPLETED → ARCHIVED

${bold('Features:')}
• Evidence attachment
• Status transitions
• Full audit trails
• Assignment tracking

${italic('Cases are synced with SPNET-ADMIN in real-time.')}`,
  },
  moderation: {
    title: 'Moderation',
    emoji: '🛡',
    content: `Content moderation and user discipline.

${bold('Key Commands:')}
• /warn <user> <reason> — Issue a warning
• /mute <user> <min> <reason> — Restrict posting
• /ban <user> <reason> — Permanent removal
• /unban <user> <reason> — Lift a ban
• /unmute <user> <reason> — Lift a mute

${bold('Action Types:')}
WARN → MUTE → BAN (escalating severity)

${bold('Features:')}
• Action history & audit trail
• Automatic severity escalation
• Moderator attribution
• Reason tracking

${italic('All moderation actions are logged for compliance.')}`,
  },
  premium: {
    title: 'Premium Management',
    emoji: '💎',
    content: `Subscription plans and premium features.

${bold('Key Commands:')}
• /premium — Overview of plans
• /plans — List all plans & pricing
• /requestpremium <userId> <planId> — Grant premium
• /mypremium — Your subscriptions

${bold('Available Tiers:')}
• BASIC — Core features
• PRO — Advanced tools
• ENTERPRISE — Full platform

${bold('Features:')}
• Economy bonuses & multipliers
• Priority support queue
• Extended storage & limits
• Exclusive command access

${italic('Subscriptions auto-expire with notifications.')}`,
  },
  economy: {
    title: 'Economy',
    emoji: '💰',
    content: `Virtual economy and transaction system.

${bold('Available Operations:')}
• View balances & transaction history
• Credit/debit user accounts
• Audit economic activity
• Configure economy parameters

${bold('Features:')}
• Multi-currency support
• Transaction logging
• Anti-fraud monitoring
• Premium bonus multipliers

${italic('Economy management available via SPNET-ADMIN interface.')}`,
  },
  security: {
    title: 'Security Operations',
    emoji: '🚨',
    content: `Security monitoring, risk analysis, and incident response.

${bold('Key Commands:')}
• /security — Security summary dashboard
• /securitylogs — Recent security events (24h)
• /risk — Risk analysis & scoring
• /fraud — Fraud pattern detection
• /sessionaudit — Login history
• /lockdown <reason> — Emergency lockdown
• /liftlockdown — Deactivate lockdown

${bold('Features:')}
• Real-time threat detection
• Login anomaly monitoring
• IP reputation scoring
• Device fingerprinting
• Multi-factor tracking

${italic('Security events sync with SPNET-ADMIN SOC.')}`,
  },
  analytics: {
    title: 'Analytics & Reporting',
    emoji: '📊',
    content: `Executive dashboards and company performance metrics.

${bold('Key Commands:')}
• /executivedashboard — Full executive overview
• /companyreport — Company performance report
• /stats — System statistics & metrics
• /ticketsummary — Ticket analytics
• /recommendation — AI-powered suggestions

${bold('Metrics Tracked:')}
• Staff productivity & KPIs
• Ticket resolution times
• Moderation activity
• Security incidents
• System health & uptime
• Case throughput

${italic('All metrics are real-time and KPI-driven.')}`,
  },
  system: {
    title: 'System Operations',
    emoji: '⚙',
    content: `System health, monitoring, and administration.

${bold('Key Commands:')}
• /health — Immediate system health check
• /system — Full system status
• /stats — Performance statistics
• /syncstatus — Sync pipeline health
• /incident — View active incidents
• /services — Service monitoring
• /latency — Response time metrics
• /incidentstatus <id> — Incident details
• /resolveincident <id> — Resolve incident
• /incidenttimeline <id> — Incident history

${bold('Emergency Protocol:')}
1️⃣ /health → Assess system
2️⃣ /system → Full diagnostics
3️⃣ /incident → Check active incidents
4️⃣ /syncstatus → Verify sync pipeline

${italic('Always start with /health in an emergency.')}`,
  },
  commands: {
    title: 'All Commands',
    emoji: '📋',
    content: `${bold('General')}
/help /start /dashboard /guide

${bold('Staff Management')}
/staff /departments
/grantrole <staffId> <role>
/revokerole <staffId> <role>
/grantpermission <staffId> <res> <act>
/revokepermission <staffId> <res> <act>
/temporaryaccess <staffId> <res> <act> <hours>
/accessaudit <staffId>

${bold('Moderation')}
/warn <user> <reason>
/mute <user> <min> <reason>
/ban <user> <reason>
/unban <user> <reason>
/unmute <user> <reason>

${bold('Tickets & Cases')}
/tickets [status]
/ticketsummary
/cases [status]

${bold('Investigations')}
/investigations [status]

${bold('Security')}
/security /securitylogs /risk /fraud
/sessionaudit /lockdown /liftlockdown

${bold('Premium')}
/premium /plans /requestpremium /mypremium

${bold('Analytics')}
/executivedashboard /companyreport
/stats /recommendation

${bold('System')}
/health /system /services /latency
/syncstatus /deeplinks

${bold('Incidents')}
/incident /incidentstatus /resolveincident
/incidenttimeline

${bold('Audit')}
/audit /audituser /auditstaff

${bold('Dashboards')}
/staffdashboard /activedashboard`,
  },
  examples: {
    title: 'Usage Examples',
    emoji: '📝',
    content: `${bold('🛡 Moderation')}
/warn @user Spamming in chat
/mute @user 30 Repeated violations
/ban @user Permanent ban evasion
/unban @user Appeal approved
/unmute @user Behavior improved

${bold('💎 Premium')}
/premium — Overview
/plans — All plans
/requestpremium user-abc plan-pro
/mypremium — Your subs

${bold('👥 Staff')}
/grantrole staff123 MANAGER
/revokerole staff123 MANAGER
/grantpermission staff123 USERS READ
/temporaryaccess staff123 ECONOMY CREDIT 24
/accessaudit staff123

${bold('📊 Analytics')}
/executivedashboard — Full overview
/companyreport — Company report
/stats — System statistics
/ticketsummary — Ticket stats

${bold('🚨 Emergency')}
/lockdown Security breach detected
/liftlockdown — Deactivate
/health — System health check
/system — Full status
/syncstatus — Sync pipeline
/incidentstatus abc123
/resolveincident abc123

${bold('🔍 Troubleshooting')}
/accessaudit staff123 — Check permissions
/audituser user123 — User audit trail
/auditstaff staff123 — Staff audit`,
  },
}

function buildPage(key: PageKey, pageNum: number, totalPages: number): { text: string; keyboard: ReturnType<typeof Markup.inlineKeyboard> } {
  const page = GUIDE_PAGES[key]
  const text = `${page.emoji} ${bold(page.title)}${divider()}\n${page.content}\n${divider()}\n${italic(`Page ${pageNum}/${totalPages}`)}`

  const buttons: any[] = []

  if (pageNum > 1) {
    buttons.push(Markup.button.callback('◀ Previous', `guide_prev_${pageNum}`))
  }
  if (pageNum < totalPages) {
    buttons.push(Markup.button.callback('Next ▶', `guide_next_${pageNum}`))
  }

  const row2: any[] = [Markup.button.callback('🏠 Main Menu', 'guide_main')]

  const rows = buttons.length > 0 ? [buttons, row2] : [row2]

  return { text, keyboard: Markup.inlineKeyboard(rows) }
}

function getPageNumber(key: PageKey): number {
  return PAGE_ORDER.indexOf(key) + 1
}

function getTotalPages(): number {
  return PAGE_ORDER.length
}

function buildGuidePage(key: PageKey): { text: string; keyboard: ReturnType<typeof Markup.inlineKeyboard> } {
  const pageNum = getPageNumber(key)
  const totalPages = getTotalPages()
  return buildPage(key, pageNum, totalPages)
}

export function registerGuideCommands(bot: Telegraf): void {
  bot.command('guide', async (ctx) => {
    try {
      const args = ctx.message?.text?.split(' ')
      const subcommand = args?.[1]?.toLowerCase()

      let pageKey: PageKey = 'main'
      if (subcommand) {
        const validKeys: Record<string, PageKey> = {
          staff: 'staff',
          tickets: 'tickets',
          ticket: 'tickets',
          cases: 'cases',
          case: 'cases',
          moderation: 'moderation',
          mod: 'moderation',
          premium: 'premium',
          economy: 'economy',
          security: 'security',
          analytics: 'analytics',
          system: 'system',
          commands: 'commands',
          command: 'commands',
          examples: 'examples',
          example: 'examples',
        }
        pageKey = validKeys[subcommand] || 'main'
      }

      const { text, keyboard } = buildGuidePage(pageKey)
      await ctx.replyWithHTML(text, { reply_markup: keyboard.reply_markup })
    } catch (err) {
      await ctx.replyWithHTML(`<b>❌ Guide Error</b>\n\n${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('commands', async (ctx) => {
    try {
      const { text, keyboard } = buildGuidePage('commands')
      await ctx.replyWithHTML(text, { reply_markup: keyboard.reply_markup })
    } catch (err) {
      await ctx.replyWithHTML(`<b>❌ Commands Error</b>\n\n${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('examples', async (ctx) => {
    try {
      const { text, keyboard } = buildGuidePage('examples')
      await ctx.replyWithHTML(text, { reply_markup: keyboard.reply_markup })
    } catch (err) {
      await ctx.replyWithHTML(`<b>❌ Examples Error</b>\n\n${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.action(/guide_(prev|next)_(\d+)/, async (ctx) => {
    try {
      const action = ctx.match[1]
      const currentPage = parseInt(ctx.match[2], 10)
      const targetPage = action === 'prev' ? currentPage - 1 : currentPage + 1
      const pageKey = PAGE_ORDER[targetPage - 1]

      if (pageKey) {
        const { text, keyboard } = buildGuidePage(pageKey)
        await ctx.editMessageText(text, {
          parse_mode: 'HTML',
          reply_markup: keyboard.reply_markup,
        })
      }
    } catch {
      await ctx.answerCbQuery()
    }
  })

  bot.action('guide_main', async (ctx) => {
    try {
      const { text, keyboard } = buildGuidePage('main')
      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: keyboard.reply_markup,
      })
    } catch {
      await ctx.answerCbQuery()
    }
  })
}
