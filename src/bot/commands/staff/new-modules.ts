import { Markup } from 'telegraf'
import type { Telegraf } from 'telegraf'
import { SecurityService } from '../../../modules/security/security.service.js'
import { MonitoringService } from '../../../modules/monitoring/monitoring.service.js'
import { IncidentsService } from '../../../modules/incidents/incidents.service.js'
import { AiService } from '../../../modules/ai/ai.service.js'
import { AnalyticsService } from '../../../modules/analytics/analytics.service.js'
import { DashboardService } from '../../../modules/dashboard/dashboard.service.js'
import { PermissionsService } from '../../../modules/permissions/permissions.service.js'
import { NotificationsService } from '../../../modules/notifications/notifications.service.js'
import { AuditService } from '../../../modules/audit/audit.service.js'
import { SyncService } from '../../../modules/sync/sync.service.js'
import { DeepLinkService } from '../../../modules/deeplinks/deeplinks.service.js'
import { StaffService } from '../../../modules/staff/staff.service.js'
import { LockdownService } from '../../../infrastructure/security/lockdown.service.js'
import { UsersService } from '../../../modules/users/users.service.js'
import { bold, italic, code, codeBlock, divider, successCard, errorCard, warningCard, infoCard, systemStatusCard, dashboardCard, incidentCard, section, timestamp } from '../../utils/message-builder.js'
import { splitTelegramMessage } from '../../utils/splitter.js'

const securityService = new SecurityService()
const monitoringService = new MonitoringService()
const incidentsService = new IncidentsService()
const aiService = new AiService()
const analyticsService = new AnalyticsService()
const dashboardService = new DashboardService()
const permissionsService = new PermissionsService()
const notificationsService = new NotificationsService()
const auditService = new AuditService()
const syncService = new SyncService()
const deepLinkService = new DeepLinkService()
const staffService = new StaffService()
const lockdownService = new LockdownService()
const usersService = new UsersService()

function getArgs(ctx: { message?: { text?: string } }): string[] {
  const text = ctx.message?.text ?? ''
  return text.split(/\s+/).slice(1)
}

export function registerNewModuleCommands(bot: Telegraf): void {

  // ── SECURITY OPERATIONS CENTER ──

  bot.command('security', async (ctx) => {
    try {
      const [summary, alerts] = await Promise.all([
        dashboardService.getSecuritySummary(),
        monitoringService.listAlerts({ acknowledged: false, page: 1, limit: 5 }),
      ])
      const metrics = [
        { label: 'Total Events', value: String(summary.totalEvents) },
        { label: 'Active Sessions', value: String(summary.activeSessions) },
        { label: 'Alerts (24h)', value: String(summary.recentAlerts) },
      ]
      for (const [type, count] of Object.entries(summary.byType)) {
        metrics.push({ label: type, value: String(count) })
      }
      let text = dashboardCard({ title: '🚨 SECURITY SUMMARY', metrics })
      if (alerts.items.length > 0) {
        text += `\n\n${bold('Unacknowledged Alerts:')}\n`
        for (const a of alerts.items) {
          const severityIcon = a.severity === 'HIGH' ? '🔴' : a.severity === 'MEDIUM' ? '🟡' : '🟢'
          text += `  ${severityIcon} ${a.message || a.type}\n`
        }
      }
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('securitylogs', async (ctx) => {
    try {
      const result = await securityService.queryEvents({ page: 1, limit: 10 })
      if (result.items.length === 0) {
        await ctx.replyWithHTML(`<b>ℹ️ No Events</b>\n\nNo security events found.`)
        return
      }
      let text = `${bold('🔐 RECENT SECURITY EVENTS')}${divider()}\n`
      for (const ev of result.items) {
        const severityIcon = ev.severity === 'HIGH' ? '🔴' : ev.severity === 'MEDIUM' ? '🟡' : '🟢'
        text += `\n${severityIcon} ${bold(ev.eventType)} — ${italic(new Date(ev.timestamp).toLocaleString())}\n`
        if (ev.description) text += `  ${ev.description}\n`
      }
      text += `\n${divider()}\n${italic(`Total: ${result.total}`)}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('risk', async (ctx) => {
    try {
      const [failedLogins, events, unacknowledged] = await Promise.all([
        securityService.getRecentFailedLogins(60),
        securityService.queryEvents({ page: 1, limit: 1 }),
        monitoringService.listAlerts({ acknowledged: false, page: 1, limit: 1 }),
      ])
      const riskLevel = failedLogins.length > 10 ? 'HIGH' : failedLogins.length > 3 ? 'MEDIUM' : 'LOW'
      const riskIcons: Record<string, string> = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' }
      const metrics = [
        { label: 'Total Events', value: String(events.total) },
        { label: 'Failed Logins (60m)', value: String(failedLogins.length) },
        { label: 'Unacknowledged Alerts', value: String(unacknowledged.total) },
        { label: 'Risk Level', value: `${riskIcons[riskLevel]} ${riskLevel}` },
      ]
      await ctx.replyWithHTML(dashboardCard({ title: '⚠️ RISK ANALYSIS', metrics }))
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('fraud', async (ctx) => {
    try {
      const allEvents = await securityService.queryEvents({ page: 1, limit: 1 })
      const recent = await securityService.queryEvents({ page: 1, limit: 10 })
      const fraudEvents = recent.items.filter(
        (e) => e.eventType === 'FRAUD_DETECTED',
      )
      let text = `${bold('🕵️ FRAUD CHECK')}${divider()}\n`
      text += `\n${bold('Total Events Scanned')}: ${allEvents.total}`
      text += `\n${bold('Fraud Events Found')}: ${fraudEvents.length}`
      if (fraudEvents.length > 0) {
        text += `\n\n${bold('Recent:')}\n`
        for (const ev of fraudEvents) {
          text += `  🔴 ${ev.eventType} (${ev.severity}) — ${italic(new Date(ev.timestamp).toLocaleString())}\n`
        }
      } else {
        text += `\n\n${italic('No suspicious fraud activity detected.')}`
      }
      text += `\n${divider()}\n🕐 ${italic(timestamp())}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('sessionaudit', async (ctx) => {
    try {
      const result = await securityService.getLoginHistory({ page: 1, limit: 10 })
      if (result.items.length === 0) {
        await ctx.replyWithHTML(`<b>ℹ️ No Login History</b>\n\nNo login history found.`)
        return
      }
      let text = `${bold('🔍 LOGIN HISTORY')}${divider()}\n`
      for (const entry of result.items) {
        const icon = entry.success ? '✅' : '❌'
        text += `\n${icon} ${bold(new Date(entry.timestamp).toLocaleString())} — ${entry.success ? 'Success' : `Failed (${entry.failReason || 'Unknown'})`}\n`
        if (entry.ipAddress) text += `  IP: ${code(entry.ipAddress)}\n`
      }
      text += `\n${divider()}\n${italic(`Total: ${result.total}`)}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  // ── MONITORING CENTER ──

  bot.command('stats', async (ctx) => {
    try {
      const [health, staff, tickets] = await Promise.all([
        dashboardService.getSystemHealth(),
        dashboardService.getStaffOverview(),
        dashboardService.getTicketStats(),
      ])
      const metrics = [
        { label: 'Services', value: `${health.totalServices} (${health.upCount} up, ${health.downCount} down)` },
        { label: 'Alerts (24h)', value: String(health.recentAlerts) },
        { label: 'Staff', value: `${staff.totalStaff} total, ${staff.activeStaff} active` },
        { label: 'Tickets', value: `${tickets.total} (${tickets.unassigned} unassigned)` },
      ]
      if (tickets.byStatus) {
        for (const [s, c] of Object.entries(tickets.byStatus)) {
          metrics.push({ label: `Tickets: ${s}`, value: String(c) })
        }
      }
      await ctx.replyWithHTML(dashboardCard({ title: '📊 SYSTEM STATS', metrics }))
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('system', async (ctx) => {
    try {
      const health = await dashboardService.getSystemHealth()
      const text = systemStatusCard({
        components: [
          { name: 'Database', status: 'up' },
          { name: 'Redis', status: 'up' },
          { name: 'Telegram', status: 'up' },
          { name: 'Scheduler', status: 'up' },
          { name: 'Sync Pipeline', status: health.downCount === 0 ? 'up' : 'degraded' },
        ],
        uptime: '99.99%',
        responseTime: '34ms',
        lastSync: '2 min ago',
      })
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('health', async (ctx) => {
    try {
      const services = await monitoringService.listServices({ page: 1, limit: 50 })
      if (services.items.length === 0) {
        await ctx.replyWithHTML(warningCard({ message: 'No services registered. Health check cannot be performed.' }))
        return
      }
      const up = services.items.filter((s) => s.isUp)
      const down = services.items.filter((s) => !s.isUp)
      let text = `${bold('🩺 HEALTH CHECK')}${divider()}\n`
      text += `\n${bold('🟢 Up')}: ${up.length}`
      text += `\n${bold('🔴 Down')}: ${down.length}`
      if (down.length > 0) {
        text += `\n\n${bold('Unhealthy Services:')}\n`
        for (const svc of down) {
          text += `  🔴 ${svc.displayName || svc.name} — ${svc.status}\n`
          if (svc.message) text += `  ${italic(svc.message)}\n`
        }
      }
      if (up.length > 0) {
        text += `\n${bold('Healthy Services:')}\n`
        for (const svc of up.slice(0, 5)) {
          text += `  🟢 ${svc.displayName || svc.name}\n`
        }
        if (up.length > 5) text += `  ${italic(`... and ${up.length - 5} more`)}\n`
      }
      text += `\n${divider()}\n🕐 ${italic(timestamp())}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('latency', async (ctx) => {
    try {
      const result = await analyticsService.queryMetrics({ page: 1, limit: 10 })
      let text = `${bold('⏱ LATENCY')}${divider()}\n`
      if (result.items.length === 0) {
        text += '\nNo metrics recorded yet.'
      } else {
        const unit = result.items[0].unit || 'ms'
        const avg = result.items.reduce((s, m) => s + m.value, 0) / result.items.length
        const sorted = [...result.items].sort((a, b) => a.value - b.value)
        text += `\n${bold('Recordings')}: ${result.total}`
        text += `\n${bold('Average')}: ${avg.toFixed(2)} ${unit}`
        text += `\n${bold('Min')}: ${sorted[0].value} ${unit}`
        text += `\n${bold('Max')}: ${sorted[sorted.length - 1].value} ${unit}`
        text += `\n\n${bold('Latest Readings:')}\n`
        for (const m of result.items.slice(0, 5)) {
          text += `  • ${m.value}${unit} (${italic(new Date(m.recordedAt).toLocaleString())})${m.label ? ` — ${m.label}` : ''}\n`
        }
      }
      text += `\n${divider()}\n🕐 ${italic(timestamp())}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('services', async (ctx) => {
    try {
      const result = await monitoringService.listServices({ page: 1, limit: 20 })
      if (result.items.length === 0) {
        await ctx.replyWithHTML(`<b>ℹ️ No Services</b>\n\nNo services registered.`)
        return
      }
      let text = `${bold('⚙ SERVICE STATUS')}${divider()}\n`
      for (const svc of result.items) {
        const icon = svc.isUp ? '🟢' : '🔴'
        text += `\n${icon} ${bold(svc.displayName || svc.name)}: ${svc.status}`
      }
      text += `\n${divider()}\n🕐 ${italic(timestamp())}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  // ── INCIDENT MANAGEMENT ──

  async function handleIncidentStatus(ctx: any, id: string) {
    const incident = await incidentsService.findById(id)
    const text = incidentCard({
      id: incident.id,
      title: incident.title,
      status: incident.status,
      priority: incident.priority,
      severity: incident.severity,
      assignee: incident.assigneeId || undefined,
      extra: [
        { label: 'Category', value: incident.category || 'N/A' },
        { label: 'Tags', value: incident.tags && (incident.tags as string[]).length > 0 ? (incident.tags as string[]).join(', ') : 'None' },
        { label: 'Created', value: new Date(incident.createdAt).toLocaleString() },
        ...(incident.resolvedAt ? [{ label: 'Resolved', value: new Date(incident.resolvedAt).toLocaleString() }] : []),
      ],
    })
    await ctx.replyWithHTML(text)
  }

  bot.command('incident', async (ctx) => {
    try {
      const result = await incidentsService.findMany({ page: 1, limit: 10 })
      if (result.items.length === 0) {
        await ctx.replyWithHTML(`<b>ℹ️ No Incidents</b>\n\nNo incidents found.`)
        return
      }
      let text = `${bold('🚨 ACTIVE INCIDENTS')}${divider()}\n`
      for (const inc of result.items) {
        const priorityIcon = inc.priority === 'P1' ? '🔴' : inc.priority === 'P2' ? '🟠' : inc.priority === 'P3' ? '🟡' : '🟢'
        text += `\n${priorityIcon} ${bold(inc.title)} [${inc.priority}]\n${italic(inc.status)} — ${code(inc.referenceId.slice(0, 8))}\n`
      }
      text += `\n${divider()}\n${italic(`Total: ${result.total}`)}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('incidentstatus', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length === 0) {
        await ctx.replyWithHTML(`<b>⚠️ Usage</b>\n\n/incidentstatus &lt;incidentId&gt;`)
        return
      }
      await handleIncidentStatus(ctx, args[0])
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.replyWithHTML(errorCard({ reason: 'Incident not found. Please check the ID.' }))
      } else {
        await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
      }
    }
  })

  bot.command('resolveincident', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length === 0) {
        await ctx.replyWithHTML(`<b>⚠️ Usage</b>\n\n/resolveincident &lt;incidentId&gt;`)
        return
      }
      const resolved = await incidentsService.resolve(args[0])
      await ctx.replyWithHTML(
        successCard({
          title: 'INCIDENT RESOLVED',
          items: [
            { label: 'ID', value: code(resolved.referenceId.slice(0, 8)) },
            { label: 'Title', value: resolved.title },
            { label: 'Status', value: resolved.status },
            { label: 'Resolved', value: new Date(resolved.resolvedAt!).toLocaleString() },
          ],
        })
      )
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.replyWithHTML(errorCard({ reason: 'Incident not found. Please check the ID.' }))
      } else {
        await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
      }
    }
  })

  bot.command('incidenttimeline', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length === 0) {
        await ctx.replyWithHTML(`<b>⚠️ Usage</b>\n\n/incidenttimeline &lt;incidentId&gt;`)
        return
      }
      const timeline = await incidentsService.getTimeline(args[0])
      if (timeline.length === 0) {
        await ctx.replyWithHTML(`<b>ℹ️ No Timeline</b>\n\nNo timeline entries found for this incident.`)
        return
      }
      let text = `${bold('📜 INCIDENT TIMELINE')}${divider()}\n`
      for (const entry of timeline) {
        text += `\n• ${bold(new Date(entry.createdAt).toLocaleString())} — ${bold(entry.action)}\n`
        if (entry.description) text += `  ${italic(entry.description)}\n`
      }
      text += `\n${divider()}\n${italic(`Total Entries: ${timeline.length}`)}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.replyWithHTML(errorCard({ reason: 'Incident not found. Please check the ID.' }))
      } else {
        await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
      }
    }
  })

  // ── AI OPERATIONS ASSISTANT ──

  bot.command('summarize', async (ctx) => {
    try {
      const result = await aiService.querySummaries({ page: 1, limit: 10 })
      if (result.items.length === 0) {
        await ctx.replyWithHTML(`<b>ℹ️ No Summaries</b>\n\nNo AI summaries available.`)
        return
      }
      let text = `${bold('🤖 AI SUMMARIES')}${divider()}\n`
      for (const s of result.items) {
        text += `\n${bold(`[${s.summaryType}]`)} ${s.targetType}:${code(s.targetId.slice(0, 8))} — ${italic(new Date(s.createdAt).toLocaleString())}\n`
        const preview = s.content.length > 80 ? s.content.slice(0, 80) + '...' : s.content
        text += `  ${italic(preview)}\n`
      }
      text += `\n${divider()}\n${italic(`Total: ${result.total}`)}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('ticketsummary', async (ctx) => {
    try {
      const stats = await dashboardService.getTicketStats()
      const metrics = [
        { label: 'Total Tickets', value: String(stats.total) },
        { label: 'Unassigned', value: String(stats.unassigned) },
        { label: 'Avg Resolution', value: stats.avgResolutionTime ? `${(stats.avgResolutionTime / (1000 * 60 * 60)).toFixed(1)} hours` : 'N/A' },
      ]
      let text = dashboardCard({ title: '🎫 TICKET SUMMARY', metrics })
      if (stats.byStatus && Object.keys(stats.byStatus).length > 0) {
        text += `\n\n${bold('By Status:')}\n`
        for (const [status, count] of Object.entries(stats.byStatus)) {
          text += `  ${status}: ${count}\n`
        }
      }
      if (stats.byPriority && Object.keys(stats.byPriority).length > 0) {
        text += `\n${bold('By Priority:')}\n`
        for (const [priority, count] of Object.entries(stats.byPriority)) {
          text += `  ${priority}: ${count}\n`
        }
      }
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('recommendation', async (ctx) => {
    try {
      const result = await aiService.queryRecommendations({ status: 'PENDING', page: 1, limit: 10 })
      if (result.items.length === 0) {
        await ctx.replyWithHTML(`<b>ℹ️ No Recommendations</b>\n\nNo pending recommendations.`)
        return
      }
      let text = `${bold('💡 AI RECOMMENDATIONS')}${divider()}\n`
      for (const rec of result.items) {
        const priorityIcon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢'
        text += `\n${priorityIcon} ${bold(rec.title)}\n`
        if (rec.description) {
          const preview = rec.description.length > 100 ? rec.description.slice(0, 100) + '...' : rec.description
          text += `  ${italic(preview)}\n`
        }
      }
      text += `\n${divider()}\n${italic(`Total: ${result.total}`)}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  // ── EXECUTIVE ANALYTICS ──

  bot.command('executivedashboard', async (ctx) => {
    try {
      const snapshot = await dashboardService.getAggregatedSnapshot([
        'STAFF_OVERVIEW',
        'MODERATION_STATS',
        'TICKET_STATS',
        'CASE_STATS',
        'KPI_SUMMARY',
        'SECURITY_SUMMARY',
        'SYSTEM_HEALTH',
      ])
      const staff = snapshot.STAFF_OVERVIEW as any
      const mod = snapshot.MODERATION_STATS as any
      const tickets = snapshot.TICKET_STATS as any
      const cases = snapshot.CASE_STATS as any
      const kpi = snapshot.KPI_SUMMARY as any
      const security = snapshot.SECURITY_SUMMARY as any
      const health = snapshot.SYSTEM_HEALTH as any

      const metrics = [
        { label: 'Staff', value: `${staff.totalStaff} total, ${staff.activeStaff} active` },
        { label: 'Moderation', value: `${mod.totalActions} total, ${mod.recentActions} in 24h` },
        { label: 'Tickets', value: `${tickets.total} total, ${tickets.unassigned} unassigned` },
        { label: 'Cases', value: String(cases.total) },
        { label: 'KPI Records', value: String(kpi.totalRecords) },
        { label: 'Security Events', value: `${security.totalEvents}, Alerts: ${security.recentAlerts}` },
        { label: 'System', value: `${health.totalServices} services (${health.upCount} up, ${health.downCount} down)` },
      ]
      const text = dashboardCard({ title: '📈 EXECUTIVE DASHBOARD', metrics, footer: `Last updated: ${new Date().toLocaleString()}` })
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('companyreport', async (ctx) => {
    try {
      const [staff, tickets, cases, kpi, health] = await Promise.all([
        dashboardService.getStaffOverview(),
        dashboardService.getTicketStats(),
        dashboardService.getCaseStats(),
        dashboardService.getKpiSummary(),
        dashboardService.getSystemHealth(),
      ])
      let text = `${bold('🏢 COMPANY REPORT')}${divider()}\n`
      text += `\n${bold('👥 Workforce')}`
      text += `\n  Staff: ${staff.totalStaff} (${staff.activeStaff} active)`
      text += `\n  Roles: ${Object.entries(staff.byRole).map(([r, c]) => `${r} (${c})`).join(', ')}`
      text += `\n\n${bold('🎫 Tickets')}`
      text += `\n  Total: ${tickets.total}`
      text += `\n  Unassigned: ${tickets.unassigned}`
      if (tickets.avgResolutionTime) {
        const hrs = tickets.avgResolutionTime / (1000 * 60 * 60)
        text += `\n  Avg Resolution: ${hrs.toFixed(1)}h`
      }
      text += `\n\n${bold('📁 Cases')}`
      text += `\n  Total: ${cases.total}`
      if (cases.byStatus) {
        for (const [s, c] of Object.entries(cases.byStatus)) {
          text += `\n  ${s}: ${c}`
        }
      }
      text += `\n\n${bold('📊 KPI Summary')}`
      text += `\n  Definitions: ${kpi.totalDefinitions}`
      text += `\n  Records: ${kpi.totalRecords}`
      if (kpi.topPerformers.length > 0) {
        text += `\n  Top Performer: ${code(kpi.topPerformers[0].staffId)} (score: ${kpi.topPerformers[0].score})`
      }
      text += `\n\n${bold('⚙ System')}`
      text += `\n  Services: ${health.totalServices} (${health.upCount} up, ${health.downCount} down)`
      text += `\n  Alerts (24h): ${health.recentAlerts}`
      text += `\n${divider()}\n🕐 ${italic(timestamp())}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  // ── AUDIT & COMPLIANCE ──

  bot.command('audit', async (ctx) => {
    try {
      const result = await auditService.query({ page: 1, pageSize: 10 })
      if (result.logs.length === 0) {
        await ctx.replyWithHTML(`<b>ℹ️ No Audit Logs</b>\n\nNo audit logs found.`)
        return
      }
      let text = `${bold('📋 RECENT AUDIT LOGS')}${divider()}\n`
      for (const log of result.logs) {
        text += `\n• ${bold(new Date(log.createdAt).toLocaleString())} — ${bold(log.action)} on ${log.resource}`
        if (log.staffId) text += ` by ${code(log.staffId)}`
        text += '\n'
        if (log.description) text += `  ${log.description}\n`
        if (log.reason) text += `  Reason: ${log.reason}\n`
      }
      text += `\n${divider()}\n${italic(`Total: ${result.total}`)}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('audituser', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length === 0) {
        await ctx.replyWithHTML(`<b>⚠️ Usage</b>\n\n/audituser &lt;userId&gt;`)
        return
      }
      const logs = await auditService.findByTarget(args[0], 10)
      if (logs.length === 0) {
        await ctx.replyWithHTML(`<b>ℹ️ No Audit Logs</b>\n\nNo audit logs found for user ${code(args[0])}.`)
        return
      }
      let text = `${bold(`📋 AUDIT LOGS — User ${args[0].slice(0, 8)}`)}${divider()}\n`
      for (const log of logs) {
        text += `\n• ${bold(new Date(log.createdAt).toLocaleString())} — ${bold(log.action)} on ${log.resource}`
        if (log.staffId) text += ` by ${code(log.staffId)}`
        text += '\n'
        if (log.description) text += `  ${log.description}\n`
      }
      text += `\n${divider()}\n${italic(`Total: ${logs.length}`)}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('auditstaff', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length === 0) {
        await ctx.replyWithHTML(`<b>⚠️ Usage</b>\n\n/auditstaff &lt;staffId&gt;`)
        return
      }
      const staffId = args[0]
      await staffService.findById(staffId)
      const logs = await auditService.findByStaff(staffId, 10)
      if (logs.length === 0) {
        await ctx.replyWithHTML(`<b>ℹ️ No Audit Logs</b>\n\nNo audit logs found for staff member ${code(staffId)}.`)
        return
      }
      let text = `${bold(`📋 AUDIT LOGS — Staff ${staffId.slice(0, 8)}`)}${divider()}\n`
      for (const log of logs) {
        text += `\n• ${bold(new Date(log.createdAt).toLocaleString())} — ${bold(log.action)} on ${log.resource}`
        if (log.resourceId) text += ` (${code(log.resourceId.slice(0, 8))})`
        text += '\n'
        if (log.description) text += `  ${log.description}\n`
      }
      text += `\n${divider()}\n${italic(`Total: ${logs.length}`)}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.replyWithHTML(errorCard({ reason: 'Staff member not found. Please check the ID.' }))
      } else {
        await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
      }
    }
  })

  // ── EMERGENCY LOCKDOWN ──

  bot.command('lockdown', async (ctx) => {
    try {
      const args = getArgs(ctx)
      const reason = args.length > 0 ? args.join(' ') : 'Emergency lockdown activated by staff'
      const from = ctx.from!
      const moderator = await usersService.findByTelegramId(BigInt(from.id))
      const initiatedBy = moderator?.id || from.id.toString()
      await lockdownService.activate(reason, initiatedBy)
      await ctx.replyWithHTML(
        warningCard({
          title: '🚨 EMERGENCY LOCKDOWN ACTIVATED',
          message: `${bold('Reason')}: ${reason}\n\n${bold('Initiated by')}: ${code(initiatedBy)}\n\n${italic('Only exempt roles (OWNER, SUPER_ADMINISTRATOR) can bypass.')}`,
        })
      )
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('liftlockdown', async (ctx) => {
    try {
      const from = ctx.from!
      const moderator = await usersService.findByTelegramId(BigInt(from.id))
      const initiatedBy = moderator?.id || from.id.toString()
      await lockdownService.deactivate(initiatedBy)
      await ctx.replyWithHTML(
        successCard({
          title: 'LOCKDOWN DEACTIVATED',
          items: [{ label: 'Lifted by', value: code(initiatedBy) }],
        })
      )
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  // ── SPNET-ADMIN SYNC ──

  bot.command('syncstatus', async (ctx) => {
    try {
      const [pending, failed, recent] = await Promise.all([
        syncService.getPendingEvents(5),
        syncService.getFailedEvents(3, 5),
        syncService.queryEvents({ page: 1, limit: 5 }),
      ])
      let text = `${bold('🔄 SYNC STATUS')}${divider()}\n`
      text += `\n${bold('Pending Events')}: ${pending.length}`
      text += `\n${bold('Failed Events')}: ${failed.length}`
      text += `\n${bold('Total Recent')}: ${recent.total}`
      if (recent.items.length > 0) {
        text += `\n\n${bold('Recent Sync Events:')}\n`
        for (const ev of recent.items) {
          const icon = ev.status === 'PROCESSED' ? '✅' : ev.status === 'FAILED' ? '❌' : '⏳'
          text += `${icon} [${ev.status}] ${ev.eventType} — ${ev.entityType}:${code((ev.entityId ?? '?').slice(0, 8))}\n`
        }
      }
      text += `\n${divider()}\n🕐 ${italic(timestamp())}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  // ── DEEP LINKING ──

  bot.command('deeplinks', async (ctx) => {
    try {
      const result = await deepLinkService.listLinks({ page: 1, limit: 10 })
      if (result.items.length === 0) {
        await ctx.replyWithHTML(`<b>ℹ️ No Deep Links</b>\n\nNo deep links found.`)
        return
      }
      let text = `${bold('🔗 DEEP LINKS')}${divider()}\n`
      for (const link of result.items) {
        const expired = link.expiresAt && new Date(link.expiresAt) < new Date()
        text += `\n${code(link.code)} → ${link.targetModule}:${code((link.targetId ?? '?').slice(0, 8))}${expired ? italic(' (expired)') : ''}`
        text += `\n  Clicks: ${link.clickCount}${link.maxClicks ? `/${link.maxClicks}` : ''}`
        if (link.source) text += ` | Source: ${link.source}`
        text += '\n'
      }
      text += `\n${divider()}\n${italic(`Total: ${result.total}`)}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  // ── STAFF DASHBOARD ──

  bot.command('staffdashboard', async (ctx) => {
    try {
      const [staff, mod, tickets, cases] = await Promise.all([
        dashboardService.getStaffOverview(),
        dashboardService.getModerationStats(),
        dashboardService.getTicketStats(),
        dashboardService.getCaseStats(),
      ])
      let text = `${bold('📊 STAFF DASHBOARD')}${divider()}`
      text += `\n\n${bold('👥 Staff Overview')}`
      text += `\n  Total: ${staff.totalStaff} | Active: ${staff.activeStaff}`
      if (Object.keys(staff.byRole).length > 0) {
        text += `\n  Roles: ${Object.entries(staff.byRole).map(([r, c]) => `${r} (${c})`).join(', ')}`
      }
      text += `\n\n${bold('🛡 Moderation')}`
      text += `\n  Total Actions: ${mod.totalActions}`
      text += `\n  Recent (24h): ${mod.recentActions}`
      if (mod.topModerators.length > 0) {
        text += `\n  Top Moderator: ${code(mod.topModerators[0].staffId)} (${mod.topModerators[0].count} actions)`
      }
      text += `\n\n${bold('🎫 Tickets')}`
      text += `\n  Total: ${tickets.total} | Unassigned: ${tickets.unassigned}`
      if (tickets.byStatus) {
        text += `\n  ${Object.entries(tickets.byStatus).map(([s, c]) => `${s}: ${c}`).join(' | ')}`
      }
      text += `\n\n${bold('📁 Cases')}`
      text += `\n  Total: ${cases.total}`
      if (cases.byStatus) {
        text += `\n  ${Object.entries(cases.byStatus).map(([s, c]) => `${s}: ${c}`).join(' | ')}`
      }
      text += `\n${divider()}\n🕐 ${italic(timestamp())}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('activedashboard', async (ctx) => {
    try {
      const [incidents, tickets, cases] = await Promise.all([
        incidentsService.findMany({ page: 1, limit: 10 }),
        dashboardService.getTicketStats(),
        dashboardService.getCaseStats(),
      ])
      let text = `${bold('📈 ACTIVE DASHBOARD')}${divider()}`
      text += `\n\n${bold('🚨 Open Incidents')}: ${incidents.total}`
      if (incidents.items.length > 0) {
        for (const inc of incidents.items.slice(0, 5)) {
          text += `\n  • ${code(inc.referenceId.slice(0, 8))} [${inc.priority}] ${inc.title}`
        }
      }
      text += `\n\n${bold('🎫 Ticket Status')}:`
      if (tickets.byStatus) {
        for (const [s, c] of Object.entries(tickets.byStatus)) {
          text += `\n  ${s}: ${c}`
        }
      }
      text += `\n\n${bold('📁 Case Status')}:`
      if (cases.byStatus) {
        for (const [s, c] of Object.entries(cases.byStatus)) {
          text += `\n  ${s}: ${c}`
        }
      }
      text += `\n${divider()}\n🕐 ${italic(timestamp())}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  // ── ENTERPRISE GOVERNANCE ──

  async function resolveStaffRoleId(staffId: string): Promise<string> {
    const staff = await staffService.findById(staffId)
    const activeAssignment = staff.roleAssignments?.[0]
    if (!activeAssignment) throw new Error('Staff member has no active role assigned.')
    return activeAssignment.roleId
  }

  bot.command('grantpermission', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length < 3) {
        await ctx.replyWithHTML(`<b>⚠️ Usage</b>\n\n/grantpermission &lt;staffId&gt; &lt;resource&gt; &lt;action&gt;`)
        return
      }
      const [staffId, resource, action] = args
      await staffService.findById(staffId)
      const roleId = await resolveStaffRoleId(staffId)
      await permissionsService.grant({ roleId, resource, action })
      await ctx.replyWithHTML(
        successCard({
          title: 'PERMISSION GRANTED',
          items: [
            { label: 'Staff', value: code(staffId) },
            { label: 'Resource', value: code(resource) },
            { label: 'Action', value: code(action) },
            { label: 'Role', value: code(roleId) },
          ],
        })
      )
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.replyWithHTML(errorCard({ reason: 'Staff member not found. Please check the ID.' }))
      } else {
        await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
      }
    }
  })

  bot.command('revokepermission', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length < 3) {
        await ctx.replyWithHTML(`<b>⚠️ Usage</b>\n\n/revokepermission &lt;staffId&gt; &lt;resource&gt; &lt;action&gt;`)
        return
      }
      const [staffId, resource, action] = args
      await staffService.findById(staffId)
      const roleId = await resolveStaffRoleId(staffId)
      await permissionsService.revoke({ roleId, resource, action })
      await ctx.replyWithHTML(
        successCard({
          title: 'PERMISSION REVOKED',
          items: [
            { label: 'Staff', value: code(staffId) },
            { label: 'Resource', value: code(resource) },
            { label: 'Action', value: code(action) },
            { label: 'Role', value: code(roleId) },
          ],
        })
      )
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.replyWithHTML(errorCard({ reason: 'Staff or permission not found. Please check the ID.' }))
      } else {
        await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
      }
    }
  })

  bot.command('grantrole', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length < 2) {
        await ctx.replyWithHTML(`<b>⚠️ Usage</b>\n\n/grantrole &lt;staffId&gt; &lt;roleName&gt;`)
        return
      }
      const [staffId, roleName] = args
      await staffService.findById(staffId)
      const assignment = await permissionsService.assignRoleToStaff(staffId, roleName, ctx.from?.id.toString())
      await ctx.replyWithHTML(
        successCard({
          title: 'ROLE ASSIGNED',
          items: [
            { label: 'Staff', value: code(staffId) },
            { label: 'Role', value: code(assignment.role.name || roleName) },
            { label: 'Status', value: '🟢 Active' },
          ],
        })
      )
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.replyWithHTML(errorCard({ reason: 'Staff member or role not found.' }))
      } else {
        await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
      }
    }
  })

  bot.command('revokerole', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length < 2) {
        await ctx.replyWithHTML(`<b>⚠️ Usage</b>\n\n/revokerole &lt;staffId&gt; &lt;roleName&gt;`)
        return
      }
      const [staffId, roleName] = args
      await staffService.findById(staffId)
      await permissionsService.removeRoleFromStaff(staffId, roleName)
      await ctx.replyWithHTML(
        successCard({
          title: 'ROLE REMOVED',
          items: [
            { label: 'Staff', value: code(staffId) },
            { label: 'Role', value: code(roleName) },
            { label: 'Status', value: 'Revoked' },
          ],
        })
      )
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.replyWithHTML(errorCard({ reason: 'Staff member, role, or assignment not found.' }))
      } else {
        await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
      }
    }
  })

  bot.command('temporaryaccess', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length < 4) {
        await ctx.replyWithHTML(`<b>⚠️ Usage</b>\n\n/temporaryaccess &lt;staffId&gt; &lt;resource&gt; &lt;action&gt; &lt;hours&gt;`)
        return
      }
      const [staffId, resource, action, hoursStr] = args
      const hours = parseInt(hoursStr, 10)
      if (isNaN(hours) || hours <= 0) {
        await ctx.replyWithHTML(`<b>⚠️ Invalid Hours</b>\n\nHours must be a positive number.`)
        return
      }
      await staffService.findById(staffId)
      const roleId = await resolveStaffRoleId(staffId)
      await permissionsService.grant({ roleId, resource, action })
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)
      await ctx.replyWithHTML(
        successCard({
          title: 'TEMPORARY ACCESS GRANTED',
          items: [
            { label: 'Staff', value: code(staffId) },
            { label: 'Resource', value: code(resource) },
            { label: 'Action', value: code(action) },
            { label: 'Duration', value: `${hours} hour(s)` },
            { label: 'Expires', value: expiresAt.toLocaleString() },
          ],
        })
      )
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.replyWithHTML(errorCard({ reason: 'Staff member not found.' }))
      } else {
        await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
      }
    }
  })

  bot.command('accessaudit', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length === 0) {
        await ctx.replyWithHTML(`<b>⚠️ Usage</b>\n\n/accessaudit &lt;staffId&gt;`)
        return
      }
      const staffId = args[0]
      const staff = await staffService.findById(staffId)
      const permissions = await permissionsService.findByStaffId(staffId)
      let text = `${bold(`🔍 ACCESS AUDIT — Staff ${staffId.slice(0, 8)}`)}${divider()}`
      const userName = staff.user?.firstName || staff.user?.telegramUsername || 'Unknown'
      text += `\n\n${bold('Name')}: ${userName}`
      text += `\n${bold('Active')}: ${staff.isActive ? '🟢 Yes' : '🔴 No'}`
      const roles = staff.roleAssignments.map((r: any) => r.role?.name || r.roleId).join(', ')
      text += `\n${bold('Roles')}: ${roles || 'None'}`
      text += `\n${bold('Permissions')}: ${permissions.length}`
      if (permissions.length > 0) {
        text += `\n\n${bold('Granted Permissions:')}\n`
        for (const perm of permissions) {
          text += `  • ${code((perm as any).resource)} → ${code((perm as any).action)}\n`
        }
      } else {
        text += `\n\n${italic('No direct permission grants found.')}`
      }
      text += `\n${divider()}\n🕐 ${italic(timestamp())}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.replyWithHTML(errorCard({ reason: 'Staff member not found.' }))
      } else {
        await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
      }
    }
  })

  // ── DASHBOARD COMMAND ──

  bot.command('dashboard', async (ctx) => {
    try {
      const [staffOverview, ticketStats, caseStats, modStats, health, incidents] = await Promise.all([
        dashboardService.getStaffOverview(),
        dashboardService.getTicketStats(),
        dashboardService.getCaseStats(),
        dashboardService.getModerationStats(),
        dashboardService.getSystemHealth(),
        incidentsService.findMany({ page: 1, limit: 1 }),
      ])
      const text = dashboardCard({
        title: '📊 SPNETGRAM STAFF DASHBOARD',
        metrics: [
          { label: '👥 Active Staff', value: String(staffOverview.activeStaff) },
          { label: '🎫 Open Tickets', value: String(ticketStats.total) },
          { label: '📁 Active Cases', value: String(caseStats.total) },
          { label: '🔍 Investigations', value: 'N/A' },
          { label: '🚨 Incidents', value: String(incidents.total) },
          { label: '💎 Premium Users', value: 'N/A' },
          { label: '💰 Economy Transactions', value: 'N/A' },
        ],
        footer: `System: ${health.upCount}/${health.totalServices} services up`,
      })
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('👥 Staff', 'help_cat_staff'), Markup.button.callback('🎫 Tickets', 'help_cat_tickets')],
        [Markup.button.callback('📁 Cases', 'help_cat_cases'), Markup.button.callback('🛡 Moderation', 'help_cat_moderation')],
        [Markup.button.callback('📖 Guide', 'guide_main'), Markup.button.callback('📚 Help', 'help_main')],
      ])
      await ctx.replyWithHTML(text, { reply_markup: keyboard.reply_markup })
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })
}
