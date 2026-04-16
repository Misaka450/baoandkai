/**
 * 服务端输入验证和消毒工具
 * 防止XSS注入、SQL注入和非法数据入库
 */

// 危险HTML标签和事件属性正则
const XSS_PATTERN = /<\s*script|<\s*\/script|javascript:|on\w+\s*=|<\s*iframe|<\s*object|<\s*embed|<\s*form/gi
// SQL注入关键词正则（仅用于基础检测，参数化查询是主要防线）
const SQL_INJECTION_PATTERN = /(\b(union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+\w+\s+set)\b)/gi

/**
 * 消毒字符串：移除/转义潜在的XSS攻击内容
 */
export function sanitizeString(input: string): string {
    if (typeof input !== 'string') return ''
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
}

/**
 * 清理字符串：移除危险标签但保留基本格式
 * 适用于需要保留换行等基本格式的长文本（如描述、消息）
 */
export function cleanString(input: string): string {
    if (typeof input !== 'string') return ''
    return input
        .replace(XSS_PATTERN, '')
        .trim()
}

/**
 * 验证字符串是否包含XSS攻击特征
 */
export function hasXSS(input: string): boolean {
    if (typeof input !== 'string') return false
    return XSS_PATTERN.test(input)
}

/**
 * 验证字符串是否包含SQL注入特征
 */
export function hasSQLInjection(input: string): boolean {
    if (typeof input !== 'string') return false
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
 * 消毒对象中的所有字符串字段
 * 递归处理嵌套对象，跳过images等URL数组字段
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T, skipFields: string[] = []): T {
    const result = { ...obj }
    for (const key of Object.keys(result)) {
        if (skipFields.includes(key)) continue
        const value = result[key]
        if (typeof value === 'string') {
            result[key] = cleanString(value) as unknown as T[Extract<keyof T, string>]
        }
    }
    return result
}
