export function extractDriveId(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''

  // Plain ID (alphanumeric, dash, underscore) of typical Drive ID length
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return trimmed
  }

  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
    /open\?id=([a-zA-Z0-9_-]+)/,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) return match[1]
  }

  return trimmed
}

export function parseList(input: string): string[] {
  return input
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}
