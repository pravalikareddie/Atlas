import { createCrudService } from '../../../shared/services/crudFactory'
import { WishlistItem } from '../types/living.types'

const svc = createCrudService<WishlistItem>('wishlist_items', { orderBy: 'order_index', ascending: true })

export const fetchWishlistItems = svc.fetchAll
export const insertWishlistItem = svc.insert
export const updateWishlistItem = svc.update
export const deleteWishlistItem = svc.remove
