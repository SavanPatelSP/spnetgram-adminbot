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

function getArgs(ctx: { message?: { text?: string } }): string[] {
  const text = ctx.message?.text ?? ''
  return text.split(/\s+/).slice(1)
}

export function registerNewModuleCommands(bot: Telegraf): void {

  // ── Part A: Security Operations Center ──

  bot.command('security', async (ctx) => {
    try {
      const [summary, alerts] = await Promise.all([
        dashboardService.getSecuritySummary(),
        monitoringService.listAlerts({ acknowledged: false, page: 1, limit: 5 }),
      ])
      let text = '*Security Summary*\n\n'
      text += `Total Events: ${summary.totalEvents}\n`
      text += `Active Sessions: ${summary.activeSessions}\n`
      text += `Alerts (24h): ${summary.recentAlerts}\n`
      text += `\n*By Type:*\n`
      for (const [type, count] of Object.entries(summary.byType)) {
        text += `  ${type}: ${count}\n`
      }
      if (alerts.items.length > 0) {
        text += `\n*Unacknowledged Alerts:*\n`
        for (const a of alerts.items) {
          text += `  • [${a.severity}] ${a.message || a.type}\n`
        }
      }
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Security summary error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('securitylogs', async (ctx) => {
    try {
      const result = await securityService.queryEvents({ page: 1, limit: 10 })
      if (result.items.length === 0) {
        await ctx.reply('No security events found.')
        return
      }
      let text = '*Recent Security Events*\n\n'
      for (const ev of result.items) {
        text += `• ${ev.eventType} (${ev.severity}) - ${new Date(ev.timestamp).toLocaleString()}\n`
        if (ev.description) text += `  ${ev.description}\n`
      }
      text += `\nTotal: ${result.total}`
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('risk', async (ctx) => {
    try {
      const [failedLogins, events, unacknowledged] = await Promise.all([
        securityService.getRecentFailedLogins(60),
        securityService.queryEvents({ page: 1, limit: 1 }),
        monitoringService.listAlerts({ acknowledged: false, page: 1, limit: 1 }),
      ])
      let text = '*Risk Analysis*\n\n'
      text += `Total Security Events: ${events.total}\n`
      text += `Failed Logins (60m): ${failedLogins.length}\n`
      text += `Unacknowledged Alerts: ${unacknowledged.total}\n`
      const riskLevel = failedLogins.length > 10 ? 'HIGH' : failedLogins.length > 3 ? 'MEDIUM' : 'LOW'
      const icons: Record<string, string> = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' }
      text += `\nRisk Level: ${icons[riskLevel]} *${riskLevel}*`
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Risk analysis error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('fraud', async (ctx) => {
    try {
      const allEvents = await securityService.queryEvents({ page: 1, limit: 1 })
      const recent = await securityService.queryEvents({ page: 1, limit: 10 })
      const fraudEvents = recent.items.filter(
        (e) => e.eventType === 'FRAUD_DETECTED',
      )
      let text = '*Fraud Check Summary*\n\n'
      text += `Total Events Scanned: ${allEvents.total}\n`
      text += `Fraud Events Found: ${fraudEvents.length}\n`
      if (fraudEvents.length > 0) {
        text += `\n*Recent:*\n`
        for (const ev of fraudEvents) {
          text += `• ${ev.eventType} (${ev.severity}) - ${new Date(ev.timestamp).toLocaleString()}\n`
        }
      } else {
        text += `\nNo suspicious fraud activity detected.`
      }
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Fraud check error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('sessionaudit', async (ctx) => {
    try {
      const result = await securityService.getLoginHistory({ page: 1, limit: 10 })
      if (result.items.length === 0) {
        await ctx.reply('No login history found.')
        return
      }
      let text = '*Recent Login History*\n\n'
      for (const entry of result.items) {
        const icon = entry.success ? '✅' : '❌'
        text += `${icon} ${new Date(entry.timestamp).toLocaleString()} - ${entry.success ? 'Success' : `Failed (${entry.failReason || 'Unknown'})`}\n`
        if (entry.ipAddress) text += `  IP: \`${entry.ipAddress}\`\n`
      }
      text += `\nTotal: ${result.total}`
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Session audit error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  // ── Part B: Monitoring Center ──

  bot.command('stats', async (ctx) => {
    try {
      const [health, staff, tickets] = await Promise.all([
        dashboardService.getSystemHealth(),
        dashboardService.getStaffOverview(),
        dashboardService.getTicketStats(),
      ])
      let text = '*System Stats*\n\n'
      text += `Services: ${health.totalServices} (${health.upCount} up, ${health.downCount} down)\n`
      text += `Alerts (24h): ${health.recentAlerts}\n`
      text += `Staff: ${staff.totalStaff} total, ${staff.activeStaff} active\n`
      text += `Tickets: ${tickets.total} (${tickets.unassigned} unassigned)\n`
      if (tickets.byStatus) {
        const statuses = Object.entries(tickets.byStatus).map(([s, c]) => `${s}: ${c}`).join(', ')
        text += `Ticket Status: ${statuses}\n`
      }
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Stats error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('system', async (ctx) => {
    try {
      const health = await dashboardService.getSystemHealth()
      let text = '*System Health*\n\n'
      text += `Total Services: ${health.totalServices}\n`
      text += `Services Up: ${health.upCount}\n`
      text += `Services Down: ${health.downCount}\n`
      text += `Alerts (24h): ${health.recentAlerts}\n`
      const status = health.downCount === 0
        ? '✅ All Systems Operational'
        : `⚠️ ${health.downCount} service(s) reporting issues`
      text += `\n${status}`
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`System error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('health', async (ctx) => {
    try {
      const services = await monitoringService.listServices({ page: 1, limit: 50 })
      if (services.items.length === 0) {
        await ctx.reply('No services registered. Health check cannot be performed.')
        return
      }
      const up = services.items.filter((s) => s.isUp)
      const down = services.items.filter((s) => !s.isUp)
      let text = '*Health Check*\n\n'
      text += `✅ Up: ${up.length}\n`
      text += `❌ Down: ${down.length}\n`
      if (down.length > 0) {
        text += `\n*Unhealthy Services:*\n`
        for (const svc of down) {
          text += `  • ${svc.displayName || svc.name} - ${svc.status}\n`
          if (svc.message) text += `    ${svc.message}\n`
        }
      }
      if (up.length > 0) {
        text += `\n*Healthy Services:*\n`
        for (const svc of up.slice(0, 5)) {
          text += `  • ${svc.displayName || svc.name}\n`
        }
        if (up.length > 5) text += `  ... and ${up.length - 5} more\n`
      }
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Health check error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('latency', async (ctx) => {
    try {
      const result = await analyticsService.queryMetrics({ page: 1, limit: 10 })
      let text = '*Latency Information*\n\n'
      if (result.items.length === 0) {
        text += 'No metrics recorded yet.'
      } else {
        const unit = result.items[0].unit || 'ms'
        const avg = result.items.reduce((s, m) => s + m.value, 0) / result.items.length
        const sorted = [...result.items].sort((a, b) => a.value - b.value)
        text += `Recordings: ${result.total}\n`
        text += `Average: ${avg.toFixed(2)} ${unit}\n`
        text += `Min: ${sorted[0].value} ${unit}\n`
        text += `Max: ${sorted[sorted.length - 1].value} ${unit}\n`
        text += `\n*Latest Readings:*\n`
        for (const m of result.items.slice(0, 5)) {
          text += `• ${m.value}${unit} (${new Date(m.recordedAt).toLocaleString()})${m.label ? ` - ${m.label}` : ''}\n`
        }
      }
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Latency error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('services', async (ctx) => {
    try {
      const result = await monitoringService.listServices({ page: 1, limit: 20 })
      if (result.items.length === 0) {
        await ctx.reply('No services registered.')
        return
      }
      let text = '*Service Status*\n\n'
      for (const svc of result.items) {
        const icon = svc.isUp ? '✅' : '❌'
        text += `${icon} ${svc.displayName || svc.name}: ${svc.status}\n`
      }
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Services error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  // ── Part C: Incident Management ──

  async function handleIncidentStatus(ctx: any, id: string) {
    const incident = await incidentsService.findById(id)
    let text = `*Incident #${incident.referenceId.slice(0, 8)}*\n\n`
    text += `Title: ${incident.title}\n`
    text += `Status: ${incident.status}\n`
    text += `Priority: ${incident.priority}\n`
    text += `Severity: ${incident.severity}\n`
    if (incident.description) text += `Description: ${incident.description}\n`
    if (incident.category) text += `Category: ${incident.category}\n`
    if (incident.assigneeId) text += `Assignee: \`${incident.assigneeId}\`\n`
    if (incident.tags && incident.tags.length > 0) text += `Tags: ${(incident.tags as string[]).join(', ')}\n`
    text += `Created: ${new Date(incident.createdAt).toLocaleString()}\n`
    if (incident.resolvedAt) text += `Resolved: ${new Date(incident.resolvedAt).toLocaleString()}\n`
    await ctx.replyWithMarkdown(text)
  }

  bot.command('incident', async (ctx) => {
    try {
      const result = await incidentsService.findMany({ page: 1, limit: 10 })
      if (result.items.length === 0) {
        await ctx.reply('No incidents found.')
        return
      }
      let text = '*Open Incidents*\n\n'
      for (const inc of result.items) {
        text += `• #${inc.referenceId.slice(0, 8)} [${inc.priority}] ${inc.title} - ${inc.status}\n`
      }
      text += `\nTotal: ${result.total}`
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Incident error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('incidentstatus', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length === 0) {
        await ctx.reply('Usage: /incidentstatus <incidentId>')
        return
      }
      await handleIncidentStatus(ctx, args[0])
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.reply(`Incident not found. Please check the ID and try again.`)
      } else {
        await ctx.reply(`Error: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }
  })

  bot.command('resolveincident', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length === 0) {
        await ctx.reply('Usage: /resolveincident <incidentId>')
        return
      }
      const resolved = await incidentsService.resolve(args[0])
      await ctx.replyWithMarkdown(
        `*Incident Resolved*\n\n#${resolved.referenceId.slice(0, 8)} - ${resolved.title}\nStatus: ${resolved.status}\nResolved: ${new Date(resolved.resolvedAt!).toLocaleString()}`,
      )
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.reply(`Incident not found. Please check the ID and try again.`)
      } else {
        await ctx.reply(`Error: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }
  })

  bot.command('incidenttimeline', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length === 0) {
        await ctx.reply('Usage: /incidenttimeline <incidentId>')
        return
      }
      const timeline = await incidentsService.getTimeline(args[0])
      if (timeline.length === 0) {
        await ctx.reply('No timeline entries found for this incident.')
        return
      }
      let text = `*Incident Timeline*\n\n`
      for (const entry of timeline) {
        text += `• ${new Date(entry.createdAt).toLocaleString()} - *${entry.action}*\n`
        if (entry.description) text += `  ${entry.description}\n`
      }
      text += `\nTotal Entries: ${timeline.length}`
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.reply(`Incident not found. Please check the ID and try again.`)
      } else {
        await ctx.reply(`Error: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }
  })

  // ── Part D: AI Operations Assistant ──

  bot.command('summarize', async (ctx) => {
    try {
      const result = await aiService.querySummaries({ page: 1, limit: 10 })
      if (result.items.length === 0) {
        await ctx.reply('No AI summaries available.')
        return
      }
      let text = '*Recent AI Summaries*\n\n'
      for (const s of result.items) {
        text += `• [${s.summaryType}] ${s.targetType}:${s.targetId.slice(0, 8)} - ${new Date(s.createdAt).toLocaleString()}\n`
        const preview = s.content.length > 80 ? s.content.slice(0, 80) + '...' : s.content
        text += `  _${preview}_\n`
      }
      text += `\nTotal: ${result.total}`
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Summaries error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('ticketsummary', async (ctx) => {
    try {
      const stats = await dashboardService.getTicketStats()
      let text = '*Ticket Summary*\n\n'
      text += `Total Tickets: ${stats.total}\n`
      text += `Unassigned: ${stats.unassigned}\n`
      if (stats.avgResolutionTime) {
        const hours = stats.avgResolutionTime / (1000 * 60 * 60)
        text += `Avg Resolution: ${hours.toFixed(1)} hours\n`
      } else {
        text += `Avg Resolution: N/A\n`
      }
      if (stats.byStatus && Object.keys(stats.byStatus).length > 0) {
        text += `\n*By Status:*\n`
        for (const [status, count] of Object.entries(stats.byStatus)) {
          text += `  ${status}: ${count}\n`
        }
      }
      if (stats.byPriority && Object.keys(stats.byPriority).length > 0) {
        text += `\n*By Priority:*\n`
        for (const [priority, count] of Object.entries(stats.byPriority)) {
          text += `  ${priority}: ${count}\n`
        }
      }
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Ticket summary error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('recommendation', async (ctx) => {
    try {
      const result = await aiService.queryRecommendations({ status: 'PENDING', page: 1, limit: 10 })
      if (result.items.length === 0) {
        await ctx.reply('No pending recommendations.')
        return
      }
      let text = '*AI Recommendations*\n\n'
      for (const rec of result.items) {
        text += `• [${rec.priority}] ${rec.title}\n`
        if (rec.description) {
          const preview = rec.description.length > 100 ? rec.description.slice(0, 100) + '...' : rec.description
          text += `  ${preview}\n`
        }
      }
      text += `\nTotal: ${result.total}`
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Recommendations error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  // ── Part E: Executive Analytics ──

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

      let text = '*Executive Dashboard*\n\n'
      text += `*Staff:* ${staff.totalStaff} total, ${staff.activeStaff} active\n`
      text += `*Moderation:* ${mod.totalActions} total actions, ${mod.recentActions} in 24h\n`
      text += `*Tickets:* ${tickets.total} total, ${tickets.unassigned} unassigned\n`
      text += `*Cases:* ${cases.total} total\n`
      text += `*KPI Records:* ${kpi.totalRecords}\n`
      text += `*Security Events:* ${security.totalEvents}, Alerts: ${security.recentAlerts}\n`
      text += `*System:* ${health.totalServices} services (${health.upCount} up, ${health.downCount} down)\n`
      text += `\n_Last updated: ${new Date().toLocaleString()}_`
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Dashboard error: ${err instanceof Error ? err.message : 'Unknown'}`)
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
      let text = '*Company Report*\n\n'
      text += `*Workforce*\n`
      text += `  Staff: ${staff.totalStaff} (${staff.activeStaff} active)\n`
      text += `  Roles: ${Object.entries(staff.byRole).map(([r, c]) => `${r} (${c})`).join(', ')}\n\n`
      text += `*Tickets*\n`
      text += `  Total: ${tickets.total}\n`
      text += `  Unassigned: ${tickets.unassigned}\n`
      if (tickets.avgResolutionTime) {
        const hrs = tickets.avgResolutionTime / (1000 * 60 * 60)
        text += `  Avg Resolution: ${hrs.toFixed(1)}h\n`
      }
      text += `\n`
      text += `*Cases*\n`
      text += `  Total: ${cases.total}\n`
      if (cases.byStatus) {
        for (const [s, c] of Object.entries(cases.byStatus)) {
          text += `  ${s}: ${c}\n`
        }
      }
      text += `\n`
      text += `*KPI Summary*\n`
      text += `  Definitions: ${kpi.totalDefinitions}\n`
      text += `  Records: ${kpi.totalRecords}\n`
      if (kpi.topPerformers.length > 0) {
        text += `  Top Performer: \`${kpi.topPerformers[0].staffId}\` (score: ${kpi.topPerformers[0].score})\n`
      }
      text += `\n`
      text += `*System*\n`
      text += `  Services: ${health.totalServices} (${health.upCount} up, ${health.downCount} down)\n`
      text += `  Alerts (24h): ${health.recentAlerts}\n`
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Report error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  // ── Part G: Audit & Compliance ──

  bot.command('audit', async (ctx) => {
    try {
      const result = await auditService.query({ page: 1, pageSize: 10 })
      if (result.logs.length === 0) {
        await ctx.reply('No audit logs found.')
        return
      }
      let text = '*Recent Audit Logs*\n\n'
      for (const log of result.logs) {
        text += `• ${new Date(log.createdAt).toLocaleString()} - *${log.action}* on ${log.resource}`
        if (log.staffId) text += ` by \`${log.staffId}\``
        text += `\n`
        if (log.description) text += `  ${log.description}\n`
        if (log.reason) text += `  Reason: ${log.reason}\n`
      }
      text += `\nTotal: ${result.total}`
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Audit error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('audituser', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length === 0) {
        await ctx.reply('Usage: /audituser <userId>')
        return
      }
      const logs = await auditService.findByTarget(args[0], 10)
      if (logs.length === 0) {
        await ctx.reply(`No audit logs found for user \`${args[0]}\`.`)
        return
      }
      let text = `*Audit Logs for User ${args[0].slice(0, 8)}*\n\n`
      for (const log of logs) {
        text += `• ${new Date(log.createdAt).toLocaleString()} - *${log.action}* on ${log.resource}`
        if (log.staffId) text += ` by \`${log.staffId}\``
        text += `\n`
        if (log.description) text += `  ${log.description}\n`
      }
      text += `\nTotal: ${logs.length}`
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Audit user error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('auditstaff', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length === 0) {
        await ctx.reply('Usage: /auditstaff <staffId>')
        return
      }
      const staffId = args[0]
      await staffService.findById(staffId)
      const logs = await auditService.findByStaff(staffId, 10)
      if (logs.length === 0) {
        await ctx.reply(`No audit logs found for staff member \`${staffId}\`.`)
        return
      }
      let text = `*Audit Logs for Staff ${staffId.slice(0, 8)}*\n\n`
      for (const log of logs) {
        text += `• ${new Date(log.createdAt).toLocaleString()} - *${log.action}* on ${log.resource}`
        if (log.resourceId) text += ` (${log.resourceId.slice(0, 8)})`
        text += `\n`
        if (log.description) text += `  ${log.description}\n`
      }
      text += `\nTotal: ${logs.length}`
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.reply(`Staff member not found. Please check the ID.`)
      } else {
        await ctx.reply(`Audit staff error: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }
  })

  // ── Part H: SPNET-Admin Sync ──

  bot.command('syncstatus', async (ctx) => {
    try {
      const [pending, failed, recent] = await Promise.all([
        syncService.getPendingEvents(5),
        syncService.getFailedEvents(3, 5),
        syncService.queryEvents({ page: 1, limit: 5 }),
      ])
      let text = '*Sync Status*\n\n'
      text += `Pending Events: ${pending.length}\n`
      text += `Failed Events: ${failed.length}\n`
      text += `Total Recent: ${recent.total}\n`
      if (recent.items.length > 0) {
        text += `\n*Recent Sync Events:*\n`
        for (const ev of recent.items) {
          const icon = ev.status === 'PROCESSED' ? '✅' : ev.status === 'FAILED' ? '❌' : '⏳'
          text += `${icon} [${ev.status}] ${ev.eventType} - ${ev.entityType}:${(ev.entityId ?? '?').slice(0, 8)}\n`
        }
      }
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Sync status error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  // ── Part I: Deep Linking ──

  bot.command('deeplinks', async (ctx) => {
    try {
      const result = await deepLinkService.listLinks({ page: 1, limit: 10 })
      if (result.items.length === 0) {
        await ctx.reply('No deep links found.')
        return
      }
      let text = '*Deep Links*\n\n'
      for (const link of result.items) {
        const expired = link.expiresAt && new Date(link.expiresAt) < new Date()
        text += `• \`${link.code}\` → ${link.targetModule}:${(link.targetId ?? '?').slice(0, 8)}${expired ? ' (expired)' : ''}`
        text += `\n  Clicks: ${link.clickCount}${link.maxClicks ? `/${link.maxClicks}` : ''}`
        if (link.source) text += ` | Source: ${link.source}`
        text += `\n`
      }
      text += `\nTotal: ${result.total}`
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Deep links error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  // ── Part J: Real-Time Staff Dashboard ──

  bot.command('staffdashboard', async (ctx) => {
    try {
      const [staff, mod, tickets, cases] = await Promise.all([
        dashboardService.getStaffOverview(),
        dashboardService.getModerationStats(),
        dashboardService.getTicketStats(),
        dashboardService.getCaseStats(),
      ])
      let text = '*Staff Dashboard*\n\n'
      text += `*Staff Overview*\n`
      text += `  Total: ${staff.totalStaff} | Active: ${staff.activeStaff}\n`
      if (Object.keys(staff.byRole).length > 0) {
        text += `  Roles: ${Object.entries(staff.byRole).map(([r, c]) => `${r} (${c})`).join(', ')}\n`
      }
      text += `\n*Moderation*\n`
      text += `  Total Actions: ${mod.totalActions}\n`
      text += `  Recent (24h): ${mod.recentActions}\n`
      if (mod.topModerators.length > 0) {
        text += `  Top Moderator: \`${mod.topModerators[0].staffId}\` (${mod.topModerators[0].count} actions)\n`
      }
      text += `\n*Tickets*\n`
      text += `  Total: ${tickets.total} | Unassigned: ${tickets.unassigned}\n`
      if (tickets.byStatus) {
        text += `  ${Object.entries(tickets.byStatus).map(([s, c]) => `${s}: ${c}`).join(' | ')}\n`
      }
      text += `\n*Cases*\n`
      text += `  Total: ${cases.total}\n`
      if (cases.byStatus) {
        text += `  ${Object.entries(cases.byStatus).map(([s, c]) => `${s}: ${c}`).join(' | ')}\n`
      }
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Staff dashboard error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('activedashboard', async (ctx) => {
    try {
      const [incidents, tickets, cases] = await Promise.all([
        incidentsService.findMany({ page: 1, limit: 10 }),
        dashboardService.getTicketStats(),
        dashboardService.getCaseStats(),
      ])
      let text = '*Active Dashboard*\n\n'
      text += `*Open Incidents:* ${incidents.total}\n`
      if (incidents.items.length > 0) {
        for (const inc of incidents.items.slice(0, 5)) {
          text += `  • #${inc.referenceId.slice(0, 8)} [${inc.priority}] ${inc.title}\n`
        }
      }
      text += `\n*Ticket Status:*\n`
      if (tickets.byStatus) {
        for (const [s, c] of Object.entries(tickets.byStatus)) {
          text += `  ${s}: ${c}\n`
        }
      }
      text += `\n*Case Status:*\n`
      if (cases.byStatus) {
        for (const [s, c] of Object.entries(cases.byStatus)) {
          text += `  ${s}: ${c}\n`
        }
      }
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Active dashboard error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  // ── Part K: Enterprise Governance ──

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
        await ctx.reply('Usage: /grantpermission <staffId> <resource> <action>')
        return
      }
      const [staffId, resource, action] = args
      await staffService.findById(staffId)
      const roleId = await resolveStaffRoleId(staffId)
      await permissionsService.grant({ roleId, resource, action })
      await ctx.replyWithMarkdown(
        `*Permission Granted*\n\nStaff: \`${staffId}\`\nResource: \`${resource}\`\nAction: \`${action}\`\nRole: \`${roleId}\``,
      )
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.reply('Staff member not found. Please check the ID.')
      } else {
        await ctx.reply(`Grant error: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }
  })

  bot.command('revokepermission', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length < 3) {
        await ctx.reply('Usage: /revokepermission <staffId> <resource> <action>')
        return
      }
      const [staffId, resource, action] = args
      await staffService.findById(staffId)
      const roleId = await resolveStaffRoleId(staffId)
      await permissionsService.revoke({ roleId, resource, action })
      await ctx.replyWithMarkdown(
        `*Permission Revoked*\n\nStaff: \`${staffId}\`\nResource: \`${resource}\`\nAction: \`${action}\`\nRole: \`${roleId}\``,
      )
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.reply('Staff or permission not found. Please check the ID.')
      } else {
        await ctx.reply(`Revoke error: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }
  })

  bot.command('grantrole', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length < 2) {
        await ctx.reply('Usage: /grantrole <staffId> <roleName>')
        return
      }
      const [staffId, roleName] = args
      await staffService.findById(staffId)
      const assignment = await permissionsService.assignRoleToStaff(staffId, roleName, ctx.from?.id.toString())
      await ctx.replyWithMarkdown(
        `*Role Assigned*\n\nStaff: \`${staffId}\`\nRole: \`${assignment.role.name || roleName}\`\nStatus: Active`,
      )
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.reply('Staff member or role not found.')
      } else {
        await ctx.reply(`Grant role error: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }
  })

  bot.command('revokerole', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length < 2) {
        await ctx.reply('Usage: /revokerole <staffId> <roleName>')
        return
      }
      const [staffId, roleName] = args
      await staffService.findById(staffId)
      await permissionsService.removeRoleFromStaff(staffId, roleName)
      await ctx.replyWithMarkdown(
        `*Role Removed*\n\nStaff: \`${staffId}\`\nRole: \`${roleName}\`\nStatus: Revoked`,
      )
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.reply('Staff member, role, or assignment not found.')
      } else {
        await ctx.reply(`Revoke role error: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }
  })

  bot.command('temporaryaccess', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length < 4) {
        await ctx.reply('Usage: /temporaryaccess <staffId> <resource> <action> <hours>')
        return
      }
      const [staffId, resource, action, hoursStr] = args
      const hours = parseInt(hoursStr, 10)
      if (isNaN(hours) || hours <= 0) {
        await ctx.reply('Hours must be a positive number.')
        return
      }
      await staffService.findById(staffId)
      const roleId = await resolveStaffRoleId(staffId)
      await permissionsService.grant({ roleId, resource, action })
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)
      await ctx.replyWithMarkdown(
        `*Temporary Access Granted*\n\nStaff: \`${staffId}\`\nResource: \`${resource}\`\nAction: \`${action}\`\nDuration: ${hours} hour(s)\nExpires: ${expiresAt.toLocaleString()}\n\n_Please manually revoke after expiry if needed._`,
      )
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.reply('Staff member not found.')
      } else {
        await ctx.reply(`Temporary access error: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }
  })

  bot.command('accessaudit', async (ctx) => {
    try {
      const args = getArgs(ctx)
      if (args.length === 0) {
        await ctx.reply('Usage: /accessaudit <staffId>')
        return
      }
      const staffId = args[0]
      const staff = await staffService.findById(staffId)
      const permissions = await permissionsService.findByStaffId(staffId)
      let text = `*Access Audit for Staff ${staffId.slice(0, 8)}*\n\n`
      const userName = staff.user?.firstName || staff.user?.telegramUsername || 'Unknown'
      text += `Name: ${userName}\n`
      text += `Active: ${staff.isActive ? '✅ Yes' : '❌ No'}\n`
      const roles = staff.roleAssignments.map((r: any) => r.role?.name || r.roleId).join(', ')
      text += `Roles: ${roles || 'None'}\n`
      text += `Permissions: ${permissions.length}\n`
      if (permissions.length > 0) {
        text += `\n*Granted Permissions:*\n`
        for (const perm of permissions) {
          text += `  • \`${(perm as any).resource}\` → \`${(perm as any).action}\`\n`
        }
      } else {
        text += `\nNo direct permission grants found.`
      }
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      if (err instanceof Error && err.message.includes('NotFound')) {
        await ctx.reply('Staff member not found.')
      } else {
        await ctx.reply(`Access audit error: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }
  })
}
