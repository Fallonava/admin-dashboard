/**
 * rate-limit.ts
 *
 * In-memory rate limiter
 *
 * Usage:
 *   const allowed = await checkRateLimit('login_1.2.3.4', 5, 15 * 60 * 1000);
 */

// ─── In-memory store ───
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryCleanup() {
  const now = Date.now();
  if (memoryStore.size > 500) {
    for (const [key, val] of memoryStore) {
      if (val.resetAt < now) memoryStore.delete(key);
    }
  }
}

// ─── In-memory limit check ───
function checkRateLimitMemory(
  identifier: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  let record = memoryStore.get(identifier);

  if (!record || record.resetAt < now) {
    record = { count: 1, resetAt: now + windowMs };
  } else {
    record.count += 1;
  }

  memoryStore.set(identifier, record);
  memoryCleanup();

  return record.count <= limit;
}

// ─── Public API ───
/**
 * Check if an identifier is within the rate limit.
 *
 * @param identifier  Unique key (e.g. "login_192.168.1.1")
 * @param limit       Max requests allowed in the window
 * @param windowMs    Window duration in milliseconds
 * @returns true if request is allowed, false if rate limit exceeded
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  return checkRateLimitMemory(identifier, limit, windowMs);
}
