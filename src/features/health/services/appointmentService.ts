import { createCrudService } from '../../../shared/services/crudFactory'
import { HealthAppointment } from '../types/health.types'

const svc = createCrudService<HealthAppointment>('health_appointments', {
  orderBy: 'order_index',
  ascending: true,
  filters: { status: 'active' },
})

export const fetchAppointments = svc.fetchAll
export const insertAppointment = svc.insert
export const updateAppointment = svc.update
export const deleteAppointment = svc.remove
