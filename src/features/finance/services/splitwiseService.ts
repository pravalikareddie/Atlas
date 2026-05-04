import { createCrudService } from '../../../shared/services/crudFactory'
import { SplitwiseEntry } from '../types/finance.types'

const svc = createCrudService<SplitwiseEntry>('splitwise_entries', {
  orderBy: 'logged_at',
})

export const fetchSplitwise = svc.fetchAll
export const insertSplitwise = svc.insert
export const updateSplitwise = svc.update
export const deleteSplitwise = svc.remove
