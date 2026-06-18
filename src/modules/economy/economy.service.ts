import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError, ValidationError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { CreateTransactionDto, TransferDto, TransactionTypeName } from './economy.types.js'
import { EconomyEvents } from './economy.events.js'
import { SyncPublishers } from '@modules/sync/sync.publishers.js'
import { generateId } from '../../shared/utils/id.js'

export class EconomyService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async ensureAccount(userId: string) {
    const existing = await this.prisma.economyAccount.findUnique({ where: { userId } })
    if (existing) return existing
    return this.prisma.economyAccount.create({
      data: { userId, balance: 0 },
    })
  }

  async getAccount(userId: string) {
    const account = await this.prisma.economyAccount.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
    })
    if (!account) throw new NotFoundError('EconomyAccount', userId)
    return account
  }

  async getAccountById(id: string) {
    const account = await this.prisma.economyAccount.findUnique({
      where: { id },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
    })
    if (!account) throw new NotFoundError('EconomyAccount', id)
    return account
  }

  async createTransaction(dto: CreateTransactionDto) {
    const account = await this.getAccountById(dto.accountId)
    if (account.frozen) throw new ValidationError('Account is frozen')

    const balanceBefore = Number(account.balance)

    let balanceAfter: number
    if (['CREDIT', 'REFUND', 'TRANSFER_IN', 'ADMIN_GRANT', 'REWARD'].includes(dto.type)) {
      balanceAfter = balanceBefore + dto.amount
    } else if (['DEBIT', 'TRANSFER_OUT', 'ADMIN_DEDUCT', 'PENALTY'].includes(dto.type)) {
      balanceAfter = balanceBefore - dto.amount
      if (balanceAfter < 0 && dto.type !== 'ADMIN_DEDUCT') {
        throw new ValidationError('Insufficient balance')
      }
    } else {
      throw new ValidationError(`Unknown transaction type: ${dto.type}`)
    }

    const id = generateId()
    const transaction = await this.prisma.transaction.create({
      data: {
        id,
        accountId: dto.accountId,
        type: dto.type as any,
        amount: dto.amount,
        description: dto.description,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        balanceBefore,
        balanceAfter,
        executedById: dto.executedById,
      },
    })

    await this.prisma.economyAccount.update({
      where: { id: dto.accountId },
      data: { balance: balanceAfter },
    })

    logger.info({ transactionId: id, accountId: dto.accountId, type: dto.type, amount: dto.amount }, 'Transaction created')
    await EconomyEvents.transactionCreated(id, dto.accountId, dto.type, dto.amount)

    const creditTypes = ['CREDIT', 'REFUND', 'TRANSFER_IN', 'REWARD']
    const coinCreditTypes = ['CREDIT', 'REFUND', 'TRANSFER_IN', 'REWARD']
    const coinDebitTypes = ['DEBIT', 'TRANSFER_OUT', 'PENALTY']

    if (dto.type === 'ADMIN_GRANT') {
      SyncPublishers.publishDiamondsCredited(id, dto.accountId, account.userId, dto.amount, balanceAfter, dto.description)
    } else if (dto.type === 'ADMIN_DEDUCT') {
      SyncPublishers.publishDiamondsDebited(id, dto.accountId, account.userId, dto.amount, balanceAfter, dto.description)
    } else if (creditTypes.includes(dto.type)) {
      SyncPublishers.publishCoinsCredited(id, dto.accountId, account.userId, dto.amount, balanceAfter, dto.description)
    } else if (coinDebitTypes.includes(dto.type)) {
      SyncPublishers.publishCoinsDebited(id, dto.accountId, account.userId, dto.amount, balanceAfter, dto.description)
    }

    return transaction
  }

  async transfer(dto: TransferDto) {
    if (dto.amount <= 0) throw new ValidationError('Transfer amount must be positive')
    if (dto.fromAccountId === dto.toAccountId) throw new ValidationError('Cannot transfer to same account')

    const fromAccount = await this.getAccountById(dto.fromAccountId)
    const toAccount = await this.getAccountById(dto.toAccountId)

    if (fromAccount.frozen) throw new ValidationError('Source account is frozen')
    if (toAccount.frozen) throw new ValidationError('Destination account is frozen')

    if (Number(fromAccount.balance) < dto.amount) throw new ValidationError('Insufficient balance')

    const fromBalanceBefore = Number(fromAccount.balance)
    const toBalanceBefore = Number(toAccount.balance)

    const fromId = generateId()
    const toId = generateId()

    const [fromTx, toTx] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          id: fromId,
          accountId: dto.fromAccountId,
          type: 'TRANSFER_OUT',
          amount: dto.amount,
          description: dto.description ?? 'Transfer',
          referenceType: 'TRANSFER',
          referenceId: toId,
          balanceBefore: fromBalanceBefore,
          balanceAfter: fromBalanceBefore - dto.amount,
        },
      }),
      this.prisma.transaction.create({
        data: {
          id: toId,
          accountId: dto.toAccountId,
          type: 'TRANSFER_IN',
          amount: dto.amount,
          description: dto.description ?? 'Transfer',
          referenceType: 'TRANSFER',
          referenceId: fromId,
          balanceBefore: toBalanceBefore,
          balanceAfter: toBalanceBefore + dto.amount,
        },
      }),
      this.prisma.economyAccount.update({
        where: { id: dto.fromAccountId },
        data: { balance: fromBalanceBefore - dto.amount },
      }),
      this.prisma.economyAccount.update({
        where: { id: dto.toAccountId },
        data: { balance: toBalanceBefore + dto.amount },
      }),
    ])

    logger.info({ fromAccount: dto.fromAccountId, toAccount: dto.toAccountId, amount: dto.amount }, 'Transfer completed')
    await EconomyEvents.transactionCreated(fromId, dto.fromAccountId, 'TRANSFER_OUT', dto.amount)
    await EconomyEvents.transactionCreated(toId, dto.toAccountId, 'TRANSFER_IN', dto.amount)
    return { fromTx, toTx }
  }

  async listTransactions(accountId: string, params: { type?: TransactionTypeName; page?: number; limit?: number }) {
    const { type, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = { accountId }
    if (type) where.type = type

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getBalance(userId: string) {
    const account = await this.prisma.economyAccount.findUnique({ where: { userId } })
    if (!account) return { userId, balance: 0, frozen: false }
    return { userId, balance: Number(account.balance), frozen: account.frozen }
  }

  async freezeAccount(accountId: string) {
    const account = await this.getAccountById(accountId)
    const updated = await this.prisma.economyAccount.update({
      where: { id: accountId },
      data: { frozen: true },
    })
    logger.info({ accountId }, 'Account frozen')
    await EconomyEvents.accountFrozen(accountId, account.userId)
    return updated
  }

  async unfreezeAccount(accountId: string) {
    await this.getAccountById(accountId)
    const updated = await this.prisma.economyAccount.update({
      where: { id: accountId },
      data: { frozen: false },
    })
    logger.info({ accountId }, 'Account unfrozen')
    await EconomyEvents.accountUnfrozen(accountId, updated.userId)
    return updated
  }
}
