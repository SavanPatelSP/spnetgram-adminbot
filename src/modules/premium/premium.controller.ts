import { PremiumService } from './premium.service.js'
import { CreatePlanDto, UpdatePlanDto, CreateSubscriptionDto } from './premium.types.js'

const service = new PremiumService()

export const PremiumController = {
  async createPlan(req: { body: CreatePlanDto }) {
    const data = await service.createPlan(req.body)
    return { status: 201, body: data }
  },

  async getPlan(req: { params: { id: string } }) {
    const data = await service.findPlanById(req.params.id)
    return { status: 200, body: data }
  },

  async listPlans(req: { query: Record<string, string | undefined> }) {
    const activeOnly = req.query.activeOnly !== 'false'
    const data = await service.listPlans(activeOnly)
    return { status: 200, body: data }
  },

  async updatePlan(req: { params: { id: string }; body: UpdatePlanDto }) {
    const data = await service.updatePlan(req.params.id, req.body)
    return { status: 200, body: data }
  },

  async createSubscription(req: { body: CreateSubscriptionDto }) {
    const data = await service.createSubscription(req.body)
    return { status: 201, body: data }
  },

  async getSubscription(req: { params: { id: string } }) {
    const data = await service.findSubscriptionById(req.params.id)
    return { status: 200, body: data }
  },

  async listSubscriptions(req: { query: Record<string, string | undefined> }) {
    const data = await service.listSubscriptions(req.query.userId)
    return { status: 200, body: data }
  },

  async cancelSubscription(req: { params: { id: string } }) {
    const data = await service.cancelSubscription(req.params.id)
    return { status: 200, body: data }
  },

  async checkFeature(req: { params: { userId: string; feature: string } }) {
    const granted = await service.checkFeature(req.params.userId, req.params.feature)
    return { status: 200, body: { userId: req.params.userId, feature: req.params.feature, granted } }
  },

  async expireSubscriptions() {
    const data = await service.expireSubscriptions()
    return { status: 200, body: data }
  },
}
