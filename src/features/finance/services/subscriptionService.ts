import { createCrudService } from '../../../shared/services/crudFactory'
import { Subscription } from '../types/finance.types'

const svc = createCrudService<Subscription>('subscriptions')

export const fetchSubscriptions = svc.fetchAll
export const insertSubscription = svc.insert
export const updateSubscription = svc.update
export const deleteSubscription = svc.remove
