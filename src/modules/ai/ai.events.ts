import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const AiEvents = {
  summaryGenerated(summaryId: string, targetType: string, targetId: string, summaryType: string) {
    return eventBus.emit('ai:summary:generated', { summaryId, targetType, targetId, summaryType })
  },

  recommendationCreated(recommendationId: string, category: string, title: string, priority: string) {
    return eventBus.emit('ai:recommendation:created', { recommendationId, category, title, priority })
  },

  recommendationApplied(recommendationId: string, appliedBy: string) {
    return eventBus.emit('ai:recommendation:applied', { recommendationId, appliedBy })
  },
}
