export type TransactionTypeName = 'CREDIT' | 'DEBIT' | 'REFUND' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADMIN_GRANT' | 'ADMIN_DEDUCT' | 'REWARD' | 'PENALTY'
export type TransactionStatusName = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED'

export interface CreateTransactionDto {
  accountId: string
  type: TransactionTypeName
  amount: number
  description?: string
  referenceType?: string
  referenceId?: string
  executedById?: string
}

export interface TransferDto {
  fromAccountId: string
  toAccountId: string
  amount: number
  description?: string
}

export interface EconomyQueryParams {
  type?: TransactionTypeName
  status?: TransactionStatusName
  page?: number
  limit?: number
  fromDate?: string
  toDate?: string
}
