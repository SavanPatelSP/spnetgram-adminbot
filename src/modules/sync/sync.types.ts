export interface CreateSyncEventDto {
  eventType: string
  source?: string
  target?: string
  entityType: string
  entityId: string
  action: string
  payload?: Record<string, unknown>
}

export interface SyncEventQueryParams {
  status?: string
  eventType?: string
  entityType?: string
  page?: number
  limit?: number
}

export interface UpdateSyncEventDto {
  status: string
  error?: string
  retryCount?: number
}
