import type { Telegraf } from 'telegraf'
import { ModerationService } from '../../../modules/moderation/moderation.service.js'
import { UsersService } from '../../../modules/users/users.service.js'

const moderationService = new ModerationService()
const usersService = new UsersService()

export function registerModerationCommands(bot: Telegraf): void {
  bot.command('warn', async (ctx) => {
    const args = ctx.message?.text?.split(' ')
    if (!args || args.length < 3) {
      await ctx.reply('Usage: /warn <username> <reason>')
      return
    }

    const targetUsername = args[1].replace('@', '')
    const reason = args.slice(2).join(' ')

    const target = await usersService.findByTelegramUsername(targetUsername)
    if (!target) {
      await ctx.reply(`User @${targetUsername} not found.`)
      return
    }

    const from = ctx.from!
    const moderator = await usersService.findByTelegramId(BigInt(from.id))
    if (!moderator) {
      await ctx.reply('Could not identify you.')
      return
    }

    const action = await moderationService.create({
      moderatorId: moderator.id,
      targetId: target.id,
      actionType: 'WARN',
      reason,
    })

    await ctx.reply(`✅ Warned @${targetUsername}\nReason: ${reason}\nAction ID: ${action.id}`)
  })

  bot.command('mute', async (ctx) => {
    const args = ctx.message?.text?.split(' ')
    if (!args || args.length < 3) {
      await ctx.reply('Usage: /mute <username> <duration_minutes> <reason>')
      return
    }

    const targetUsername = args[1].replace('@', '')
    const duration = parseInt(args[2], 10)
    const reason = args.slice(3).join(' ')

    const target = await usersService.findByTelegramUsername(targetUsername)
    if (!target) {
      await ctx.reply(`User @${targetUsername} not found.`)
      return
    }

    const from = ctx.from!
    const moderator = await usersService.findByTelegramId(BigInt(from.id))
    if (!moderator) {
      await ctx.reply('Could not identify you.')
      return
    }

    const action = await moderationService.create({
      moderatorId: moderator.id,
      targetId: target.id,
      actionType: 'MUTE',
      duration,
      reason,
    })

    await ctx.reply(`🔇 Muted @${targetUsername} for ${duration} minutes\nReason: ${reason}`)
  })

  bot.command('ban', async (ctx) => {
    const args = ctx.message?.text?.split(' ')
    if (!args || args.length < 2) {
      await ctx.reply('Usage: /ban <username> <reason>')
      return
    }

    const targetUsername = args[1].replace('@', '')
    const reason = args.slice(2).join(' ')

    const target = await usersService.findByTelegramUsername(targetUsername)
    if (!target) {
      await ctx.reply(`User @${targetUsername} not found.`)
      return
    }

    const from = ctx.from!
    const moderator = await usersService.findByTelegramId(BigInt(from.id))
    if (!moderator) {
      await ctx.reply('Could not identify you.')
      return
    }

    const action = await moderationService.create({
      moderatorId: moderator.id,
      targetId: target.id,
      actionType: 'BAN',
      reason,
    })

    await ctx.reply(`🚫 Banned @${targetUsername}\nReason: ${reason}`)
  })

  bot.command('unban', async (ctx) => {
    const args = ctx.message?.text?.split(' ')
    if (!args || args.length < 2) {
      await ctx.reply('Usage: /unban <username> <reason>')
      return
    }

    const targetUsername = args[1].replace('@', '')
    const reason = args.slice(2).join(' ')

    const target = await usersService.findByTelegramUsername(targetUsername)
    if (!target) {
      await ctx.reply(`User @${targetUsername} not found.`)
      return
    }

    const from = ctx.from!
    const moderator = await usersService.findByTelegramId(BigInt(from.id))
    if (!moderator) {
      await ctx.reply('Could not identify you.')
      return
    }

    const action = await moderationService.create({
      moderatorId: moderator.id,
      targetId: target.id,
      actionType: 'UNBAN',
      reason,
    })

    await ctx.reply(`✅ Unbanned @${targetUsername}\nReason: ${reason}`)
  })

  bot.command('unmute', async (ctx) => {
    const args = ctx.message?.text?.split(' ')
    if (!args || args.length < 2) {
      await ctx.reply('Usage: /unmute <username> <reason>')
      return
    }

    const targetUsername = args[1].replace('@', '')
    const reason = args.slice(2).join(' ')

    const target = await usersService.findByTelegramUsername(targetUsername)
    if (!target) {
      await ctx.reply(`User @${targetUsername} not found.`)
      return
    }

    const from = ctx.from!
    const moderator = await usersService.findByTelegramId(BigInt(from.id))
    if (!moderator) {
      await ctx.reply('Could not identify you.')
      return
    }

    const action = await moderationService.create({
      moderatorId: moderator.id,
      targetId: target.id,
      actionType: 'UNMUTE',
      reason,
    })

    await ctx.reply(`🔊 Unmuted @${targetUsername}\nReason: ${reason}`)
  })
}
