import { RedisService } from '../redis/redis.service.js'
import { logger } from '../logger/logger.js'

export class LockdownService {
  private readonly redis = RedisService.getInstance()
  private readonly LOCKDOWN_KEY = 'security:lockdown'
  private readonly EXEMPT_ROLES_KEY = 'security:lockdown:exempt'

  async activate(reason: string, initiatedBy: string): Promise<void> {
    await this.redis.set(this.LOCKDOWN_KEY, JSON.stringify({
      active: true,
      reason,
      initiatedBy,
      timestamp: new Date().toISOString(),
    }))
    logger.warn({ reason, initiatedBy }, 'EMERGENCY LOCKDOWN ACTIVATED')
  }

  async deactivate(initiatedBy: string): Promise<void> {
    await this.redis.del(this.LOCKDOWN_KEY)
    logger.warn({ initiatedBy }, 'EMERGENCY LOCKDOWN DEACTIVATED')
  }

  async isActive(): Promise<boolean> {
    const data = await this.redis.get<string>(this.LOCKDOWN_KEY)
    if (!data) return false
    return JSON.parse(data).active === true
  }

  async getStatus(): Promise<{ active: boolean; reason?: string; initiatedBy?: string; timestamp?: string } | null> {
    const data = await this.redis.get<string>(this.LOCKDOWN_KEY)
    if (!data) return null
    return JSON.parse(data)
  }

  async setExemptRoles(roles: string[]): Promise<void> {
    await this.redis.set(this.EXEMPT_ROLES_KEY, JSON.stringify(roles))
  }

  async getExemptRoles(): Promise<string[]> {
    const data = await this.redis.get<string>(this.EXEMPT_ROLES_KEY)
    return data ? JSON.parse(data) : ['OWNER', 'SUPER_ADMINISTRATOR']
  }

  async isRoleExempt(role: string): Promise<boolean> {
    const exempt = await this.getExemptRoles()
    return exempt.includes(role)
  }
}
