import { createCrudService } from '../../../shared/services/crudFactory'
import { ShoppingItem } from '../types/health.types'

const svc = createCrudService<ShoppingItem>('shopping_items', { orderBy: 'order_index', ascending: true })

export const fetchShoppingItems = svc.fetchAll
export const insertShoppingItem = svc.insert
export const updateShoppingItem = svc.update
export const deleteShoppingItem = svc.remove
