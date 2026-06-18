import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const idSchema = z.string().min(1, 'ID is required')

export const dateRangeSchema = z.object({
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
})

export const staffActionSchema = z.object({
  staffId: z.string().min(1),
  reason: z.string().min(1, 'Reason is required for audit trail'),
})
