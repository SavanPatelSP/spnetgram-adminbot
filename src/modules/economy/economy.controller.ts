import { EconomyService } from './economy.service.js'
import { CreateTransactionDto, TransferDto } from './economy.types.js'

const service = new EconomyService()

export const EconomyController = {
  async ensureAccount(req: { params: { userId: string } }) {
    const data = await service.ensureAccount(req.params.userId)
    return { status: 200, body: data }
  },

  async getAccount(req: { params: { userId: string } }) {
    const data = await service.getAccount(req.params.userId)
    return { status: 200, body: data }
  },

  async getAccountById(req: { params: { id: string } }) {
    const data = await service.getAccountById(req.params.id)
    return { status: 200, body: data }
  },

  async createTransaction(req: { body: CreateTransactionDto }) {
    const data = await service.createTransaction(req.body)
    return { status: 201, body: data }
  },

  async transfer(req: { body: TransferDto }) {
    const data = await service.transfer(req.body)
    return { status: 200, body: data }
  },

  async getBalance(req: { params: { userId: string } }) {
    const data = await service.getBalance(req.params.userId)
    return { status: 200, body: data }
  },

  async listTransactions(req: { params: { accountId: string }; query: Record<string, string | undefined> }) {
    const data = await service.listTransactions(req.params.accountId, {
      type: req.query.type as any,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async freezeAccount(req: { params: { id: string } }) {
    const data = await service.freezeAccount(req.params.id)
    return { status: 200, body: data }
  },

  async unfreezeAccount(req: { params: { id: string } }) {
    const data = await service.unfreezeAccount(req.params.id)
    return { status: 200, body: data }
  },
}
