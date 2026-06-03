import { create } from 'zustand'
import { followApi } from '@/services/FollowService'
import type { IUser } from '@/types/User'
import type { FollowStatus } from '@/types/Follow'

/**
 * Store follow — porting dello store Pinia (frontend/src/stores/followStore.ts).
 * Nota: l'originale leggeva `error.response?.data?.message` (residuo axios); con
 * FollowService basato su fetch quel campo è sempre undefined, quindi usiamo `error.message`.
 */

interface FollowState {
  followedUsers: Set<string>
  followStatusCache: Map<string, FollowStatus>
  loading: boolean
  error: string | null

  isFollowing: (userId: string) => boolean
  getFollowStatus: (userId: string) => FollowStatus | undefined

  followUser: (userId: string) => Promise<void>
  unfollowUser: (userId: string) => Promise<void>
  toggleFollow: (userId: string) => Promise<void>
  loadFollowStatus: (userId: string, forceRefresh?: boolean) => Promise<FollowStatus>
  loadFollowers: (userId: string) => Promise<IUser[]>
  loadFollowing: (userId: string) => Promise<IUser[]>
  getFollowersCount: (userId: string) => Promise<number>
  getFollowingCount: (userId: string) => Promise<number>
  loadUserFollowStats: (userId: string) => Promise<{ followersCount: number; followingCount: number }>
  clearError: () => void
  clearCache: () => void
}

function msg(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

export const useFollowStore = create<FollowState>((set, get) => ({
  followedUsers: new Set<string>(),
  followStatusCache: new Map<string, FollowStatus>(),
  loading: false,
  error: null,

  isFollowing: (userId) => get().followedUsers.has(userId),
  getFollowStatus: (userId) => get().followStatusCache.get(userId),

  followUser: async (userId) => {
    try {
      set({ loading: true, error: null })
      await followApi.followUser(userId)
      const followed = new Set(get().followedUsers)
      followed.add(userId)
      const cache = new Map(get().followStatusCache)
      const cur = cache.get(userId)
      if (cur) cache.set(userId, { ...cur, isFollowing: true })
      set({ followedUsers: followed, followStatusCache: cache })
    } catch (error) {
      set({ error: msg(error, 'Errore durante il follow') })
      console.error('❌ [followStore] Errore follow:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  unfollowUser: async (userId) => {
    try {
      set({ loading: true, error: null })
      await followApi.unfollowUser(userId)
      const followed = new Set(get().followedUsers)
      followed.delete(userId)
      const cache = new Map(get().followStatusCache)
      const cur = cache.get(userId)
      if (cur) cache.set(userId, { ...cur, isFollowing: false })
      set({ followedUsers: followed, followStatusCache: cache })
    } catch (error) {
      set({ error: msg(error, "Errore durante l'unfollow") })
      console.error('❌ [followStore] Errore unfollow:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  toggleFollow: async (userId) => {
    if (get().isFollowing(userId)) {
      await get().unfollowUser(userId)
    } else {
      await get().followUser(userId)
    }
  },

  loadFollowStatus: async (userId, forceRefresh = false) => {
    if (!forceRefresh && get().followStatusCache.has(userId)) {
      return get().followStatusCache.get(userId)!
    }
    const status = await followApi.getFollowStatus(userId)
    const cache = new Map(get().followStatusCache)
    cache.set(userId, status)
    const followed = new Set(get().followedUsers)
    if (status.isFollowing) followed.add(userId)
    else followed.delete(userId)
    set({ followStatusCache: cache, followedUsers: followed })
    return status
  },

  loadFollowers: async (userId) => {
    try {
      set({ loading: true })
      return await followApi.getFollowers(userId)
    } catch (error) {
      set({ error: msg(error, 'Errore nel caricamento dei followers') })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  loadFollowing: async (userId) => {
    try {
      set({ loading: true })
      return await followApi.getFollowing(userId)
    } catch (error) {
      set({ error: msg(error, 'Errore nel caricamento del following') })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  getFollowersCount: async (userId) => {
    try {
      return (await get().loadFollowers(userId)).length
    } catch {
      return 0
    }
  },

  getFollowingCount: async (userId) => {
    try {
      return (await get().loadFollowing(userId)).length
    } catch {
      return 0
    }
  },

  loadUserFollowStats: async (userId) => {
    try {
      const [followersCount, followingCount] = await Promise.all([
        get().getFollowersCount(userId),
        get().getFollowingCount(userId),
      ])
      return { followersCount, followingCount }
    } catch {
      return { followersCount: 0, followingCount: 0 }
    }
  },

  clearError: () => set({ error: null }),
  clearCache: () =>
    set({
      followedUsers: new Set<string>(),
      followStatusCache: new Map<string, FollowStatus>(),
      error: null,
      loading: false,
    }),
}))
