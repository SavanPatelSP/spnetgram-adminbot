import { logger } from '../logger/logger.js'

export interface ScheduledTask {
  name: string
  intervalMs: number
  execute(): Promise<void>
}

export class SchedulerService {
  private tasks: ScheduledTask[] = []
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private running = false

  registerTask(task: ScheduledTask): void {
    this.tasks.push(task)
  }

  start(): void {
    if (this.running) return
    this.running = true

    for (const task of this.tasks) {
      this.scheduleTask(task)
    }
  }

  stop(): void {
    this.running = false
    for (const [name, timer] of this.timers) {
      clearInterval(timer)
    }
    this.timers.clear()
  }

  private scheduleTask(task: ScheduledTask): void {
    const timer = setInterval(async () => {
      try {
        await task.execute()
      } catch (err) {
        logger.error({ taskName: task.name, err }, 'Scheduled task failed')
      }
    }, task.intervalMs)
    this.timers.set(task.name, timer)
  }
}
