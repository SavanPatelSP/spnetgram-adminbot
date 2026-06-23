import { describe, it, expect } from 'vitest'
import { safeStringify, serializeBigInt } from '../utils/safe-json.js'

describe('safeStringify', () => {
  it('should serialize plain objects', () => {
    expect(safeStringify({ a: 1, b: 'hello' })).toBe('{"a":1,"b":"hello"}')
  })

  it('should convert BigInt to string', () => {
    const result = safeStringify({ id: BigInt(12345678901234567890n) })
    expect(result).toBe('{"id":"12345678901234567890"}')
  })

  it('should handle nested BigInt', () => {
    const obj = {
      user: {
        telegramId: BigInt(987654321n),
        name: 'test',
      },
    }
    const result = safeStringify(obj)
    expect(result).toContain('"telegramId":"987654321"')
    expect(result).toContain('"name":"test"')
  })

  it('should handle arrays containing BigInt', () => {
    const obj = { ids: [BigInt(1n), BigInt(2n), BigInt(3n)] }
    const result = safeStringify(obj)
    expect(result).toBe('{"ids":["1","2","3"]}')
  })

  it('should handle Prisma-style payload', () => {
    const obj = {
      where: { telegramId: BigInt(12345n) },
      data: {
        telegramUsername: 'user123',
        isStaff: true,
        telegramId: BigInt(12345n),
      },
    }
    const result = safeStringify(obj)
    expect(result).toContain('"telegramId":"12345"')
    expect(result).toContain('"telegramUsername":"user123"')
    expect(result).toContain('"isStaff":true')
  })

  it('should handle null and undefined', () => {
    expect(safeStringify(null)).toBe('null')
    expect(safeStringify(undefined)).toBe(undefined)
  })

  it('should handle empty objects', () => {
    expect(safeStringify({})).toBe('{}')
  })

  it('should handle arrays', () => {
    expect(safeStringify([1, 'two', true])).toBe('[1,"two",true]')
  })

  it('should never throw', () => {
    const circular: any = {}
    circular.self = circular
    expect(() => safeStringify(circular)).not.toThrow()
  })

  it('should handle BigInt in deeply nested structures', () => {
    const obj = {
      level1: {
        level2: {
          level3: {
            id: BigInt(42n),
          },
        },
      },
    }
    const result = safeStringify(obj)
    expect(result).toContain('"id":"42"')
  })

  it('should handle mixed BigInt and regular values in arrays', () => {
    const obj = { mixed: [BigInt(1n), 'string', 123, true, null] }
    const result = safeStringify(obj)
    expect(result).toBe('{"mixed":["1","string",123,true,null]}')
  })

  it('should handle formatting with spaces', () => {
    const obj = { a: BigInt(1n) }
    const result = safeStringify(obj, 2)
    expect(result).toBe('{\n  "a": "1"\n}')
  })
})

describe('serializeBigInt', () => {
  it('should convert BigInt to string', () => {
    expect(serializeBigInt('key', BigInt(123n))).toBe('123')
  })

  it('should return non-BigInt values unchanged', () => {
    expect(serializeBigInt('key', 42)).toBe(42)
    expect(serializeBigInt('key', 'hello')).toBe('hello')
    expect(serializeBigInt('key', null)).toBe(null)
    expect(serializeBigInt('key', true)).toBe(true)
    expect(serializeBigInt('key', {})).toEqual({})
    expect(serializeBigInt('key', [])).toEqual([])
  })
})
