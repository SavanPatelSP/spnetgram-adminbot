import type { ServerResponse, IncomingMessage } from 'node:http'
import { AppError } from '../../shared/errors/index.js'
import { logger } from '../../infrastructure/logger/logger.js'
import { safeStringify } from '../../shared/utils/safe-json.js'

export function errorHandler(err: Error, _req: IncomingMessage, res: ServerResponse): void {
  if (err instanceof AppError) {
    res.statusCode = err.statusCode
    res.end(safeStringify({
      error: err.message,
      code: err.code,
      details: err.details,
    }))
    return
  }

  logger.error({ err }, 'Unhandled error')
  res.statusCode = 500
  res.end(safeStringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }))
}
