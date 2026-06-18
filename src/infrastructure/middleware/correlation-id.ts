import type { IncomingMessage, ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import { logger } from '../logger/logger.js'

export function correlationIdMiddleware(req: IncomingMessage, res: ServerResponse): void {
  const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID()
  ;(req as any).correlationId = correlationId
  res.setHeader('x-correlation-id', correlationId)

  logger.correlationId = correlationId
}
