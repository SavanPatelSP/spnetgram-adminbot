import type { Telegraf } from 'telegraf'
import { PremiumService } from '../../../modules/premium/premium.service.js'
import { UsersService } from '../../../modules/users/users.service.js'
import { EventBus } from '../../../infrastructure/event-bus/event-bus.js'

const premiumService = new PremiumService()
const usersService = new UsersService()
const eventBus = EventBus.getInstance()

export function registerPremiumCommands(bot: Telegraf): void {
  bot.command('premium', async (ctx) => {
    try {
      const plans = await premiumService.listPlans(true)
      let text = '*Premium Overview*\n\n'
      text += `Available Plans: ${plans.length}\n\n`
      for (const plan of plans) {
        text += `*${plan.name}* — $${plan.price}/${plan.interval || 'monthly'}\n`
        const features = (plan.features as string[]) ?? []
        if (features.length > 0) {
          text += `  Features: ${features.join(', ')}\n`
        }
        text += `  Max Staff: ${plan.maxStaff ?? 1} | Max Cases: ${plan.maxCases ?? 10}\n\n`
      }
      text += 'Use `/plans` for details, `/requestpremium <userId>` to request.'
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Premium error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('plans', async (ctx) => {
    try {
      const plans = await premiumService.listPlans(true)
      if (plans.length === 0) {
        await ctx.reply('No premium plans are available at this time.')
        return
      }
      let text = '*Available Premium Plans*\n\n'
      for (const plan of plans) {
        text += `*${plan.name}* (${plan.tier})\n`
        text += `  Price: $${plan.price}/${plan.interval || 'monthly'}\n`
        if (plan.description) text += `  ${plan.description}\n`
        const features = (plan.features as string[]) ?? []
        if (features.length > 0) {
          text += `  Features: ${features.join(', ')}\n`
        }
        text += `  Staff Limit: ${plan.maxStaff ?? 1}\n`
        text += `  Case Limit: ${plan.maxCases ?? 10}\n\n`
      }
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`Plans error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })

  bot.command('requestpremium', async (ctx) => {
    try {
      const args = ctx.message?.text?.split(' ')
      if (!args || args.length < 3) {
        await ctx.reply('Usage: /requestpremium <userId> <planId>')
        return
      }

      const userId = args[1]
      const planId = args[2]

      await premiumService.createSubscription({ userId, planId })

      await eventBus.emit('premium:requested', { userId, planId, requestedBy: ctx.from?.id.toString() })

      await ctx.replyWithMarkdown(`*Premium Request Processed*\n\nUser: \`${userId}\`\nPlan: \`${planId}\`\nStatus: Active`)
    } catch (err) {
      if (err instanceof Error && (err.message.includes('NotFound') || err.message.includes('not found'))) {
        await ctx.reply('User or plan not found. Please check the IDs.')
      } else {
        await ctx.reply(`Request premium error: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }
  })

  bot.command('mypremium', async (ctx) => {
    try {
      const from = ctx.from!
      const user = await usersService.findByTelegramId(BigInt(from.id))
      if (!user) {
        await ctx.reply('Could not identify you.')
        return
      }

      const subs = await premiumService.listSubscriptions(user.id)
      if (subs.length === 0) {
        await ctx.reply('You do not have any premium subscriptions.')
        return
      }

      let text = '*Your Premium Subscriptions*\n\n'
      for (const sub of subs) {
        const plan = sub.plan as any
        text += `*${plan.name || 'Unknown Plan'}*\n`
        text += `  Status: ${sub.status}\n`
        text += `  Period End: ${sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'N/A'}\n`
        if (sub.trialEndsAt) text += `  Trial Ends: ${new Date(sub.trialEndsAt).toLocaleDateString()}\n`
        text += '\n'
      }
      await ctx.replyWithMarkdown(text)
    } catch (err) {
      await ctx.reply(`My premium error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  })
}
