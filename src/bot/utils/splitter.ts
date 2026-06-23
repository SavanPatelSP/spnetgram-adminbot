const TELEGRAM_MAX_LENGTH = 4096

export function splitTelegramMessage(text: string, maxLength: number = TELEGRAM_MAX_LENGTH): string[] {
  if (text.length <= maxLength) return [text]

  const parts: string[] = []
  let remaining = text

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      parts.push(remaining)
      break
    }

    let splitAt = remaining.lastIndexOf('\n', maxLength)
    if (splitAt === -1 || splitAt === 0) {
      splitAt = remaining.lastIndexOf('. ', maxLength)
    }
    if (splitAt === -1 || splitAt === 0) {
      splitAt = remaining.lastIndexOf(', ', maxLength)
    }
    if (splitAt === -1 || splitAt === 0) {
      splitAt = remaining.lastIndexOf(' ', maxLength)
    }
    if (splitAt === -1 || splitAt === 0) {
      splitAt = maxLength
    }

    let part = remaining.slice(0, splitAt).trim()

    part = closeOpenTags(part)

    parts.push(part)
    remaining = remaining.slice(splitAt).trim()

    if (remaining.length > 0) {
      remaining = '<pre>…continued</pre>\n' + remaining
    }
  }

  return parts
}

const tagStack: string[] = []

function closeOpenTags(text: string): string {
  const openTags: string[] = []
  const tagRegex = /<\/?([a-zA-Z]+)[^>]*>/g
  let match: RegExpExecArray | null

  while ((match = tagRegex.exec(text)) !== null) {
    const fullTag = match[0]
    const tagName = match[1].toLowerCase()

    if (fullTag.startsWith('</')) {
      const idx = openTags.lastIndexOf(tagName)
      if (idx !== -1) openTags.splice(idx, 1)
    } else if (!fullTag.endsWith('/>') && !['br', 'hr', 'img', 'input'].includes(tagName)) {
      openTags.push(tagName)
    }
  }

  let result = text
  for (let i = openTags.length - 1; i >= 0; i--) {
    result += `</${openTags[i]}>`
  }

  return result
}
