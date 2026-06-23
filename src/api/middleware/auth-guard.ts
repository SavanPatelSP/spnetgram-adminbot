import type { IncomingMessage, ServerResponse } from 'node:http'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import { env } from '../../infrastructure/config/env.js'
import { AuthService } from '../../infrastructure/auth/auth.service.js'
import { safeStringify } from '../../shared/utils/safe-json.js'
import { logger } from '../../infrastructure/logger/logger.js'

const authService = new AuthService()

export async function authGuard(req: IncomingMessage, res: ServerResponse, _params?: Record<string, string>): Promise<boolean> {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.statusCode = 401
    res.end(safeStringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }))
    return false
  }

  const token = authHeader.slice(7)

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string; role?: string; staffId?: string; type?: string; jti?: string }

    if (decoded.type === 'refresh') {
      res.statusCode = 401
      res.end(safeStringify({ error: 'Use access token, not refresh token', code: 'TOKEN_TYPE_ERROR' }))
      return false
    }

    if (decoded.jti && await authService.isBlacklisted(decoded.jti)) {
      res.statusCode = 401
      res.end(safeStringify({ error: 'Token has been revoked', code: 'TOKEN_REVOKED' }))
      return false
    }

    ;(req as any).userId = decoded.sub
    ;(req as any).staffId = decoded.staffId || decoded.sub
    ;(req as any).role = decoded.role
    ;(req as any).tokenJti = decoded.jti
    return true
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.statusCode = 401
      res.end(safeStringify({ error: 'Token expired', code: 'TOKEN_EXPIRED' }))
      return false
    }
    res.statusCode = 401
    res.end(safeStringify({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' }))
    return false
  }
}

export function issueToken(payload: { sub: string; role?: string; staffId?: string }): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as any }
  return jwt.sign(payload, env.JWT_SECRET, options)
}

export function getBearerToken(req: IncomingMessage): string | null {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}
