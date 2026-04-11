/**
 * 获取 D1 数据库实例
 * @param env Cloudflare 环境对象
 * @returns D1Database 实例
 */
export function getDB(env: { DB: D1Database }): D1Database {
  if (!env.DB) {
    throw new Error('D1 Database not configured')
  }
  return env.DB
}
