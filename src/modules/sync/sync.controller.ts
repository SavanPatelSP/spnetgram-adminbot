import { SyncService } from './sync.service.js'
import { CreateSyncEventDto, SyncEventQueryParams, UpdateSyncEventDto } from './sync.types.js'

const service = new SyncService()

export const SyncController = {
  async createEvent(req: { body: CreateSyncEventDto }) {
    const data = await service.createEvent(req.body)
    return { status: 201, body: data }
  },

  async getEvent(req: { params: { id: string } }) {
    const data = await service.getEvent(req.params.id)
    return { status: 200, body: data }
  },

  async list(req: { query: Record<string, string | undefined> }) {
    const data = await service.queryEvents({
      status: req.query.status,
      eventType: req.query.eventType,
      entityType: req.query.entityType,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async update(req: { params: { id: string }; body: UpdateSyncEventDto }) {
    const data = await service.updateEvent(req.params.id, req.body)
    return { status: 200, body: data }
  },

  async markProcessed(req: { params: { id: string } }) {
    const data = await service.markProcessed(req.params.id)
    return { status: 200, body: data }
  },

  async markFailed(req: { params: { id: string }; body: { error: string } }) {
    const data = await service.markFailed(req.params.id, req.body.error)
    return { status: 200, body: data }
  },

  async pendingEvents(req: { query: { limit?: string } }) {
    const data = await service.getPendingEvents(req.query.limit ? Number(req.query.limit) : undefined)
    return { status: 200, body: data }
  },

  async failedEvents(req: { query: { retryCountMax?: string; limit?: string } }) {
    const data = await service.getFailedEvents(
      req.query.retryCountMax ? Number(req.query.retryCountMax) : undefined,
      req.query.limit ? Number(req.query.limit) : undefined,
    )
    return { status: 200, body: data }
  },
}
