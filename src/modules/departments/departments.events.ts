import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const DepartmentsEvents = {
  created(departmentId: string, name: string, type: string) {
    return eventBus.emit('department:created', { departmentId, name, type })
  },

  updated(departmentId: string) {
    return eventBus.emit('department:updated', { departmentId })
  },

  staffAdded(departmentId: string, staffId: string, role: string) {
    return eventBus.emit('department:staff:added', { departmentId, staffId, role })
  },

  staffRemoved(departmentId: string, staffId: string) {
    return eventBus.emit('department:staff:removed', { departmentId, staffId })
  },
}
