import type { Telegraf } from 'telegraf'
import { PremiumService } from '../../../modules/premium/premium.service.js'
import { UsersService } from '../../../modules/users/users.service.js'
import { EventBus } from '../../../infrastructure/event-bus/event-bus.js'
import { bold, italic, code, divider, successCard, errorCard, premiumCard } from '../../utils/message-builder.js'
import { splitTelegramMessage } from '../../utils/splitter.js'

const premiumService = new PremiumService()
const usersService = new UsersService()
const eventBus = EventBus.getInstance()

export function registerPremiumCommands(bot: Telegraf): void {
  bot.command('premium', async (ctx) => {
    try {
      const plans = await premiumService.listPlans(true)
      if (plans.length === 0) {
        await ctx.replyWithHTML(`<b>ℹ️ No Plans</b>\n\nNo premium plans are available at this time.`)
        return
      }
      let text = `${bold('💎 PREMIUM OVERVIEW')}${divider()}\n${italic(`Available Plans: ${plans.length}`)}\n\n`
      for (const plan of plans) {
        text += `${bold(plan.name)} — <b>$${plan.price}</b>/${plan.interval || 'monthly'}\n`
        const features = (plan.features as string[]) ?? []
        if (features.length > 0) {
          text += `  ${features.map(f => `• ${f}`).join('\n  ')}\n`
        }
        text += `  Max Staff: ${plan.maxStaff ?? 1} | Max Cases: ${plan.maxCases ?? 10}\n\n`
      }
      text += `${divider()}\n${italic('Use /plans for details, /requestpremium <userId> <planId> to grant.')}`
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('plans', async (ctx) => {
    try {
      const plans = await premiumService.listPlans(true)
      if (plans.length === 0) {
        await ctx.replyWithHTML(`<b>ℹ️ No Plans</b>\n\nNo premium plans are available at this time.`)
        return
      }
      let text = `${bold('💎 AVAILABLE PLANS')}${divider()}\n\n`
      for (const plan of plans) {
        text += `${bold(plan.name)} (${plan.tier})\n`
        text += `  Price: <b>$${plan.price}</b>/${plan.interval || 'monthly'}\n`
        if (plan.description) text += `  ${italic(plan.description)}\n`
        const features = (plan.features as string[]) ?? []
        if (features.length > 0) {
          text += `  ${features.map(f => `• ${f}`).join('\n  ')}\n`
        }
        text += `  Staff Limit: ${plan.maxStaff ?? 1}\n`
        text += `  Case Limit: ${plan.maxCases ?? 10}\n\n`
      }
      const parts = splitTelegramMessage(text)
      for (const part of parts) {
        await ctx.replyWithHTML(part)
      }
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })

  bot.command('requestpremium', async (ctx) => {
    try {
      const args = ctx.message?.text?.split(' ')
      if (!args || args.length < 3) {
        await ctx.replyWithHTML(`<b>⚠️ Usage</b>\n\n/requestpremium &lt;userId&gt; &lt;planId&gt;`)
        return
      }

      const userId = args[1]
      const planId = args[2]

      await premiumService.createSubscription({ userId, planId })
      await eventBus.emit('premium:requested', { userId, planId, requestedBy: ctx.from?.id.toString() })

      await ctx.replyWithHTML(
        successCard({
          title: 'PREMIUM GRANTED',
          items: [
            { label: 'User', value: code(userId) },
            { label: 'Plan', value: code(planId) },
            { label: 'Status', value: '🟢 Active' },
          ],
        })
      )
    } catch (err) {
      if (err instanceof Error && (err.message.includes('NotFound') || err.message.includes('not found'))) {
        await ctx.replyWithHTML(errorCard({ reason: 'User or plan not found. Please check the IDs.' }))
      } else {
        await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
      }
    }
  })

  bot.command('mypremium', async (ctx) => {
    try {
      const from = ctx.from!
      const user = await usersService.findByTelegramId(BigInt(from.id))
      if (!user) {
        await ctx.replyWithHTML(errorCard({ reason: 'Could not identify you.' }))
        return
      }

      const subs = await premiumService.listSubscriptions(user.id)
      if (subs.length === 0) {
        await ctx.replyWithHTML(`<b>ℹ️ No Premium</b>\n\nYou do not have any premium subscriptions.`)
        return
      }

      let text = `${bold('💎 YOUR SUBSCRIPTIONS')}${divider()}\n`
      for (const sub of subs) {
        const plan = sub.plan as any
        text += `\n${bold(plan.name || 'Unknown Plan')}\n`
        text += `  Status: ${sub.status}\n`
        text += `  Period End: ${sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'N/A'}\n`
        if (sub.trialEndsAt) text += `  Trial Ends: ${new Date(sub.trialEndsAt).toLocaleDateString()}\n`
      }
      await ctx.replyWithHTML(text)
    } catch (err) {
      await ctx.replyWithHTML(errorCard({ reason: err instanceof Error ? err.message : 'Unknown' }))
    }
  })
}
