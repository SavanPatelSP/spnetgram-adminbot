import type { Telegraf } from 'telegraf'
import { ModerationService } from '../../../modules/moderation/moderation.service.js'
import { UsersService } from '../../../modules/users/users.service.js'
import { bold, code, divider, successCard, errorCard } from '../../utils/message-builder.js'

const moderationService = new ModerationService()
const usersService = new UsersService()

export function registerModerationCommands(bot: Telegraf): void {
  bot.command('warn', async (ctx) => {
    const args = ctx.message?.text?.split(' ')
    if (!args || args.length < 3) {
      await ctx.replyWithHTML(`<b>⚠️ Usage</b>\n\n/warn &lt;username&gt; &lt;reason&gt;`)
      return
    }

    const targetUsername = args[1].replace('@', '')
    const reason = args.slice(2).join(' ')

    const target = await usersService.findByTelegramUsername(targetUsername)
    if (!target) {
      await ctx.replyWithHTML(errorCard({ reason: `User @${targetUsername} not found` }))
      return
    }

    const from = ctx.from!
    const moderator = await usersService.findByTelegramId(BigInt(from.id))
    if (!moderator) {
      await ctx.replyWithHTML(errorCard({ reason: 'Could not identify you.' }))
      return
    }

    const action = await moderationService.create({
      moderatorId: moderator.id,
      targetId: target.id,
      actionType: 'WARN',
      reason,
    })

    await ctx.replyWithHTML(
      successCard({
        title: 'WARN ISSUED',
        items: [
          { label: 'User', value: `@${targetUsername}` },
          { label: 'Reason', value: reason },
          { label: 'Action ID', value: code(action.id) },
        ],
      })
    )
  })

  bot.command('mute', async (ctx) => {
    const args = ctx.message?.text?.split(' ')
    if (!args || args.length < 3) {
      await ctx.replyWithHTML(`<b>⚠️ Usage</b>\n\n/mute &lt;username&gt; &lt;duration_minutes&gt; &lt;reason&gt;`)
      return
    }

    const targetUsername = args[1].replace('@', '')
    const duration = parseInt(args[2], 10)
    const reason = args.slice(3).join(' ')

    const target = await usersService.findByTelegramUsername(targetUsername)
    if (!target) {
      await ctx.replyWithHTML(errorCard({ reason: `User @${targetUsername} not found` }))
      return
    }

    const from = ctx.from!
    const moderator = await usersService.findByTelegramId(BigInt(from.id))
    if (!moderator) {
      await ctx.replyWithHTML(errorCard({ reason: 'Could not identify you.' }))
      return
    }

    const action = await moderationService.create({
      moderatorId: moderator.id,
      targetId: target.id,
      actionType: 'MUTE',
      duration,
      reason,
    })

    await ctx.replyWithHTML(
      successCard({
        title: 'MUTE APPLIED',
        items: [
          { label: 'User', value: `@${targetUsername}` },
          { label: 'Duration', value: `${duration} minutes` },
          { label: 'Reason', value: reason },
          { label: 'Action ID', value: code(action.id) },
        ],
      })
    )
  })

  bot.command('ban', async (ctx) => {
    const args = ctx.message?.text?.split(' ')
    if (!args || args.length < 2) {
      await ctx.replyWithHTML(`<b>⚠️ Usage</b>\n\n/ban &lt;username&gt; &lt;reason&gt;`)
      return
    }

    const targetUsername = args[1].replace('@', '')
    const reason = args.slice(2).join(' ')

    const target = await usersService.findByTelegramUsername(targetUsername)
    if (!target) {
      await ctx.replyWithHTML(errorCard({ reason: `User @${targetUsername} not found` }))
      return
    }

    const from = ctx.from!
    const moderator = await usersService.findByTelegramId(BigInt(from.id))
    if (!moderator) {
      await ctx.replyWithHTML(errorCard({ reason: 'Could not identify you.' }))
      return
    }

    const action = await moderationService.create({
      moderatorId: moderator.id,
      targetId: target.id,
      actionType: 'BAN',
      reason,
    })

    await ctx.replyWithHTML(
      successCard({
        title: 'BAN APPLIED',
        items: [
          { label: 'User', value: `@${targetUsername}` },
          { label: 'Reason', value: reason },
          { label: 'Action ID', value: code(action.id) },
        ],
      })
    )
  })

  bot.command('unban', async (ctx) => {
    const args = ctx.message?.text?.split(' ')
    if (!args || args.length < 2) {
      await ctx.replyWithHTML(`<b>⚠️ Usage</b>\n\n/unban &lt;username&gt; &lt;reason&gt;`)
      return
    }

    const targetUsername = args[1].replace('@', '')
    const reason = args.slice(2).join(' ')

    const target = await usersService.findByTelegramUsername(targetUsername)
    if (!target) {
      await ctx.replyWithHTML(errorCard({ reason: `User @${targetUsername} not found` }))
      return
    }

    const from = ctx.from!
    const moderator = await usersService.findByTelegramId(BigInt(from.id))
    if (!moderator) {
      await ctx.replyWithHTML(errorCard({ reason: 'Could not identify you.' }))
      return
    }

    await moderationService.create({
      moderatorId: moderator.id,
      targetId: target.id,
      actionType: 'UNBAN',
      reason,
    })

    await ctx.replyWithHTML(
      successCard({
        title: 'UNBAN APPLIED',
        items: [
          { label: 'User', value: `@${targetUsername}` },
          { label: 'Reason', value: reason },
        ],
      })
    )
  })

  bot.command('unmute', async (ctx) => {
    const args = ctx.message?.text?.split(' ')
    if (!args || args.length < 2) {
      await ctx.replyWithHTML(`<b>⚠️ Usage</b>\n\n/unmute &lt;username&gt; &lt;reason&gt;`)
      return
    }

    const targetUsername = args[1].replace('@', '')
    const reason = args.slice(2).join(' ')

    const target = await usersService.findByTelegramUsername(targetUsername)
    if (!target) {
      await ctx.replyWithHTML(errorCard({ reason: `User @${targetUsername} not found` }))
      return
    }

    const from = ctx.from!
    const moderator = await usersService.findByTelegramId(BigInt(from.id))
    if (!moderator) {
      await ctx.replyWithHTML(errorCard({ reason: 'Could not identify you.' }))
      return
    }

    await moderationService.create({
      moderatorId: moderator.id,
      targetId: target.id,
      actionType: 'UNMUTE',
      reason,
    })

    await ctx.replyWithHTML(
      successCard({
        title: 'UNMUTE APPLIED',
        items: [
          { label: 'User', value: `@${targetUsername}` },
          { label: 'Reason', value: reason },
        ],
      })
    )
  })
}
