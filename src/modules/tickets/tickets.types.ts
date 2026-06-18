export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_REPLY' | 'RESOLVED' | 'CLOSED'

export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' | 'EMERGENCY'

export interface Ticket {
  id: string
  referenceId: string
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  reporterId: string
  assigneeId?: string
  createdAt: Date
  updatedAt: Date
  closedAt?: Date
}

export interface CreateTicketDto {
  subject: string
  description: string
  priority: TicketPriority
  reporterId: string
  caseId?: string
}

export interface UpdateTicketDto {
  subject?: string
  description?: string
  priority?: TicketPriority
  status?: TicketStatus
}

export interface TicketReplyDto {
  ticketId: string
  userId: string
  content: string
}

export interface TicketReply {
  id: string
  ticketId: string
  userId: string
  content: string
  createdAt: Date
}

export interface TicketAssignmentDto {
  ticketId: string
  assigneeId: string
  assignedBy: string
}

export interface TicketQueryParams {
  status?: TicketStatus
  priority?: TicketPriority
  assigneeId?: string
  reporterId?: string
  page?: number
  limit?: number
}

export const VALID_TICKET_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['WAITING_REPLY', 'RESOLVED', 'CLOSED'],
  WAITING_REPLY: ['IN_PROGRESS', 'CLOSED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
}
