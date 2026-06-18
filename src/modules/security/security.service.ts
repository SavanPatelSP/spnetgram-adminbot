import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError, ValidationError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { RecordSecurityEventDto, SecurityQueryParams, CreateDeviceSessionDto, CreateLoginHistoryDto } from './security.types.js'
import { SecurityEvents } from './security.events.js'

export class SecurityService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async recordEvent(dto: RecordSecurityEventDto) {
    if (!dto.eventType || !dto.severity) {
      throw new ValidationError('eventType and severity are required')
    }

    const event = await this.prisma.securityEvent.create({
      data: {
        userId: dto.userId,
        eventType: dto.eventType as any,
        severity: dto.severity as any,
        source: dto.source,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        location: dto.location as any,
        description: dto.description,
      },
    })

    logger.info({ eventId: event.id, eventType: event.eventType, severity: event.severity }, 'Security event recorded')
    await SecurityEvents.created(event.id, event.eventType, event.userId ?? undefined, event.severity)
    return event
  }

  async queryEvents(params: SecurityQueryParams) {
    const { userId, eventType, severity, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (eventType) where.eventType = eventType
    if (severity) where.severity = severity

    const [items, total] = await Promise.all([
      this.prisma.securityEvent.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.securityEvent.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getEventById(id: string) {
    const event = await this.prisma.securityEvent.findUnique({ where: { id } })
    if (!event) throw new NotFoundError('SecurityEvent', id)
    return event
  }

  async registerDeviceSession(dto: CreateDeviceSessionDto) {
    if (!dto.userId) throw new ValidationError('userId is required')

    const session = await this.prisma.deviceSession.create({
      data: {
        userId: dto.userId,
        deviceId: dto.deviceId,
        deviceName: dto.deviceName,
        deviceType: dto.deviceType,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      },
    })

    logger.info({ sessionId: session.id, userId: dto.userId }, 'Device session registered')
    return session
  }

  async deactivateDeviceSession(sessionId: string) {
    const existing = await this.prisma.deviceSession.findUnique({ where: { id: sessionId } })
    if (!existing) throw new NotFoundError('DeviceSession', sessionId)

    const session = await this.prisma.deviceSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    })

    logger.info({ sessionId }, 'Device session deactivated')
    return session
  }

  async listSessionsByUser(userId: string) {
    return this.prisma.deviceSession.findMany({
      where: { userId },
      orderBy: { lastActive: 'desc' },
    })
  }

  async recordLogin(dto: CreateLoginHistoryDto) {
    const login = await this.prisma.loginHistory.create({
      data: {
        userId: dto.userId,
        staffId: dto.staffId,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        success: dto.success ?? true,
        failReason: dto.failReason,
      },
    })

    if (!login.success) {
      logger.warn({ loginId: login.id, userId: dto.userId, reason: dto.failReason }, 'Failed login recorded')
    }

    return login
  }

  async getLoginHistory(params: { userId?: string; page?: number; limit?: number }) {
    const { userId, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId

    const [items, total] = await Promise.all([
      this.prisma.loginHistory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.loginHistory.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getRecentFailedLogins(thresholdMinutes = 30) {
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000)
    return this.prisma.loginHistory.findMany({
      where: {
        success: false,
        timestamp: { gte: threshold },
      },
      orderBy: { timestamp: 'desc' },
    })
  }
}
