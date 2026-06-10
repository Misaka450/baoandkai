/**
 * 服务端输入验证和安全检测工具
 * 
 * 设计原则：
 * - 数据以原始形式存储，不做转义（JSON API + React 自动处理输出转义）
 * - 检测到 XSS/SQL 注入特征时直接拒绝请求（返回 400）
 * - 只做 trim 级别的清洗，不做字符级别的转义
 */

// 危险HTML标签和事件属性正则
const XSS_PATTERN = /<\s*script|<\s*\/script|javascript:|on\w+\s*=|<\s*iframe|<\s*object|<\s*embed|<\s*form/gi
// SQL注入关键词正则（仅用于基础检测，参数化查询是主要防线）
const SQL_INJECTION_PATTERN = /(\b(union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+\w+\s+set)\b)/gi

/**
 * 验证字符串是否包含XSS攻击特征
 * 检测到则拒绝请求，而非转义存储
 */
export function hasXSS(input: string): boolean {
    if (typeof input !== 'string') return false
    XSS_PATTERN.lastIndex = 0 // 重置 lastIndex 避免 g 标志的状态残留
    return XSS_PATTERN.test(input)
}

/**
 * 验证字符串是否包含SQL注入特征
 * 参数化查询是主要防线，此函数仅作辅助检测
 */
export function hasSQLInjection(input: string): boolean {
    if (typeof input !== 'string') return false
    SQL_INJECTION_PATTERN.lastIndex = 0
    return SQL_INJECTION_PATTERN.test(input)
}

/**
 * 验证必填字段
 */
export function validateRequired(value: unknown, fieldName: string): string | null {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
        return `${fieldName}不能为空`
    }
    return null
}

/**
 * 验证字符串长度
 */
export function validateLength(value: string, fieldName: string, min: number, max: number): string | null {
    if (value.length < min) return `${fieldName}长度不能少于${min}个字符`
    if (value.length > max) return `${fieldName}长度不能超过${max}个字符`
    return null
}

/**
 * 验证日期格式（YYYY-MM-DD）
 */
export function validateDate(value: string, fieldName: string): string | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${fieldName}日期格式无效，应为YYYY-MM-DD`
    const date = new Date(value)
    if (isNaN(date.getTime())) return `${fieldName}不是有效的日期`
    return null
}

/**
 * 验证评分值（1-5）
 */
export function validateRating(value: number, fieldName: string): string | null {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
        return `${fieldName}评分必须在1-5之间`
    }
    return null
}

/**
 * 验证URL格式
 */
export function validateUrl(value: string, fieldName: string): string | null {
    try {
        new URL(value)
        return null
    } catch {
        return `${fieldName}URL格式无效`
    }
}

/**
 * 批量执行验证器，返回第一个错误
 */
export function validate(rules: (string | null)[]): string | null {
    return rules.find(result => result !== null) || null
}

/**
 * 清理对象中的字符串字段（仅 trim，不做转义）
 * 数据以原始形式存储，由前端 React 自动处理输出转义
 * 
 * @param obj 输入对象
 * @param skipFields 需要跳过处理的字段名（如 images 等 URL 数组）
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T, skipFields: string[] = []): T {
    const result: Record<string, unknown> = { ...obj }
    for (const key of Object.keys(result)) {
        if (skipFields.includes(key)) continue
        const value = result[key]
        if (typeof value === 'string') {
            result[key] = value.trim()
        }
    }
    return result as T
}

/**
 * 常见图片格式的魔数（Magic Number / 文件签名），用于验证文件类型真实性
 * 每个数组元素代表一个有效签名，按字节匹配文件头
 */
const IMAGE_MAGIC_BYTES: Record<string, Uint8Array[]> = {
  'image/jpeg': [new Uint8Array([0xFF, 0xD8, 0xFF])],
  'image/png':  [new Uint8Array([0x89, 0x50, 0x4E, 0x47])],
  'image/gif':  [new Uint8Array([0x47, 0x49, 0x46])],
  'image/webp': [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
};

/**
 * 验证文件是否具有与声明 MIME 类型匹配的文件魔数
 * 防止攻击者将恶意文件伪装成图片上传
 * 
 * @param fileBuffer 文件的前 N 个字节（至少 4 字节即可验证常见图片格式）
 * @param mimeType 文件声明的 MIME 类型
 * @returns true 表示文件魔数与声明类型匹配
 */
export function validateImageMagic(fileBuffer: Uint8Array, mimeType: string): boolean {
  const signatures = IMAGE_MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  return signatures.some(sig =>
    sig.every((byte, i) => i < fileBuffer.length && fileBuffer[i] === byte)
  );
}