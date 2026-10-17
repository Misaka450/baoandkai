/**
 * API 相关类型定义
 */

export interface ApiResponse<T = unknown> {
    data: T | null;
    error: string | null;
}

