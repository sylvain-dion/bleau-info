import { useEffect } from 'react'
import { useNetworkStore } from '@/stores/network-store'

export function useNetworkStatus() {
  const { isOnline, hasDownloadedContent, setOnline, setOffline } =
    useNetworkStore()

  useEffect(() => {
    // Set initial state based on navigator.onLine
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setOffline()
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setOnline()
    }

    const handleOffline = () => {
      setOffline()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline, setOffline])

  return {
    isOnline,
    isOffline: !isOnline,
    hasDownloadedContent,
  }
}
