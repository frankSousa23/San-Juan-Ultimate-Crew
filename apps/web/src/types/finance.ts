export type AccountType = 'CASH' | 'BANK' | 'MOBILE'
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

export interface Account {
  id: number
  name: string
  type: AccountType
  createdAt: string
}

export interface Category {
  id: number
  name: string
  kind: TransactionType
  createdAt: string
}

export interface TransactionItem {
  id: number
  accountId: number
  categoryId?: number | null
  type: TransactionType
  amountCents: number
  occurredAt: string
  description?: string
  // Optionally included by API list
  account?: Account
  category?: Category | null
}

export type CreateAccountInput = { name: string; type: AccountType }
export type CreateCategoryInput = { name: string; kind: TransactionType }
export type CreateTransactionInput = Omit<TransactionItem, 'id' | 'createdAt' | 'account' | 'category'>
export type UpdateTransactionInput = Partial<CreateTransactionInput>

export interface TransactionList {
  items: TransactionItem[]
  total: number
  limit: number
  offset: number
}

export interface FinanceSummary {
  income: number
  expense: number
  balance: number
}
