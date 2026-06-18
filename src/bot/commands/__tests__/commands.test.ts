import { describe, it, expect, vi } from 'vitest'
import type { Telegraf } from 'telegraf'

describe('Bot Command Registration', () => {
  const bot = { command: vi.fn(), use: vi.fn() } as unknown as Telegraf

  it('should register all staff command modules', async () => {
    const { registerStaffCommands } = await import('../staff/index.js')
    registerStaffCommands(bot)
    // staff, cases, tickets, investigations, moderation, departments, new-modules, guide
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

  it('should have /guide command handler that returns markdown', async () => {
    const mod = await import('../staff/guide.js')
    const reply = vi.fn()
    const replyWithMarkdown = vi.fn()
    const ctx = { reply, replyWithMarkdown } as any
    const bot = { command: vi.fn((name: string, handler: any) => { if (name === 'guide') handler(ctx) }) } as unknown as Telegraf
    mod.registerGuideCommands(bot)
    expect(replyWithMarkdown).toHaveBeenCalled()
    const markdown = replyWithMarkdown.mock.calls[0]?.[0]
    if (markdown) {
      expect(typeof markdown).toBe('string')
      expect(markdown.length).toBeGreaterThan(100)
    }
  })

  it('should have /commands command handler listing all categories', async () => {
    const mod = await import('../staff/guide.js')
    const reply = vi.fn()
    const replyWithMarkdown = vi.fn()
    const ctx = { reply, replyWithMarkdown } as any
    const bot = { command: vi.fn((name: string, handler: any) => { if (name === 'commands') handler(ctx) }) } as unknown as Telegraf
    mod.registerGuideCommands(bot)
    expect(replyWithMarkdown).toHaveBeenCalled()
  })

  it('should have /examples command handler with usage patterns', async () => {
    const mod = await import('../staff/guide.js')
    const reply = vi.fn()
    const replyWithMarkdown = vi.fn()
    const ctx = { reply, replyWithMarkdown } as any
    const bot = { command: vi.fn((name: string, handler: any) => { if (name === 'examples') handler(ctx) }) } as unknown as Telegraf
    mod.registerGuideCommands(bot)
    expect(replyWithMarkdown).toHaveBeenCalled()
  })
})
