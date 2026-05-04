import { createCrudService } from '../../../shared/services/crudFactory'
import { HealthMedication } from '../types/health.types'

const svc = createCrudService<HealthMedication>('health_medications', {
  orderBy: 'created_at',
  ascending: true,
  filters: { status: 'active' },
})

export const fetchMedications = svc.fetchAll
export const insertMedication = svc.insert
export const updateMedication = svc.update
