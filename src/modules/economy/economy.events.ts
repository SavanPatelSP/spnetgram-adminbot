import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const EconomyEvents = {
  transactionCreated(transactionId: string, accountId: string, type: string, amount: number) {
    return eventBus.emit('transaction:created', { transactionId, accountId, type, amount })
  },

  accountFrozen(accountId: string, userId: string) {
    return eventBus.emit('account:frozen', { accountId, userId })
  },

  accountUnfrozen(accountId: string, userId: string) {
    return eventBus.emit('account:unfrozen', { accountId, userId })
  },
}
