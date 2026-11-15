import React, { useMemo } from 'react'
import { Clock } from 'lucide-react'

export interface TimeSelectProps {
  /**
   * 24-hour time string in "HH:mm" format (e.g. "09:00", "17:30").
   */
  value?: string
  /**
   * Callback emitting updated 24-hour time string in "HH:mm" format.
   */
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  ariaLabelPrefix?: string
  /**
   * Selector style for AM/PM: 'segmented' (buttons) or 'dropdown' (select). Default is 'segmented'.
   */
  variant?: 'segmented' | 'dropdown'
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const DEFAULT_MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

/**
 * Parses a 24-hour time string ("HH:mm" or "HH:mm:ss") into 12-hour components:
 * hour12 (1..12), minute ("00".."59"), and period ("AM" | "PM").
 */
export function parse24To12(timeStr?: string): { hour12: number; minute: string; period: 'AM' | 'PM' } {
  if (!timeStr || typeof timeStr !== 'string') {
    return { hour12: 9, minute: '00', period: 'AM' }
  }

  const parts = timeStr.trim().split(':')
  let hours = parseInt(parts[0], 10)
  let minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0

  if (isNaN(hours) || hours < 0 || hours > 23) hours = 9
  if (isNaN(minutes) || minutes < 0 || minutes > 59) minutes = 0

  const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM'
  let hour12 = hours % 12
  if (hour12 === 0) hour12 = 12

  const minute = minutes.toString().padStart(2, '0')
  return { hour12, minute, period }
}

/**
 * Converts 12-hour time components back to canonical 24-hour "HH:mm" format.
 */
export function format12To24(hour12: number, minute: string, period: 'AM' | 'PM'): string {
  let h = hour12 % 12
  if (period === 'PM') h += 12
  const hStr = h.toString().padStart(2, '0')
  const m = parseInt(minute, 10)
  const mStr = (isNaN(m) ? 0 : m).toString().padStart(2, '0')
  return `${hStr}:${mStr}`
}

/**
 * Modern 12-hour Time Picker component with interactive AM/PM selector.
 */
export const TimeSelect: React.FC<TimeSelectProps> = ({
  value = '09:00',
  onChange,
  disabled = false,
  className = '',
  ariaLabelPrefix = 'Time',
  variant = 'segmented',
}) => {
  const { hour12, minute, period } = useMemo(() => parse24To12(value), [value])

  // Preserve non-standard minute values if present in existing data
  const minuteOptions = useMemo(() => {
    if (DEFAULT_MINUTES.includes(minute)) return DEFAULT_MINUTES
    return [...DEFAULT_MINUTES, minute].sort((a, b) => Number(a) - Number(b))
  }, [minute])

  const handleHourChange = (newHour: number) => {
    const next24 = format12To24(newHour, minute, period)
    onChange(next24)
  }

  const handleMinuteChange = (newMinute: string) => {
    const next24 = format12To24(hour12, newMinute, period)
    onChange(next24)
  }

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    if (newPeriod === period) return
    const next24 = format12To24(hour12, minute, newPeriod)
    onChange(next24)
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-xl border bg-background px-2.5 py-1 text-xs shadow-2xs transition focus-within:ring-2 focus-within:ring-primary/20 ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
    >
      <Clock className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0 select-none" />

      {/* Hour Selector */}
      <select
        disabled={disabled}
        value={hour12}
        onChange={(e) => handleHourChange(Number(e.target.value))}
        aria-label={`${ariaLabelPrefix} Hour`}
        className="bg-transparent font-semibold text-xs focus:outline-none cursor-pointer py-0.5 text-foreground font-mono dark:bg-card dark:text-foreground"
      >
        {HOURS.map((h) => (
          <option
            key={h}
            value={h}
            className="bg-card text-card-foreground dark:bg-slate-900 dark:text-slate-100 py-1"
          >
            {h < 10 ? `0${h}` : h}
          </option>
        ))}
      </select>

      <span className="text-xs font-bold text-muted-foreground select-none">:</span>

      {/* Minute Selector */}
      <select
        disabled={disabled}
        value={minute}
        onChange={(e) => handleMinuteChange(e.target.value)}
        aria-label={`${ariaLabelPrefix} Minute`}
        className="bg-transparent font-semibold text-xs focus:outline-none cursor-pointer py-0.5 text-foreground font-mono dark:bg-card dark:text-foreground"
      >
        {minuteOptions.map((m) => (
          <option
            key={m}
            value={m}
            className="bg-card text-card-foreground dark:bg-slate-900 dark:text-slate-100 py-1"
          >
            {m}
          </option>
        ))}
      </select>

      {/* AM/PM Selector */}
      {variant === 'dropdown' ? (
        <select
          disabled={disabled}
          value={period}
          onChange={(e) => handlePeriodChange(e.target.value as 'AM' | 'PM')}
          aria-label={`${ariaLabelPrefix} AM/PM selector`}
          className="ml-1 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-md px-1.5 py-0.5 border border-primary/20 focus:outline-none cursor-pointer dark:bg-primary/20 dark:text-primary"
        >
          <option value="AM" className="bg-card text-card-foreground dark:bg-slate-900 dark:text-slate-100">
            AM
          </option>
          <option value="PM" className="bg-card text-card-foreground dark:bg-slate-900 dark:text-slate-100">
            PM
          </option>
        </select>
      ) : (
        <div
          className="inline-flex rounded-lg bg-secondary/80 p-0.5 border text-[11px] font-bold shrink-0 ml-0.5"
          role="group"
          aria-label={`${ariaLabelPrefix} AM/PM selector`}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => handlePeriodChange('AM')}
            className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer select-none ${
              period === 'AM'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={period === 'AM'}
            aria-label={`${ariaLabelPrefix} AM`}
          >
            AM
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handlePeriodChange('PM')}
            className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer select-none ${
              period === 'PM'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={period === 'PM'}
            aria-label={`${ariaLabelPrefix} PM`}
          >
            PM
          </button>
        </div>
      )}
    </div>
  )
}
