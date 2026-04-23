interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = Record<string, unknown>>(): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>
  run(): Promise<{ meta: { last_row_id?: number; changes?: number } }>
}

interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>
}

interface R2ObjectBody {
  body: ReadableStream | null
  httpEtag?: string
  httpMetadata?: {
    contentType?: string
    cacheControl?: string
  }
  writeHttpMetadata(headers: Headers): void
}

interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob | null,
    options?: {
      httpMetadata?: {
        contentType?: string
        cacheControl?: string
      }
    }
  ): Promise<void>
  delete(key: string): Promise<void>
}

interface KVNamespace {
  get(key: string): Promise<string | null>
  get<T>(key: string, options: { type: 'json' }): Promise<T | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

interface CacheStorage {
  readonly default: Cache
}
