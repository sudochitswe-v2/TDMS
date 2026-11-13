import { describe, it, expect } from 'vitest'
import { parseAppVersion, getChannelBadgeStyle } from '../lib/version'

describe('Application Versioning Utility', () => {
  it('parses GitHub release format with +channel', () => {
    const preview = parseAppVersion('1.0.0+preview')
    expect(preview.raw).toBe('1.0.0+preview')
    expect(preview.version).toBe('1.0.0')
    expect(preview.channel).toBe('preview')
    expect(preview.isStable).toBe(false)

    const beta = parseAppVersion('2.0.1+beta')
    expect(beta.version).toBe('2.0.1')
    expect(beta.channel).toBe('beta')
    expect(beta.isStable).toBe(false)
  })

  it('defaults channel to stable when no channel is present', () => {
    const stable = parseAppVersion('1.0.0')
    expect(stable.raw).toBe('1.0.0')
    expect(stable.version).toBe('1.0.0')
    expect(stable.channel).toBe('stable')
    expect(stable.isStable).toBe(true)
  })

  it('handles explicit stable channel', () => {
    const stable = parseAppVersion('1.0.0+stable')
    expect(stable.version).toBe('1.0.0')
    expect(stable.channel).toBe('stable')
    expect(stable.isStable).toBe(true)
  })

  it('provides distinctive badge styling per channel', () => {
    expect(getChannelBadgeStyle('preview')).toContain('amber')
    expect(getChannelBadgeStyle('beta')).toContain('blue')
    expect(getChannelBadgeStyle('alpha')).toContain('purple')
    expect(getChannelBadgeStyle('stable')).toContain('emerald')
  })
})
