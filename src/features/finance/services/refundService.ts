import { createCrudService } from '../../../shared/services/crudFactory'
import { Refund } from '../types/finance.types'

const svc = createCrudService<Refund>('refunds')

export const fetchRefunds = svc.fetchAll
export const insertRefund = svc.insert
export const updateRefund = svc.update
export const deleteRefund = svc.remove
