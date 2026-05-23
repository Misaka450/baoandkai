const store = new Map<string, { value: any; expires: number }>();

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
    store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
  },

  async delete(key: string): Promise<void> {
    store.delete(key);
  },
  
  // 方便调试与清除
  clear() {
    store.clear();
  }
};
