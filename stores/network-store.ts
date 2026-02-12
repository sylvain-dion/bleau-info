import { create } from 'zustand'

export interface NetworkState {
  isOnline: boolean
  hasDownloadedContent: boolean
  setOnline: () => void
  setOffline: () => void
  setDownloadedContent: (hasContent: boolean) => void
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  hasDownloadedContent: false,
  setOnline: () => set({ isOnline: true }),
  setOffline: () => set({ isOnline: false }),
  setDownloadedContent: (hasContent: boolean) =>
    set({ hasDownloadedContent: hasContent }),
}))
