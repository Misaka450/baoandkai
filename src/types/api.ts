/**
 * API 相关类型定义
 */

export interface ApiResponse<T = unknown> {
    data: T | null;
    error: string | null;
}

export interface AuthResponse {
    success: boolean;
    token: string;
    user: {
        id: number | string;
        username: string;
        email?: string;
        role: string;
    };
}
