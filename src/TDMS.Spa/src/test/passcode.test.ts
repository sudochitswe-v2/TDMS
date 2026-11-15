import { describe, it, expect } from 'vitest'
import { getDailyAccessCode, getUtcDailyAccessCode, validateDailyAccessCode } from '../lib/passcode'

describe('passcode utility (daily dynamic DDMMYY access code)', () => {
  it('generates correct DDMMYY format for December 30, 2026 (matching example 301226)', () => {
    const testDate = new Date(2026, 11, 30, 12, 0, 0) // Month 11 = December
    expect(getDailyAccessCode(testDate)).toBe('301226')
  })

  it('zero-pads single digit days and months (e.g. May 4, 2026 -> 040526)', () => {
    const testDate = new Date(2026, 4, 4, 10, 0, 0) // Month 4 = May
    expect(getDailyAccessCode(testDate)).toBe('040526')
  })

  it('validates exact daily code successfully', () => {
    const testDate = new Date(2026, 11, 30, 12, 0, 0)
    expect(validateDailyAccessCode('301226', testDate)).toBe(true)
  })

  it('accepts trimmed input with separators like 30/12/26 or 30-12-26', () => {
    const testDate = new Date(2026, 11, 30, 12, 0, 0)
    expect(validateDailyAccessCode(' 301226 ', testDate)).toBe(true)
    expect(validateDailyAccessCode('30/12/26', testDate)).toBe(true)
    expect(validateDailyAccessCode('30-12-26', testDate)).toBe(true)
  })

  it('accepts 4-digit year variant 30122026', () => {
    const testDate = new Date(2026, 11, 30, 12, 0, 0)
    expect(validateDailyAccessCode('30122026', testDate)).toBe(true)
  })

  it('rejects incorrect codes or expired dates from different times', () => {
    const today = new Date(2026, 11, 30, 12, 0, 0)
    expect(validateDailyAccessCode('123456', today)).toBe(false)
    expect(validateDailyAccessCode('password', today)).toBe(false)
    expect(validateDailyAccessCode('', today)).toBe(false)
    // Code from another month
    expect(validateDailyAccessCode('150126', today)).toBe(false)
  })

  it('changes dynamically as date changes', () => {
    const day1 = new Date(2026, 10, 15, 12, 0, 0) // Nov 15, 2026
    const day2 = new Date(2026, 10, 16, 12, 0, 0) // Nov 16, 2026
    expect(getDailyAccessCode(day1)).toBe('151126')
    expect(getDailyAccessCode(day2)).toBe('161126')
    expect(getDailyAccessCode(day1)).not.toBe(getDailyAccessCode(day2))
  })
})
