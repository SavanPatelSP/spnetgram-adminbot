import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError, ConflictError, ValidationError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { CreateServiceStatusDto, UpdateServiceStatusDto, ServiceQueryParams, CreateMonitoringAlertDto, AlertQueryParams } from './monitoring.types.js'
import { MonitoringEvents } from './monitoring.events.js'

export class MonitoringService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async upsertService(dto: CreateServiceStatusDto) {
    if (!dto.name) throw new ValidationError('name is required')

    const existing = await this.prisma.serviceStatus.findUnique({ where: { name: dto.name } })
    const previousStatus = existing?.status ?? 'UNKNOWN'

    const service = await this.prisma.serviceStatus.upsert({
      where: { name: dto.name },
      create: {
        name: dto.name,
        displayName: dto.displayName,
        type: dto.type,
        status: dto.status ?? 'UNKNOWN',
        metric: dto.metric as any,
        value: dto.value,
        unit: dto.unit,
        message: dto.message,
      },
      update: {
        displayName: dto.displayName,
        type: dto.type,
        status: dto.status,
        metric: dto.metric as any,
        value: dto.value,
        unit: dto.unit,
        message: dto.message,
      },
    })

    if (service.status !== previousStatus) {
      logger.info({ serviceId: service.id, name: service.name, previousStatus, newStatus: service.status }, 'Service status changed')
      await MonitoringEvents.statusChanged(service.id, service.name, previousStatus, service.status)
    }

    return service
  }

  async getService(id: string) {
    const service = await this.prisma.serviceStatus.findUnique({ where: { id } })
    if (!service) throw new NotFoundError('ServiceStatus', id)
    return service
  }

  async listServices(params: ServiceQueryParams) {
    const { status, isUp, type, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (isUp !== undefined) where.isUp = isUp
    if (type) where.type = type

    const [items, total] = await Promise.all([
      this.prisma.serviceStatus.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.serviceStatus.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async updateServiceStatus(id: string, dto: UpdateServiceStatusDto) {
    const existing = await this.getService(id)
    const previousStatus = existing.status

    const service = await this.prisma.serviceStatus.update({
      where: { id },
      data: {
        status: dto.status,
        message: dto.message,
        isUp: dto.isUp,
        lastChecked: new Date(),
      },
    })

    if (service.status !== previousStatus) {
      logger.info({ serviceId: id, name: service.name, previousStatus, newStatus: service.status }, 'Service status updated')
      await MonitoringEvents.statusChanged(id, service.name, previousStatus, service.status)
    }

    return service
  }

  async triggerAlert(dto: CreateMonitoringAlertDto) {
    if (!dto.type) throw new ValidationError('type is required')

    const alert = await this.prisma.monitoringAlert.create({
      data: {
        serviceId: dto.serviceId,
        type: dto.type,
        severity: dto.severity ?? 'WARNING',
        metric: dto.metric,
        value: dto.value,
        threshold: dto.threshold,
        message: dto.message,
      },
    })

    logger.info({ alertId: alert.id, type: alert.type, severity: alert.severity }, 'Monitoring alert triggered')
    await MonitoringEvents.alertTriggered(alert.id, alert.serviceId ?? undefined, alert.severity, alert.message ?? '')
    return alert
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string) {
    const existing = await this.prisma.monitoringAlert.findUnique({ where: { id: alertId } })
    if (!existing) throw new NotFoundError('MonitoringAlert', alertId)

    const alert = await this.prisma.monitoringAlert.update({
      where: { id: alertId },
      data: { acknowledged: true, acknowledgedBy },
    })

    logger.info({ alertId, acknowledgedBy }, 'Monitoring alert acknowledged')
    await MonitoringEvents.alertAcknowledged(alertId, acknowledgedBy)
    return alert
  }

  async listAlerts(params: AlertQueryParams) {
    const { serviceId, severity, acknowledged, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}
    if (serviceId) where.serviceId = serviceId
    if (severity) where.severity = severity
    if (acknowledged !== undefined) where.acknowledged = acknowledged

    const [items, total] = await Promise.all([
      this.prisma.monitoringAlert.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.monitoringAlert.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getAlertById(id: string) {
    const alert = await this.prisma.monitoringAlert.findUnique({ where: { id } })
    if (!alert) throw new NotFoundError('MonitoringAlert', id)
    return alert
  }

  async getServicesByStatus(status: string) {
    return this.prisma.serviceStatus.findMany({
      where: { status },
      orderBy: { name: 'asc' },
    })
  }
}
