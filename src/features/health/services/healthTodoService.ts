import { createCrudService } from '../../../shared/services/crudFactory'
import { HealthTodo } from '../types/health.types'

const svc = createCrudService<HealthTodo>('health_todos', { orderBy: 'order_index', ascending: true })

export const fetchHealthTodos = svc.fetchAll
export const insertHealthTodo = svc.insert
export const updateHealthTodo = svc.update
export const deleteHealthTodo = svc.remove
