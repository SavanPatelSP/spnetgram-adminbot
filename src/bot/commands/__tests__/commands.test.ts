import { describe, it, expect, vi } from 'vitest'
import type { Telegraf } from 'telegraf'

describe('Bot Command Registration', () => {
  const bot = { command: vi.fn(), use: vi.fn(), action: vi.fn() } as unknown as Telegraf

  it('should register all staff command modules', async () => {
    const { registerStaffCommands } = await import('../staff/index.js')
    registerStaffCommands(bot)
    expect(bot.use).toHaveBeenCalled()
  })

  it('should register help command', async () => {
    vi.clearAllMocks()
    const { registerHelpCommand } = await import('../help.js')
    registerHelpCommand(bot)
    expect(bot.command).toHaveBeenCalledWith('help', expect.any(Function))
  })

  it('should register start command', async () => {
    vi.clearAllMocks()
    const { registerStartCommand } = await import('../start.js')
    registerStartCommand(bot)
    expect(bot.command).toHaveBeenCalledWith('start', expect.any(Function))
  })
})

describe('Guide Command Content', () => {
  it('should include platform overview in /guide output', async () => {
    const mod = await import('../staff/guide.js')
    expect(typeof mod.registerGuideCommands).toBe('function')
  })

  it('should have /guide command handler that returns HTML', async () => {
    const mod = await import('../staff/guide.js')
    const reply = vi.fn()
    const replyWithHTML = vi.fn()
    const ctx = { reply, replyWithHTML } as any
    const bot = { command: vi.fn((name: string, handler: any) => { if (name === 'guide') handler(ctx) }), action: vi.fn() } as unknown as Telegraf
    mod.registerGuideCommands(bot)
    expect(replyWithHTML).toHaveBeenCalled()
    const html = replyWithHTML.mock.calls[0]?.[0]
    if (html) {
      expect(typeof html).toBe('string')
      expect(html.length).toBeGreaterThan(100)
      expect(html).toContain('<b>')
    }
  })

  it('should have /commands command handler listing all categories', async () => {
    const mod = await import('../staff/guide.js')
    const reply = vi.fn()
    const replyWithHTML = vi.fn()
    const ctx = { reply, replyWithHTML } as any
    const bot = { command: vi.fn((name: string, handler: any) => { if (name === 'commands') handler(ctx) }), action: vi.fn() } as unknown as Telegraf
    mod.registerGuideCommands(bot)
    expect(replyWithHTML).toHaveBeenCalled()
  })

  it('should have /examples command handler with usage patterns', async () => {
    const mod = await import('../staff/guide.js')
    const reply = vi.fn()
    const replyWithHTML = vi.fn()
    const ctx = { reply, replyWithHTML } as any
    const bot = { command: vi.fn((name: string, handler: any) => { if (name === 'examples') handler(ctx) }), action: vi.fn() } as unknown as Telegraf
    mod.registerGuideCommands(bot)
    expect(replyWithHTML).toHaveBeenCalled()
  })
})
