/**
 * Lightweight input validation for API routes.
 * No external dependencies — keeps the bundle small.
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

const QUALITY_VALUES = new Set([
  'Outstanding', 'Excellent', 'Good', 'Yes', 'Fair', 'Poor', 'No',
])

const STATE_ABBRS = new Set([
  'AL','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX',
  'UT','VT','VA','WA','WV','WI','WY',
])

export function validateInt(
  raw: string | null,
  name: string,
  { min = 0, max = Number.MAX_SAFE_INTEGER, defaultValue = 0 } = {}
): number {
  if (raw === null || raw === '') return defaultValue
  const n = parseInt(raw, 10)
  if (isNaN(n)) throw new ValidationError(`${name} must be an integer`)
  if (n < min || n > max) throw new ValidationError(`${name} must be between ${min} and ${max}`)
  return n
}

export function validateFloat(
  raw: string | null,
  name: string,
  { min, max }: { min: number; max: number }
): number {
  if (raw === null || raw === '') throw new ValidationError(`${name} is required`)
  const n = parseFloat(raw)
  if (isNaN(n)) throw new ValidationError(`${name} must be a number`)
  if (n < min || n > max) throw new ValidationError(`${name} must be between ${min} and ${max}`)
  return n
}

export function validateState(raw: string | null): string | null {
  if (!raw) return null
  const abbr = raw.toUpperCase().trim()
  if (!STATE_ABBRS.has(abbr)) throw new ValidationError(`Invalid state abbreviation: ${raw}`)
  return abbr
}

export function validateQuality(raw: string | null): string[] {
  if (!raw) return []
  const vals = raw.split(',').map((v) => v.trim()).filter(Boolean)
  for (const v of vals) {
    if (!QUALITY_VALUES.has(v))
      throw new ValidationError(`Invalid swimming_quality value: ${v}`)
  }
  return vals
}

export function validateEnum<T extends string>(
  raw: string | null,
  name: string,
  allowed: readonly T[],
  defaultValue: T
): T {
  if (!raw) return defaultValue
  if (!(allowed as readonly string[]).includes(raw))
    throw new ValidationError(`${name} must be one of: ${allowed.join(', ')}`)
  return raw as T
}

export function validateSlug(raw: string): string {
  if (!/^[a-z0-9-]{1,120}$/.test(raw))
    throw new ValidationError('Invalid slug format')
  return raw
}

export function validateSearchQuery(raw: string | null): string {
  if (!raw) return ''
  const q = raw.trim().slice(0, 200) // hard cap at 200 chars
  // Reject obviously malicious patterns (SQL operators, scripts)
  if (/[<>{}]/.test(q)) throw new ValidationError('Invalid search query')
  return q
}
