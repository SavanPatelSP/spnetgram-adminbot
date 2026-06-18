import { describe, it, expect, vi } from 'vitest'
import type { Telegraf } from 'telegraf'
import { EventBus } from '../../../infrastructure/event-bus/event-bus.js'
import { PremiumService } from '../../../modules/premium/premium.service.js'

describe('Premium Bot Commands', () => {
  const bot = { command: vi.fn(), use: vi.fn() } as unknown as Telegraf

  it('should register premium commands', async () => {
    const { registerPremiumCommands } = await import('../staff/premium.js')
    registerPremiumCommands(bot)
    expect(bot.command).toHaveBeenCalledWith('premium', expect.any(Function))
    expect(bot.command).toHaveBeenCalledWith('plans', expect.any(Function))
    expect(bot.command).toHaveBeenCalledWith('requestpremium', expect.any(Function))
    expect(bot.command).toHaveBeenCalledWith('mypremium', expect.any(Function))
  })

  it('should emit premium:requested event on /requestpremium', async () => {
    const emit = vi.spyOn(EventBus.getInstance(), 'emit')
    vi.spyOn(PremiumService.prototype, 'createSubscription').mockResolvedValueOnce({
      id: 'sub-1',
      userId: 'user-1',
      planId: 'plan-1',
    } as any)

    const { registerPremiumCommands } = await import('../staff/premium.js')

    const replyMarkdown = vi.fn()
    const ctx = {
      message: { text: '/requestpremium user-1 plan-1' },
      from: { id: 12345 },
      replyWithMarkdown: replyMarkdown,
      reply: vi.fn(),
    } as any

    const handlers = new Map<string, Function>()
    const testBot = {
      command: vi.fn((name: string, handler: any) => { handlers.set(name, handler) }),
    } as unknown as Telegraf
    registerPremiumCommands(testBot)

    await handlers.get('requestpremium')!(ctx)

    expect(emit).toHaveBeenCalledWith('premium:requested', {
      userId: 'user-1',
      planId: 'plan-1',
      requestedBy: '12345',
    })
    expect(replyMarkdown).toHaveBeenCalled()
  })

  it('should handle /premium command successfully', async () => {
    vi.spyOn(PremiumService.prototype, 'listPlans').mockResolvedValueOnce([
      { name: 'Basic', tier: 'BASIC', price: 9.99, interval: 'monthly', features: ['feature_a'], maxStaff: 1, maxCases: 10 },
      { name: 'Pro', tier: 'PRO', price: 29.99, interval: 'monthly', features: ['feature_a', 'feature_b'], maxStaff: 5, maxCases: 50 },
    ] as any[])

    const { registerPremiumCommands } = await import('../staff/premium.js')

    const replyMarkdown = vi.fn()
    const ctx = { replyWithMarkdown: replyMarkdown, reply: vi.fn() } as any

    const handlers = new Map<string, Function>()
    const testBot = {
      command: vi.fn((name: string, handler: any) => { handlers.set(name, handler) }),
    } as unknown as Telegraf
    registerPremiumCommands(testBot)

    await handlers.get('premium')!(ctx)

    expect(replyMarkdown).toHaveBeenCalled()
    const text = replyMarkdown.mock.calls[0]?.[0]
    expect(text).toContain('Premium Overview')
    expect(text).toContain('Basic')
    expect(text).toContain('Pro')
  })

  it('should handle /plans command with no plans', async () => {
    vi.spyOn(PremiumService.prototype, 'listPlans').mockResolvedValueOnce([])

    const { registerPremiumCommands } = await import('../staff/premium.js')

    const reply = vi.fn()
    const ctx = { reply, replyWithMarkdown: vi.fn() } as any

    const handlers = new Map<string, Function>()
    const testBot = {
      command: vi.fn((name: string, handler: any) => { handlers.set(name, handler) }),
    } as unknown as Telegraf
    registerPremiumCommands(testBot)

    await handlers.get('plans')!(ctx)

    expect(reply).toHaveBeenCalledWith('No premium plans are available at this time.')
  })
})
