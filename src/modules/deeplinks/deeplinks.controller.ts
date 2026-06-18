import { DeepLinkService } from './deeplinks.service.js'
import { CreateDeepLinkDto, DeepLinkQueryParams, GenerateDeepLinkDto } from './deeplinks.types.js'

const service = new DeepLinkService()

export const DeepLinkController = {
  async createLink(req: { body: CreateDeepLinkDto }) {
    const data = await service.createLink(req.body)
    return { status: 201, body: data }
  },

  async getLink(req: { params: { id: string } }) {
    const data = await service.getLink(req.params.id)
    return { status: 200, body: data }
  },

  async getByCode(req: { params: { code: string } }) {
    const data = await service.getLinkByCode(req.params.code)
    return { status: 200, body: data }
  },

  async resolve(req: { params: { code: string } }) {
    const data = await service.resolveLink(req.params.code)
    return { status: 200, body: data }
  },

  async listLinks(req: { query: Record<string, string | undefined> }) {
    const data = await service.listLinks({
      targetModule: req.query.targetModule,
      targetId: req.query.targetId,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async deactivate(req: { params: { id: string } }) {
    const data = await service.deactivateLink(req.params.id)
    return { status: 200, body: data }
  },
}
