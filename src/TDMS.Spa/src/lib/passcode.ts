/**
 * Helper to compute and validate the dynamic daily access passcode.
 * Format is DDMMYY (e.g. '301226' for December 30, 2026), changing according to current date/time.
 */

export function getDailyAccessCode(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${day}${month}${year}`
}

export function getUtcDailyAccessCode(date: Date = new Date()): string {
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = String(date.getUTCFullYear()).slice(-2)
  return `${day}${month}${year}`
}

export function validateDailyAccessCode(input: string, referenceDate: Date = new Date()): boolean {
  if (!input) return false
  const clean = input.trim().replace(/[-/\s.:]/g, '')

  // 1. Primary match: Local current date (DDMMYY)
  const localToday = getDailyAccessCode(referenceDate)
  if (clean === localToday) return true

  // 2. UTC date (DDMMYY)
  const utcToday = getUtcDailyAccessCode(referenceDate)
  if (clean === utcToday) return true

  // 3. 4-digit year format (DDMMYYYY)
  const localDay = String(referenceDate.getDate()).padStart(2, '0')
  const localMonth = String(referenceDate.getMonth() + 1).padStart(2, '0')
  const fullYear = `${localDay}${localMonth}${referenceDate.getFullYear()}`
  if (clean === fullYear) return true

  // 4. Midnight boundary tolerance: yesterday and tomorrow in case of timezone variations
  const yesterday = new Date(referenceDate)
  yesterday.setDate(referenceDate.getDate() - 1)
  if (clean === getDailyAccessCode(yesterday) || clean === getUtcDailyAccessCode(yesterday)) {
    return true
  }

  const tomorrow = new Date(referenceDate)
  tomorrow.setDate(referenceDate.getDate() + 1)
  if (clean === getDailyAccessCode(tomorrow) || clean === getUtcDailyAccessCode(tomorrow)) {
    return true
  }

  return false
}
