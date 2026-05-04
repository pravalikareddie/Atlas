import { createCrudService } from '../../../shared/services/crudFactory'
import { Account } from '../types/finance.types'

const svc = createCrudService<Account>('accounts', { orderBy: 'order_index', ascending: true })

export const fetchAccounts = svc.fetchAll
export const insertAccount = svc.insert
export const updateAccount = svc.update
export const deleteAccount = svc.remove
