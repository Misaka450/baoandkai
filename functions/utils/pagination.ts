/**
 * API 分页工具
 * 为列表接口提供统一的分页参数解析和响应格式
 */

/**
 * 分页请求参数
 */
export interface PaginationParams {
    page: number
    pageSize: number
    offset: number
}

/**
 * 分页响应格式
 */
export interface PaginatedResponse<T> {
    data: T[]
    pagination: {
        page: number
        pageSize: number
        total: number
        totalPages: number
    }
}

/**
 * 从 URL 查询参数中解析分页参数
 * @param url 请求 URL
 * @param defaultPageSize 默认每页条数
 * @param maxPageSize 最大每页条数
 */
export function parsePagination(url: URL, defaultPageSize = 20, maxPageSize = 100): PaginationParams {
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
    const pageSize = Math.min(maxPageSize, Math.max(1, parseInt(url.searchParams.get('pageSize') || String(defaultPageSize), 10) || defaultPageSize))
    const offset = (page - 1) * pageSize

    return { page, pageSize, offset }
}

/**
 * 构建分页响应
 * @param data 当前页数据
 * @param total 总记录数
 * @param params 分页参数
 */
export function buildPaginatedResponse<T>(data: T[], total: number, params: PaginationParams): PaginatedResponse<T> {
    return {
        data,
        pagination: {
            page: params.page,
            pageSize: params.pageSize,
            total,
            totalPages: Math.ceil(total / params.pageSize),
        }
    }
}
