import { ModerationService } from './moderation.service.js'
import { CreateModerationDto, ModerationFilter } from './moderation.types.js'

const service = new ModerationService()

interface HandlerResponse {
  status: number
  body: Record<string, unknown>
}

function ok(data: unknown): HandlerResponse {
  return { status: 200, body: { success: true, data } }
}

function created(data: unknown): HandlerResponse {
  return { status: 201, body: { success: true, data } }
}

function notFound(message: string): HandlerResponse {
  return { status: 404, body: { success: false, error: message } }
}

function badRequest(message: string): HandlerResponse {
  return { status: 400, body: { success: false, error: message } }
}

export const ModerationController = {
  async create(params: CreateModerationDto): Promise<HandlerResponse> {
    try {
      const action = await service.create(params)
      return created(action)
    } catch (e) {
      const err = e as Error
      if (err.message.includes('not found')) return notFound(err.message)
      return badRequest(err.message)
    }
  },

  async getById(params: { id: string }): Promise<HandlerResponse> {
    try {
      const action = await service.findById(params.id)
      return ok(action)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async list(params: ModerationFilter): Promise<HandlerResponse> {
    const actions = await service.list(params)
    return ok(actions)
  },

  async listByTarget(params: { targetId: string }): Promise<HandlerResponse> {
    const actions = await service.listByTarget(params.targetId)
    return ok(actions)
  },

  async listByModerator(params: { moderatorId: string }): Promise<HandlerResponse> {
    const actions = await service.listByModerator(params.moderatorId)
    return ok(actions)
  },

  async getTargetSummary(params: { targetId: string }): Promise<HandlerResponse> {
    const summary = await service.getTargetSummary(params.targetId)
    return ok(summary)
  },
}
