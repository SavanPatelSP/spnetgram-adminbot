import type { IncomingMessage, ServerResponse } from 'node:http'
import { AuditService } from '../../modules/audit/audit.service.js'

const auditService = new AuditService()

export function auditMiddleware(req: IncomingMessage, res: ServerResponse): void {
  const originalEnd = res.end.bind(res)

  res.end = ((...args: Parameters<ServerResponse['end']>) => {
    const result = originalEnd(...args)

    if (res.statusCode >= 400) {
      const staffId = (req as any).staffId
      auditService.create({
        staffId,
        action: `${req.method}_${req.url?.split('?')[0]}`,
        resource: req.url?.split('/')[1] || 'unknown',
        resourceId: req.url?.split('/')[2],
        description: `HTTP ${req.method} ${req.url} -> ${res.statusCode}`,
        ipAddress: req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      })
    }

    return result
  }) as ServerResponse['end']
}
