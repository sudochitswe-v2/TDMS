export interface AppVersionInfo {
  raw: string
  version: string
  channel: string
  isStable: boolean
}

export const APP_VERSION_RAW = '1.0.0+preview'

/**
 * Parses GitHub releases versioning: MAJOR.MINOR.PATCH+channel
 * If no channel is specified in the version string, the channel defaults to 'stable'.
 */
export function parseAppVersion(versionStr?: string): AppVersionInfo {
  const raw = (versionStr || APP_VERSION_RAW).trim()
  
  // Check for +channel or -channel
  const plusIdx = raw.indexOf('+')
  const hyphenIdx = raw.indexOf('-')
  const sepIdx = plusIdx !== -1 ? plusIdx : hyphenIdx

  if (sepIdx !== -1) {
    const version = raw.substring(0, sepIdx)
    const channel = raw.substring(sepIdx + 1).toLowerCase()
    return {
      raw,
      version: version || raw,
      channel: channel || 'stable',
      isStable: (channel || 'stable') === 'stable',
    }
  }

  return {
    raw,
    version: raw,
    channel: 'stable',
    isStable: true,
  }
}

export const CURRENT_APP_VERSION = parseAppVersion(APP_VERSION_RAW)

export function getChannelBadgeStyle(channel: string): string {
  const norm = channel.toLowerCase()
  switch (norm) {
    case 'preview':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
    case 'beta':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25'
    case 'alpha':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25'
    case 'rc':
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25'
    case 'stable':
    default:
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
  }
}
