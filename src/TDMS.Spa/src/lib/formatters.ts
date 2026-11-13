/**
 * Utility formatters for TDMS application.
 */

/**
 * Formats a 24-hour time string (e.g. "09:00", "17:30", "13:00:00") into 12-hour AM/PM format (e.g. "9:00 AM", "5:30 PM").
 */
export function formatTimeAmPm(timeStr?: string): string {
  if (!timeStr) return ''

  const parts = timeStr.trim().split(':')
  if (parts.length < 2) return timeStr

  let hours = parseInt(parts[0], 10)
  const minutes = parts[1].padStart(2, '0')

  if (isNaN(hours)) return timeStr

  const period = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12

  return `${hours}:${minutes} ${period}`
}

/**
 * Formats byte count into human-readable string (e.g. "1.2 MB", "450 KB").
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Formats currency amount in Myanmar Kyat (MMK).
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString()} MMK`
}
