/**
 * RBAC Permission Cache
 *
 * In-memory map cache for per-user permissions.
 * Bypasses DB lookups for subsequent API requests.
 */

import type { SessionPayload } from './auth-shared';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  permissions: SessionPayload['permissions'];
  expiresAt: number;
}

// ─── In-memory Map Cache ───
const rbacCacheStore = new Map<string, CacheEntry>();

function cleanExpiredEntries() {
  const now = Date.now();
  if (rbacCacheStore.size > 100) {
    for (const [key, value] of rbacCacheStore) {
      if (value.expiresAt < now) {
        rbacCacheStore.delete(key);
      }
    }
  }
}

// ─── Public API ───

export async function getCachedPermissions(
  userId: string
): Promise<SessionPayload['permissions'] | null> {
  const entry = rbacCacheStore.get(userId);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    rbacCacheStore.delete(userId);
    return null;
  }

  return entry.permissions;
}

export async function setCachedPermissions(
  userId: string,
  permissions: SessionPayload['permissions']
): Promise<void> {
  rbacCacheStore.set(userId, {
    permissions,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  cleanExpiredEntries();
}

export async function invalidateRbacCache(userId: string): Promise<void> {
  rbacCacheStore.delete(userId);
}

export async function isRbacCacheAvailable(): Promise<boolean> {
  return true; // Always available in-memory
}
