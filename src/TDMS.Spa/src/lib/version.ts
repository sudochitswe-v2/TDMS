import { useQuery } from '@tanstack/react-query'
import { api } from './api'

export interface AppVersionInfo {
  raw: string
  version: string
  channel: string
  isStable: boolean
}

// Initial fallback version; can be overridden via VITE_APP_VERSION at build time,
// but runtime will dynamically fetch the active version from the backend API (/api/system/version).
export const APP_VERSION_RAW = (import.meta.env?.VITE_APP_VERSION as string | undefined) || '1.0.0'

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

/**
 * Fetches the application version from the backend API (/api/system/version).
 * If unavailable or offline, gracefully falls back to the static fallback version.
 */
export async function fetchAppVersion(): Promise<AppVersionInfo> {
  try {
    const res = await api.get<{ raw?: string; version?: string; channel?: string; isStable?: boolean }>('/api/system/version')
    if (res && res.raw) {
      return parseAppVersion(res.raw)
    }
  } catch {
    // Graceful fallback for offline, tests, or initial load
  }
  return CURRENT_APP_VERSION
}

/**
 * Hook to retrieve the dynamic application version from the backend API.
 * Uses TanStack Query for caching and automatic state synchronization across the React app.
 */
export function useAppVersion(): AppVersionInfo {
  const { data } = useQuery<AppVersionInfo>({
    queryKey: ['systemAppVersion'],
    queryFn: fetchAppVersion,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    refetchOnWindowFocus: false,
    placeholderData: CURRENT_APP_VERSION,
  })

  return data ?? CURRENT_APP_VERSION
}
