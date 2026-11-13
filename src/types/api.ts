/**
 * API 相关类型定义
 */

export interface ApiResponse<T = unknown> {
    data: T | null;
    error: string | null;
}

export interface PaginationInfo {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationInfo;
}

