import type { IncomingMessage, ServerResponse } from 'node:http'
import { RateLimiterService } from '../../infrastructure/security/rate-limiter.service.js'
import { IpReputationService } from '../../infrastructure/security/ip-reputation.service.js'
import { LockdownService } from '../../infrastructure/security/lockdown.service.js'
import { AuthService } from '../../infrastructure/auth/auth.service.js'
import { logger } from '../../infrastructure/logger/logger.js'

const rateLimiter = new RateLimiterService()
const ipReputation = new IpReputationService()
const lockdown = new LockdownService()
const authService = new AuthService()

export async function securityGuard(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const ip = req.socket.remoteAddress || 'unknown'
  const userAgent = req.headers['user-agent'] || 'unknown'

  const ipCheck = await ipReputation.check(ip)
  if (!ipCheck.allowed) {
    res.statusCode = 429
    res.end(JSON.stringify({ error: ipCheck.reason, code: 'IP_BLOCKED' }))
    return false
  }

  const path = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname
  const tier = path.startsWith('/api/auth') ? 'auth'
    : path.startsWith('/api/governance') ? 'sensitive'
    : 'api'

  const rateKey = `${ip}:${path}`
  const rateCheck = await rateLimiter.check(rateKey, tier)
  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)))
    res.statusCode = 429
    res.end(JSON.stringify({ error: 'Too many requests', code: 'RATE_LIMITED', resetAt: rateCheck.resetAt }))
    return false
  }

  if (await lockdown.isActive()) {
    const staffId = (req as any).staffId
    const role = (req as any).role
    if (staffId && role && !(await lockdown.isRoleExempt(role))) {
      res.statusCode = 503
      res.end(JSON.stringify({
        error: 'System is in emergency lockdown. Only exempt roles can perform actions.',
        code: 'LOCKDOWN',
      }))
      return false
    }
  }

  ;(req as any).recordIpAttempt = async (success: boolean) => {
    await ipReputation.recordAttempt(ip, success)
  }

  ;(req as any).rateLimitReset = async () => {
    await rateLimiter.reset(rateKey)
  }

  return true
}
