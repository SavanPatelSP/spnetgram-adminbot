export type IncidentPriorityName = 'P1' | 'P2' | 'P3' | 'P4'
export type IncidentStatusName = 'DETECTED' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED'
export type SecuritySeverityName = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface CreateIncidentDto {
  title: string
  description?: string
  priority?: IncidentPriorityName
  severity?: SecuritySeverityName
  category?: string
  source?: string
  assigneeId?: string
  tags?: string[]
}

export interface UpdateIncidentDto {
  status?: IncidentStatusName
  priority?: IncidentPriorityName
  severity?: SecuritySeverityName
  description?: string
  assigneeId?: string
  tags?: string[]
}

export interface IncidentQueryParams {
  status?: IncidentStatusName
  priority?: IncidentPriorityName
  assigneeId?: string
  category?: string
  page?: number
  limit?: number
}

export interface AddTimelineEntryDto {
  incidentId: string
  action: string
  description?: string
  actorId?: string
}

export interface CreateReportDto {
  incidentId: string
  title: string
  body?: string
  reportType?: string
  authorId?: string
}

export interface CreateRcaDto {
  incidentId: string
  rootCause: string
  contributingFactors?: Record<string, unknown>
  impact?: string
  recommendation?: string
  actionItems?: Record<string, unknown>
  severity?: string
  authorId?: string
}
