import { ErrorCode } from './error-codes'

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: Record<string, unknown>

  constructor(
    code: ErrorCode,
    message: string,
    statusCode = 500,
    details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      ErrorCode.NOT_FOUND,
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      404,
    )
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(ErrorCode.UNAUTHORIZED, message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(ErrorCode.FORBIDDEN, message, 403)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ErrorCode.CONFLICT, message, 409)
  }
}
