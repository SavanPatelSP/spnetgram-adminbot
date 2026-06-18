import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError, ValidationError, ConflictError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { CreateApprovalRequestDto, ApproveStepDto, RejectStepDto, RequestInfoDto, ApprovalRequestStatusName } from './approvals.types.js'
import { ApprovalEvents } from './approvals.events.js'
import { SyncPublishers } from '@modules/sync/sync.publishers.js'
import { generateId, generateReference } from '../../shared/utils/id.js'

export class ApprovalsService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async createRequest(dto: CreateApprovalRequestDto) {
    const requester = await this.prisma.user.findUnique({ where: { id: dto.requesterId } })
    if (!requester) throw new NotFoundError('User', dto.requesterId)

    if (!dto.steps || dto.steps.length === 0) {
      throw new ValidationError('At least one approval step is required')
    }

    const id = generateId()
    const ref = generateReference('APPR')

    const request = await this.prisma.approvalRequest.create({
      data: {
        id,
        referenceId: ref,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'NORMAL',
        requesterId: dto.requesterId,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        payload: (dto.payload ?? {}) as any,
        reason: dto.reason,
        steps: {
          create: dto.steps.map(s => ({
            stepOrder: s.stepOrder,
            approverId: s.approverId,
            roleRequired: s.roleRequired,
          })),
        },
      },
      include: { steps: true, requester: true },
    })

    logger.info({ requestId: id, referenceId: ref, resourceType: dto.resourceType }, 'Approval request created')
    await ApprovalEvents.requestCreated(id, ref, dto.requesterId, dto.resourceType)
    return request
  }

  async findById(id: string) {
    const request = await this.prisma.approvalRequest.findUnique({
      where: { id },
      include: { steps: true, requester: true },
    })
    if (!request) throw new NotFoundError('ApprovalRequest', id)
    return request
  }

  async findByReferenceId(referenceId: string) {
    const request = await this.prisma.approvalRequest.findUnique({
      where: { referenceId },
      include: { steps: true, requester: true },
    })
    if (!request) throw new NotFoundError('ApprovalRequest', referenceId)
    return request
  }

  async findMany(params: { status?: ApprovalRequestStatusName; requesterId?: string; resourceType?: string; page?: number; limit?: number }) {
    const { status, requesterId, resourceType, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (requesterId) where.requesterId = requesterId
    if (resourceType) where.resourceType = resourceType

    const [items, total] = await Promise.all([
      this.prisma.approvalRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { steps: true, requester: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.approvalRequest.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getPendingForApprover(userId: string) {
    return this.prisma.approvalRequest.findMany({
      where: {
        status: 'PENDING',
        steps: {
          some: {
            approverId: userId,
            status: 'PENDING',
          },
        },
      },
      include: { steps: { where: { approverId: userId, status: 'PENDING' } }, requester: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async approveStep(dto: ApproveStepDto) {
    const step = await this.prisma.approvalStep.findUnique({
      where: { id: dto.stepId },
      include: { request: true },
    })
    if (!step) throw new NotFoundError('ApprovalStep', dto.stepId)
    if (step.status !== 'PENDING') throw new ConflictError('Step already processed')
    if (step.request.status !== 'PENDING') throw new ConflictError('Request is no longer pending')

    await this.prisma.approvalStep.update({
      where: { id: dto.stepId },
      data: { status: 'APPROVED', comment: dto.comment, respondedAt: new Date() },
    })

    logger.info({ stepId: dto.stepId, requestId: step.requestId, approverId: dto.approverId }, 'Approval step approved')
    await ApprovalEvents.stepCompleted(dto.stepId, step.requestId, 'APPROVED')

    await this.checkRequestResolution(step.requestId)
  }

  async rejectStep(dto: RejectStepDto) {
    const step = await this.prisma.approvalStep.findUnique({
      where: { id: dto.stepId },
      include: { request: true },
    })
    if (!step) throw new NotFoundError('ApprovalStep', dto.stepId)
    if (step.status !== 'PENDING') throw new ConflictError('Step already processed')
    if (step.request.status !== 'PENDING') throw new ConflictError('Request is no longer pending')

    await this.prisma.approvalStep.update({
      where: { id: dto.stepId },
      data: { status: 'REJECTED', comment: dto.comment, respondedAt: new Date() },
    })

    await this.prisma.approvalRequest.update({
      where: { id: step.requestId },
      data: { status: 'REJECTED', resolvedAt: new Date() },
    })

    logger.info({ stepId: dto.stepId, requestId: step.requestId, approverId: dto.approverId }, 'Approval step rejected')
    await ApprovalEvents.stepCompleted(dto.stepId, step.requestId, 'REJECTED')
    await ApprovalEvents.requestResolved(step.requestId, 'REJECTED')
    SyncPublishers.publishApprovalRejected(step.requestId, step.request.referenceId, dto.approverId, step.request.resourceType ?? 'GENERAL', dto.comment)
  }

  async requestInfo(dto: RequestInfoDto) {
    const step = await this.prisma.approvalStep.findUnique({
      where: { id: dto.stepId },
      include: { request: true },
    })
    if (!step) throw new NotFoundError('ApprovalStep', dto.stepId)
    if (step.status !== 'PENDING') throw new ConflictError('Step already processed')

    await this.prisma.approvalStep.update({
      where: { id: dto.stepId },
      data: { status: 'REQUIRE_INFO', comment: dto.comment, respondedAt: new Date() },
    })

    await this.prisma.approvalRequest.update({
      where: { id: step.requestId },
      data: { status: 'REQUIRE_INFO' },
    })

    logger.info({ stepId: dto.stepId, requestId: step.requestId }, 'Information requested on approval step')
  }

  private async checkRequestResolution(requestId: string) {
    const request = await this.prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: { steps: true },
    })
    if (!request) return

    const allSteps = request.steps
    const pendingSteps = allSteps.filter(s => s.status === 'PENDING')
    const approvedSteps = allSteps.filter(s => s.status === 'APPROVED')

    if (pendingSteps.length === 0 && approvedSteps.length === allSteps.length) {
      await this.prisma.approvalRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', resolvedAt: new Date() },
      })
      logger.info({ requestId }, 'Approval request fully approved')
      await ApprovalEvents.requestResolved(requestId, 'APPROVED')
      const firstApprover = allSteps.find(s => s.approverId)
      if (firstApprover && firstApprover.approverId && request) {
        SyncPublishers.publishApprovalApproved(requestId, request.referenceId, firstApprover.approverId, request.resourceType ?? 'GENERAL')
      }
    }
  }

  async cancelRequest(requestId: string, userId: string) {
    const request = await this.findById(requestId)
    if (request.requesterId !== userId) throw new ValidationError('Only the requester can cancel')
    if (request.status !== 'PENDING' && request.status !== 'REQUIRE_INFO') {
      throw new ConflictError('Request cannot be cancelled')
    }

    await this.prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED', resolvedAt: new Date() },
    })

    logger.info({ requestId }, 'Approval request cancelled')
    await ApprovalEvents.requestResolved(requestId, 'CANCELLED')
  }
}
