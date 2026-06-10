/**
 * 内存缓存模块
 * 
 * 带容量限制和 TTL 的简单内存缓存。
 * 超过最大条目数时自动淘汰最早过期的条目。
 * 每 5 分钟自动清理过期条目，避免内存泄漏。
 */

const store = new Map<string, { value: any; expires: number }>();

/** 缓存最大条目数，防止无限增长导致 OOM */
const MAX_SIZE = 5000;

/** 自动清理过期条目的间隔（毫秒） */
const CLEANUP_INTERVAL = 5 * 60 * 1000;

/**
 * 淘汰最早过期的条目，直到低于最大容量
 */
function evictIfNeeded(): void {
  if (store.size < MAX_SIZE) return;

  // 按过期时间排序，删除最早过期的
  const entries = [...store.entries()].sort((a, b) => a[1].expires - b[1].expires);
  const deleteCount = Math.ceil(MAX_SIZE * 0.2); // 一次淘汰 20%

  for (let i = 0; i < deleteCount && i < entries.length; i++) {
    const entry = entries[i]!;
    store.delete(entry[0]);
  }
}

/**
 * 清理所有已过期的条目
 */
function cleanupExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.expires) {
      store.delete(key);
    }
  }
}

// 启动定时清理（仅在服务器首次加载时启动一次）
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function ensureCleanupTimer(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(cleanupExpired, CLEANUP_INTERVAL);
  // 允许 Node.js 在只有这个定时器时退出进程
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}
ensureCleanupTimer();

export const cache = {
  async get<T = string>(key: string): Promise<T | null> {
    const entry = store.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() > entry.expires) {
      store.delete(key);
      return null;
    }
    return entry.value as T;
  },

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    // 写入前检查容量，避免无限增长
    evictIfNeeded();
    store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
  },

  async delete(key: string): Promise<void> {
    store.delete(key);
  },

  /** 清空所有缓存 */
  clear() {
    store.clear();
  },

  /** 获取当前缓存条目数（用于监控/调试） */
  size(): number {
    return store.size;
  },
};