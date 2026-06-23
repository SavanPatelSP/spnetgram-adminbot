import { describe, it, expect, vi } from 'vitest'
import type { Telegraf } from 'telegraf'

describe('Guide Commands', () => {
  it('should export registerGuideCommands function', async () => {
    const mod = await import('../guide.js')
    expect(typeof mod.registerGuideCommands).toBe('function')
  })

  it('should register /guide, /commands, /examples and actions', async () => {
    const bot = { command: vi.fn(), action: vi.fn() } as unknown as Telegraf
    const { registerGuideCommands } = await import('../guide.js')
    registerGuideCommands(bot)
    expect(bot.command).toHaveBeenCalledWith('guide', expect.any(Function))
    expect(bot.command).toHaveBeenCalledWith('commands', expect.any(Function))
    expect(bot.command).toHaveBeenCalledWith('examples', expect.any(Function))
    expect(bot.action).toHaveBeenCalled()
  })
})
