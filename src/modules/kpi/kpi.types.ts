export type KpiPeriodName = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

export interface CreateKpiDefinitionDto {
  name: string
  description?: string
  category: string
  targetValue: number
  unit: string
  period?: KpiPeriodName
  formula?: string
}

export interface UpdateKpiDefinitionDto {
  name?: string
  description?: string
  category?: string
  targetValue?: number
  unit?: string
  period?: KpiPeriodName
  formula?: string
  isActive?: boolean
}

export interface CreateKpiRecordDto {
  definitionId: string
  staffId?: string
  departmentId?: string
  value: number
}

export interface CreateKpiTargetDto {
  definitionId: string
  departmentId?: string
  staffId?: string
  targetValue: number
  period?: KpiPeriodName
  startDate: string
  endDate: string
}

export interface KpiQueryParams {
  category?: string
  staffId?: string
  departmentId?: string
  definitionId?: string
  period?: KpiPeriodName
  page?: number
  limit?: number
  fromDate?: string
  toDate?: string
}
