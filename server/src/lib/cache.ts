/**
 * 内存缓存模块
 * 
 * 基于 LRU（最近最少使用）策略的内存缓存，带 TTL 支持。
 * 超过最大条目数时自动淘汰最久未访问的条目。
 * 每 5 分钟自动清理过期条目，避免内存泄漏。
 */

interface CacheEntry {
  value: any;
  expires: number;
}

/** 缓存最大条目数，防止无限增长导致 OOM */
const MAX_SIZE = 5000;

/** 自动清理过期条目的间隔（毫秒） */
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// 使用 Map 的插入顺序特性实现 LRU：每次访问时删除再重新插入，使其移到末尾
const store = new Map<string, CacheEntry>();

/**
 * 淘汰最久未访问的条目，直到低于最大容量
 * Map 的迭代顺序即为插入顺序，最早插入（最久未访问）的条目在前面
 */
function evictIfNeeded(): void {
  if (store.size < MAX_SIZE) return;

  // LRU 淘汰：删除最前面的 20%（即最久未访问的条目）
  const deleteCount = Math.ceil(MAX_SIZE * 0.2);
  let deleted = 0;
  for (const key of store.keys()) {
    if (deleted >= deleteCount) break;
    store.delete(key);
    deleted++;
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
    // LRU：将访问的条目移到 Map 末尾（删除再重新插入）
    store.delete(key);
    store.set(key, entry);
    return entry.value as T;
  },

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    // 写入前检查容量，避免无限增长
    evictIfNeeded();
    // 如果 key 已存在，先删除以更新位置到末尾
    store.delete(key);
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
