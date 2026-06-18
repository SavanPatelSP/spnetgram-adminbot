import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { StaffMember } from '@prisma/client'

const eventBus = EventBus.getInstance()

export function emitStaffCreated(staff: StaffMember) {
  return eventBus.emit('staff:created', { staff })
}

export function emitStaffUpdated(staffId: string, data: Record<string, unknown>) {
  return eventBus.emit('staff:updated', { staffId, data })
}

export function emitStaffDeactivated(staffId: string) {
  return eventBus.emit('staff:deactivated', { staffId })
}

export function emitStaffRoleChanged(staffId: string, role: string) {
  return eventBus.emit('staff:role:changed', { staffId, role })
}
