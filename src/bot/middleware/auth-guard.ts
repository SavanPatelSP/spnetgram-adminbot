import type { Context, Middleware } from 'telegraf'
import { UsersService } from '../../modules/users/users.service.js'

const usersService = new UsersService()

export function staffGuard(): Middleware<Context> {
  return async (ctx, next) => {
    const telegramId = ctx.from?.id
    if (!telegramId) {
      await ctx.reply('Could not identify you.')
      return
    }

    const user = await usersService.findByTelegramId(BigInt(telegramId))
    if (!user || !user.isStaff) {
      await ctx.reply('You do not have staff access.')
      return
    }

    await next()
  }
}
