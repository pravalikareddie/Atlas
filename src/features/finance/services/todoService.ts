import { createCrudService } from '../../../shared/services/crudFactory'
import { FinanceTodo } from '../types/finance.types'

const svc = createCrudService<FinanceTodo>('finance_todos', { orderBy: 'order_index', ascending: true })

export const fetchTodos = svc.fetchAll
export const insertTodo = svc.insert
export const updateTodo = svc.update
export const deleteTodo = svc.remove
