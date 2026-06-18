import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const KpiEvents = {
  recordCreated(recordId: string, definitionId: string, value: number, staffId?: string) {
    return eventBus.emit('kpi:record:created', { recordId, definitionId, staffId, value })
  },

  targetAchieved(targetId: string, definitionId: string, achievedValue: number) {
    return eventBus.emit('kpi:target:achieved', { targetId, definitionId, achievedValue })
  },
}
