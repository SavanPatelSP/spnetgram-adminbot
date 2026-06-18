import pino from 'pino'
import { env } from '../config/env.js'

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const
type LogLevel = typeof LOG_LEVELS[number]

class AppLogger {
  private logger: pino.Logger
  private _correlationId: string | undefined

  constructor() {
    this.logger = pino({
      level: env.LOG_LEVEL || 'info',
      transport: env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
      formatters: {
        level(label) { return { level: label } },
        bindings() { return {} },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    })
  }

  set correlationId(id: string | undefined) {
    this._correlationId = id
  }

  get correlationId(): string | undefined {
    return this._correlationId
  }

  private withMeta(meta: Record<string, unknown>): Record<string, unknown> {
    if (this._correlationId) {
      return { correlationId: this._correlationId, ...meta }
    }
    return meta
  }

  fatal(msgOrObj: string | Record<string, unknown>, ...args: any[]): void {
    if (typeof msgOrObj === 'string') {
      const meta = args.length > 0 && typeof args[0] === 'object' ? args[0] : {}
      this.logger.fatal(this.withMeta(meta), msgOrObj)
    } else {
      const msg = args.length > 0 ? String(args[0]) : ''
      this.logger.fatal(this.withMeta(msgOrObj), msg)
    }
  }

  error(msgOrObj: string | Record<string, unknown>, ...args: any[]): void {
    if (typeof msgOrObj === 'string') {
      const meta = args.length > 0 && typeof args[0] === 'object' ? args[0] : {}
      this.logger.error(this.withMeta(meta), msgOrObj)
    } else {
      const msg = args.length > 0 ? String(args[0]) : ''
      this.logger.error(this.withMeta(msgOrObj), msg)
    }
  }

  warn(msgOrObj: string | Record<string, unknown>, ...args: any[]): void {
    if (typeof msgOrObj === 'string') {
      const meta = args.length > 0 && typeof args[0] === 'object' ? args[0] : {}
      this.logger.warn(this.withMeta(meta), msgOrObj)
    } else {
      const msg = args.length > 0 ? String(args[0]) : ''
      this.logger.warn(this.withMeta(msgOrObj), msg)
    }
  }

  info(msgOrObj: string | Record<string, unknown>, ...args: any[]): void {
    if (typeof msgOrObj === 'string') {
      const meta = args.length > 0 && typeof args[0] === 'object' ? args[0] : {}
      this.logger.info(this.withMeta(meta), msgOrObj)
    } else {
      const msg = args.length > 0 ? String(args[0]) : ''
      this.logger.info(this.withMeta(msgOrObj), msg)
    }
  }

  debug(msgOrObj: string | Record<string, unknown>, ...args: any[]): void {
    if (typeof msgOrObj === 'string') {
      const meta = args.length > 0 && typeof args[0] === 'object' ? args[0] : {}
      this.logger.debug(this.withMeta(meta), msgOrObj)
    } else {
      const msg = args.length > 0 ? String(args[0]) : ''
      this.logger.debug(this.withMeta(msgOrObj), msg)
    }
  }

  trace(msgOrObj: string | Record<string, unknown>, ...args: any[]): void {
    if (typeof msgOrObj === 'string') {
      const meta = args.length > 0 && typeof args[0] === 'object' ? args[0] : {}
      this.logger.trace(this.withMeta(meta), msgOrObj)
    } else {
      const msg = args.length > 0 ? String(args[0]) : ''
      this.logger.trace(this.withMeta(msgOrObj), msg)
    }
  }

  child(bindings: Record<string, unknown>): pino.Logger {
    return this.logger.child(bindings)
  }
}

export const logger = new AppLogger()
