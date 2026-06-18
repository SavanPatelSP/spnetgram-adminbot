import { UsersService } from './users.service.js'
import { UpsertTelegramUserDto, UserIntelligenceDto } from './users.types.js'

const service = new UsersService()

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

export const UsersController = {
  async getById(params: { id: string }): Promise<HandlerResponse> {
    try {
      const user = await service.findById(params.id)
      return ok(user)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async getByTelegramId(params: { telegramId: bigint }): Promise<HandlerResponse> {
    const user = await service.findByTelegramId(params.telegramId)
    if (!user) return notFound('User not found')
    return ok(user)
  },

  async upsert(params: UpsertTelegramUserDto): Promise<HandlerResponse> {
    const user = await service.upsertByTelegram(params)
    return created(user)
  },

  async updateStatus(params: { id: string; status: Parameters<typeof service.updateStatus>[1] }): Promise<HandlerResponse> {
    try {
      const user = await service.updateStatus(params.id, params.status)
      return ok(user)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async updateIntelligence(params: { id: string } & UserIntelligenceDto): Promise<HandlerResponse> {
    try {
      const user = await service.updateIntelligence(params.id, {
        trustScore: params.trustScore,
        riskScore: params.riskScore,
        reputationScore: params.reputationScore,
        warningCount: params.warningCount,
      })
      return ok(user)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async list(params: { ids?: string[] }): Promise<HandlerResponse> {
    const users = await service.list(params.ids)
    return ok(users)
  },

  async search(params: { query: string }): Promise<HandlerResponse> {
    const users = await service.search(params.query)
    return ok(users)
  },
}
