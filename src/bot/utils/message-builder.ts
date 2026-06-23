export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function bold(text: string): string {
  return `<b>${text}</b>`
}

export function italic(text: string): string {
  return `<i>${text}</i>`
}

export function underline(text: string): string {
  return `<u>${text}</u>`
}

export function strikethrough(text: string): string {
  return `<s>${text}</s>`
}

export function spoiler(text: string): string {
  return `<span class="tg-spoiler">${text}</span>`
}

export function code(text: string): string {
  return `<code>${escapeHtml(text)}</code>`
}

export function codeBlock(text: string, language: string = ''): string {
  return `<pre>${escapeHtml(text)}</pre>`
}

export function link(text: string, url: string): string {
  return `<a href="${url}">${escapeHtml(text)}</a>`
}

export function blockquote(text: string): string {
  return `<blockquote>${text}</blockquote>`
}

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
}

function divider(): string {
  return '\n━━━━━━━━━━━━━━\n'
}

function header(emoji: string, title: string): string {
  return `${emoji} ${bold(title)}\n${divider()}`
}

function footer(): string {
  return `${divider()}\n🕐 ${italic(timestamp())}`
}

export function successCard(opts: {
  title?: string
  items?: { label: string; value: string }[]
  footer?: string
}): string {
  let msg = `✅ ${bold(opts.title || 'ACTION COMPLETED')}\n${divider()}`
  if (opts.items) {
    for (const item of opts.items) {
      msg += `\n${bold(item.label)}:\n${item.value}`
    }
  }
  msg += `\n${divider()}\n🕐 ${italic(timestamp())}`
  return msg
}

export function errorCard(opts: {
  title?: string
  reason: string
  reference?: string
}): string {
  let msg = `❌ ${bold(opts.title || 'ACTION FAILED')}\n${divider()}`
  msg += `\n${bold('Reason')}:\n${opts.reason}`
  if (opts.reference) {
    msg += `\n\n${bold('Reference')}:\n${code(opts.reference)}`
  }
  msg += `\n${divider()}\n🕐 ${italic(timestamp())}`
  return msg
}

export function warningCard(opts: {
  title?: string
  message: string
}): string {
  let msg = `⚠️ ${bold(opts.title || 'WARNING')}\n${divider()}`
  msg += `\n${opts.message}`
  msg += `\n${divider()}\n🕐 ${italic(timestamp())}`
  return msg
}

export function infoCard(opts: {
  title?: string
  message: string
}): string {
  let msg = `ℹ️ ${bold(opts.title || 'INFORMATION')}\n${divider()}`
  msg += `\n${opts.message}`
  msg += `\n${divider()}\n🕐 ${italic(timestamp())}`
  return msg
}

export function section(emoji: string, title: string, content: string): string {
  return `${emoji} ${bold(title)}\n${content}\n`
}

export function userCard(opts: {
  id: string | number
  username?: string
  status?: string
  role?: string
  trustScore?: number
  extra?: { label: string; value: string }[]
}): string {
  let msg = `${bold('👤 USER PROFILE')}\n${divider()}`
  msg += `\n${bold('ID')}:\n${code(String(opts.id))}`
  if (opts.username) msg += `\n\n${bold('Username')}:\n@${escapeHtml(opts.username)}`
  if (opts.status) msg += `\n\n${bold('Status')}:\n${opts.status}`
  if (opts.role) msg += `\n\n${bold('Role')}:\n${opts.role}`
  if (opts.trustScore !== undefined) msg += `\n\n${bold('Trust Score')}:\n${opts.trustScore}`
  if (opts.extra) {
    for (const item of opts.extra) {
      msg += `\n\n${bold(item.label)}:\n${item.value}`
    }
  }
  msg += `\n${divider()}\n🕐 ${italic(timestamp())}`
  return msg
}

export function ticketCard(opts: {
  id: string
  subject: string
  status: string
  priority: string
  assignee?: string
  extra?: { label: string; value: string }[]
}): string {
  let msg = `${bold('🎫 TICKET')}\n${divider()}`
  msg += `\n${bold('ID')}:\n${code(opts.id)}`
  msg += `\n\n${bold('Subject')}:\n${escapeHtml(opts.subject)}`
  msg += `\n\n${bold('Status')}:\n${opts.status}`
  msg += `\n\n${bold('Priority')}:\n${opts.priority}`
  if (opts.assignee) msg += `\n\n${bold('Assignee')}:\n${code(opts.assignee)}`
  if (opts.extra) {
    for (const item of opts.extra) {
      msg += `\n\n${bold(item.label)}:\n${item.value}`
    }
  }
  msg += `\n${divider()}\n🕐 ${italic(timestamp())}`
  return msg
}

export function caseCard(opts: {
  id: string
  title: string
  status: string
  assignee?: string
  extra?: { label: string; value: string }[]
}): string {
  let msg = `${bold('📁 CASE')}\n${divider()}`
  msg += `\n${bold('ID')}:\n${code(opts.id)}`
  msg += `\n\n${bold('Title')}:\n${escapeHtml(opts.title)}`
  msg += `\n\n${bold('Status')}:\n${opts.status}`
  if (opts.assignee) msg += `\n\n${bold('Assignee')}:\n${code(opts.assignee)}`
  if (opts.extra) {
    for (const item of opts.extra) {
      msg += `\n\n${bold(item.label)}:\n${item.value}`
    }
  }
  msg += `\n${divider()}\n🕐 ${italic(timestamp())}`
  return msg
}

export function incidentCard(opts: {
  id: string
  title: string
  status: string
  priority: string
  severity: string
  assignee?: string | null
  extra?: { label: string; value: string }[]
}): string {
  let msg = `${bold('🚨 INCIDENT')}\n${divider()}`
  msg += `\n${bold('ID')}:\n${code(opts.id)}`
  msg += `\n\n${bold('Title')}:\n${escapeHtml(opts.title)}`
  msg += `\n\n${bold('Status')}:\n${opts.status}`
  msg += `\n\n${bold('Priority')}:\n${opts.priority}`
  msg += `\n\n${bold('Severity')}:\n${opts.severity}`
  if (opts.assignee) msg += `\n\n${bold('Assignee')}:\n${code(opts.assignee)}`
  if (opts.extra) {
    for (const item of opts.extra) {
      msg += `\n\n${bold(item.label)}:\n${item.value}`
    }
  }
  msg += `\n${divider()}\n🕐 ${italic(timestamp())}`
  return msg
}

export function premiumCard(opts: {
  plan: string
  tier: string
  price: string
  features: string[]
  extra?: { label: string; value: string }[]
}): string {
  let msg = `${bold('💎 PREMIUM PLAN')}\n${divider()}`
  msg += `\n${bold('Plan')}:\n${escapeHtml(opts.plan)}`
  msg += `\n\n${bold('Tier')}:\n${opts.tier}`
  msg += `\n\n${bold('Price')}:\n${opts.price}`
  msg += `\n\n${bold('Features')}:\n${opts.features.map(f => `• ${escapeHtml(f)}`).join('\n')}`
  if (opts.extra) {
    for (const item of opts.extra) {
      msg += `\n\n${bold(item.label)}:\n${item.value}`
    }
  }
  msg += `\n${divider()}\n🕐 ${italic(timestamp())}`
  return msg
}

export function economyCard(opts: {
  type: string
  amount: string
  user: string
  balance?: string
  extra?: { label: string; value: string }[]
}): string {
  let msg = `${bold('💰 ECONOMY')}\n${divider()}`
  msg += `\n${bold('Type')}:\n${opts.type}`
  msg += `\n\n${bold('Amount')}:\n${opts.amount}`
  msg += `\n\n${bold('User')}:\n${escapeHtml(opts.user)}`
  if (opts.balance) msg += `\n\n${bold('Balance')}:\n${opts.balance}`
  if (opts.extra) {
    for (const item of opts.extra) {
      msg += `\n\n${bold(item.label)}:\n${item.value}`
    }
  }
  msg += `\n${divider()}\n🕐 ${italic(timestamp())}`
  return msg
}

export function systemStatusCard(opts: {
  components: { name: string; status: 'up' | 'down' | 'degraded' }[]
  uptime?: string
  responseTime?: string
  lastSync?: string
}): string {
  const icons: Record<string, string> = { up: '🟢', down: '🔴', degraded: '🟡' }
  let msg = `${bold('⚙ SYSTEM STATUS')}\n${divider()}`
  for (const comp of opts.components) {
    msg += `\n${icons[comp.status] || '⚪'} ${bold(comp.name)}`
  }
  if (opts.uptime) msg += `\n\n${bold('Uptime')}:\n${opts.uptime}`
  if (opts.responseTime) msg += `\n\n${bold('Response Time')}:\n${opts.responseTime}`
  if (opts.lastSync) msg += `\n\n${bold('Last Sync')}:\n${opts.lastSync}`
  msg += `\n${divider()}\n🕐 ${italic(timestamp())}`
  return msg
}

export function dashboardCard(opts: {
  title?: string
  metrics: { label: string; value: string; trend?: 'up' | 'down' | 'stable' }[]
  footer?: string
}): string {
  const trends: Record<string, string> = { up: '📈', down: '📉', stable: '➡️' }
  let msg = `${bold(opts.title || '📊 DASHBOARD')}\n${divider()}`
  for (const m of opts.metrics) {
    const t = m.trend ? ` ${trends[m.trend] || ''}` : ''
    msg += `\n${bold(m.label)}:\n${m.value}${t}`
  }
  if (opts.footer) msg += `\n\n${italic(opts.footer)}`
  msg += `\n${divider()}\n🕐 ${italic(timestamp())}`
  return msg
}

export { divider, header, footer, timestamp }
