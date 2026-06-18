import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const SyncPublishers = {
  publishStaffPromoted(staffId: string, userId: string, previousRole: string, newRole: string): void {
    eventBus.emit('staff:promoted', { staffId, userId, newRole, previousRole }).catch(() => {})
  },

  publishStaffDemoted(staffId: string, userId: string, previousRole: string, newRole: string): void {
    eventBus.emit('staff:demoted', { staffId, userId, newRole, previousRole }).catch(() => {})
  },

  publishStaffSuspended(staffId: string, userId: string, reason?: string): void {
    eventBus.emit('staff:suspended', { staffId, userId, reason }).catch(() => {})
  },

  publishCaseClosed(caseId: string, closedBy: string, reason?: string): void {
    eventBus.emit('case:closed', { caseId, closedBy, reason }).catch(() => {})
  },

  publishTicketClosed(ticketId: string, closedBy: string, reason?: string): void {
    eventBus.emit('ticket:closed', { ticketId, closedBy, reason }).catch(() => {})
  },

  publishPremiumGranted(subscriptionId: string, userId: string, planId: string, durationDays: number): void {
    eventBus.emit('premium:granted', { subscriptionId, userId, planId, durationDays }).catch(() => {})
  },

  publishPremiumRemoved(subscriptionId: string, userId: string, planId: string, reason?: string): void {
    eventBus.emit('premium:removed', { subscriptionId, userId, planId, reason }).catch(() => {})
  },

  publishCoinsCredited(transactionId: string, accountId: string, userId: string, amount: number, balance: number, reason?: string): void {
    eventBus.emit('economy:coins:credited', { transactionId, accountId, userId, amount, balance, reason }).catch(() => {})
  },

  publishCoinsDebited(transactionId: string, accountId: string, userId: string, amount: number, balance: number, reason?: string): void {
    eventBus.emit('economy:coins:debited', { transactionId, accountId, userId, amount, balance, reason }).catch(() => {})
  },

  publishDiamondsCredited(transactionId: string, accountId: string, userId: string, amount: number, balance: number, reason?: string): void {
    eventBus.emit('economy:diamonds:credited', { transactionId, accountId, userId, amount, balance, reason }).catch(() => {})
  },

  publishDiamondsDebited(transactionId: string, accountId: string, userId: string, amount: number, balance: number, reason?: string): void {
    eventBus.emit('economy:diamonds:debited', { transactionId, accountId, userId, amount, balance, reason }).catch(() => {})
  },

  publishApprovalApproved(requestId: string, referenceId: string, approvedBy: string, resourceType: string): void {
    eventBus.emit('approval:approved', { requestId, referenceId, approvedBy, resourceType }).catch(() => {})
  },

  publishApprovalRejected(requestId: string, referenceId: string, rejectedBy: string, resourceType: string, reason?: string): void {
    eventBus.emit('approval:rejected', { requestId, referenceId, rejectedBy, resourceType, reason }).catch(() => {})
  },
}
