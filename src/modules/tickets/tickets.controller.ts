import { TicketsService } from './tickets.service.js'
import { CreateTicketDto, UpdateTicketDto, TicketReplyDto } from './tickets.types.js'

const service = new TicketsService()

export const TicketsController = {
  async create(req: { body: CreateTicketDto }) {
    const data = await service.create(req.body)
    return { status: 201, body: data }
  },

  async getById(req: { params: { id: string } }) {
    const data = await service.findById(req.params.id)
    return { status: 200, body: data }
  },

  async list(req: { query: Record<string, string | undefined> }) {
    const data = await service.findMany({
      status: req.query.status as any,
      priority: req.query.priority as any,
      assigneeId: req.query.assigneeId,
      reporterId: req.query.reporterId,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async update(req: { params: { id: string }; body: UpdateTicketDto }) {
    const data = await service.update(req.params.id, req.body)
    return { status: 200, body: data }
  },

  async assign(req: { body: { ticketId: string; assigneeId: string; assignedBy: string } }) {
    const { ticketId, assigneeId, assignedBy } = req.body
    const data = await service.assign(ticketId, assigneeId, assignedBy)
    return { status: 200, body: data }
  },

  async transitionStatus(req: { body: { ticketId: string; status: string; changedBy: string; reason?: string } }) {
    const { ticketId, status, changedBy, reason } = req.body
    const data = await service.transitionStatus(ticketId, status as any, changedBy, reason)
    return { status: 200, body: data }
  },

  async addReply(req: { body: TicketReplyDto }) {
    const data = await service.addReply(req.body)
    return { status: 201, body: data }
  },
}
