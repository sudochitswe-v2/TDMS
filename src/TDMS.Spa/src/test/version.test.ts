import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseAppVersion, getChannelBadgeStyle, fetchAppVersion, CURRENT_APP_VERSION } from '../lib/version'
import { api } from '../lib/api'

describe('Application Versioning Utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

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

  it('does not hardcode preview by default', () => {
    const defaultVer = parseAppVersion()
    expect(defaultVer.channel).not.toBe('preview')
  })

  it('dynamically fetches version from /api/system/version when available', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      raw: '1.2.0+beta',
      version: '1.2.0',
      channel: 'beta',
      isStable: false,
    })

    const result = await fetchAppVersion()
    expect(result.raw).toBe('1.2.0+beta')
    expect(result.version).toBe('1.2.0')
    expect(result.channel).toBe('beta')
    expect(result.isStable).toBe(false)
  })

  it('gracefully falls back on API failure without throwing', async () => {
    vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Network error'))

    const result = await fetchAppVersion()
    expect(result).toBeDefined()
    expect(result.raw).toBe(CURRENT_APP_VERSION.raw)
  })
})
