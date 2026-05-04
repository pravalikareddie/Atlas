import { createCrudService } from '../../../shared/services/crudFactory'
import { MealPlan } from '../types/health.types'

const svc = createCrudService<MealPlan>('meal_plans', {
  orderBy: 'date',
  ascending: true,
})

export const fetchMealPlans = svc.fetchAll
export const insertMealPlan = svc.insert
export const updateMealPlan = svc.update
export const deleteMealPlan = svc.remove
