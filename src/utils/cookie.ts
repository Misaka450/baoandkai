/**
 * 浏览器 Cookie 工具函数
 * 统一管理前端 Cookie 的读取和删除操作
 */

/**
 * 从浏览器 Cookie 中读取指定名称的值
 * @param name Cookie 名称
 * @returns Cookie 值，不存在则返回 null
 */
export function getCookieValue(name: string): string | null {
  const match = document.cookie.split(';').find(c => c.trim().startsWith(`${name}=`))
  return match ? match.split('=').slice(1).join('=').trim() : null
}

/**
 * 删除指定名称的浏览器 Cookie
 * @param name Cookie 名称
 */
export function deleteCookie(name: string): void {
  document.cookie = `${name}=; Max-Age=0; Path=/; Secure; SameSite=Strict`
}
