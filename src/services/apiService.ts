import * as Sentry from "@sentry/react"
import { API_BASE } from '../config/api'

import { ApiResponse, Note, Todo, Album } from '../types'

/**
 * 请求配置接口
 */
interface RequestConfig extends RequestInit {
    headers?: Record<string, string>
}

/**
 * 统一的API服务类
 * 提供统一的错误处理和请求封装
 */
class ApiService {
    private baseURL: string

    constructor() {
        this.baseURL = API_BASE
    }

    /**
     * 通用请求方法
     */
    async request<T = unknown>(endpoint: string, options: RequestConfig = {}): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`

        // 获取Token
        const token = localStorage.getItem('token')

        const config: RequestConfig = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers,
            },
        }

        try {
            const response = await fetch(url, config)

            if (response.status === 401) {
                localStorage.removeItem('token')
                localStorage.removeItem('user')

                // 如果是401且不在登录页，重定向到登录页
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login'
                }
                return { data: null, error: 'Unauthorized' }
            }

            if (!response.ok) {
                // 对于非200响应，尝试获取错误信息
                let errorData: { error?: string; message?: string } | null = null
                try {
                    const contentType = response.headers.get('content-type')
                    if (contentType && contentType.includes('application/json')) {
                        errorData = await response.json()
                    }
                } catch {
                    // 忽略JSON解析错误
                }
                const errorMessage = errorData?.error || errorData?.message || `HTTP error! status: ${response.status}`

                // 上报异常到 Sentry
                Sentry.captureException(new Error(errorMessage), {
                    extra: {
                        url,
                        status: response.status,
                        endpoint
                    }
                })

                return { data: null, error: errorMessage }
            }

            // 检查响应是否为JSON格式
            const contentType = response.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                return { data: null, error: 'Response is not JSON format' }
            }

            // 尝试解析JSON
            let data: T
            try {
                data = await response.json()
            } catch {
                return { data: null, error: 'Failed to parse JSON response' }
            }

            return { data, error: null }
        } catch (error) {
            // 捕获网络或其他运行时错误
            Sentry.captureException(error, {
                extra: { url, endpoint }
            })
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            return { data: null, error: errorMessage }
        }
    }

    /**
     * GET请求
     */
    async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET' })
    }

    /**
     * POST请求
     */
    async post<T = unknown, D = unknown>(endpoint: string, data?: D): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        })
    }

    /**
     * PUT请求
     */
    async put<T = unknown, D = unknown>(endpoint: string, data?: D): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        })
    }

    /**
     * DELETE请求
     */
    async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' })
    }

    /**
     * 上传文件
     */
    async upload<T = unknown>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`
        const token = localStorage.getItem('token')

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: formData,
            })

            if (response.status === 401) {
                localStorage.removeItem('token')
                localStorage.removeItem('user')

                if (window.location.pathname !== '/login') {
                    window.location.href = '/login'
                }
                return { data: null, error: 'Unauthorized' }
            }

            if (!response.ok) {
                return { data: null, error: `Upload failed! status: ${response.status}` }
            }

            const data: T = await response.json()
            return { data, error: null }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Upload failed'
            return { data: null, error: errorMessage }
        }
    }
}

// 创建单例实例
export const apiService = new ApiService()

// 类型已移动到 src/types/models.ts

// 专用API服务
export const notesService = {
    async getAll() {
        return apiService.get<{ data: Note[] }>('/notes')
    },

    async create(note: Omit<Note, 'id'>) {
        return apiService.post<Note>('/notes', note)
    },

    async update(id: number | string, note: Partial<Note>) {
        return apiService.put<Note>(`/notes/${id}`, note)
    },

    async delete(id: number | string) {
        return apiService.delete(`/notes/${id}`)
    }
}

export const todosService = {
    async getAll() {
        return apiService.get<{ data: Todo[] }>('/todos')
    },

    async create(todo: Omit<Todo, 'id'>) {
        return apiService.post<Todo>('/todos', todo)
    },

    async update(id: number | string, todo: Partial<Todo>) {
        return apiService.put<Todo>(`/todos/${id}`, todo)
    },

    async delete(id: number | string) {
        return apiService.delete(`/todos/${id}`)
    }
}

export const albumsService = {
    async getAll() {
        return apiService.get<{ data: Album[] }>('/albums')
    },

    async create(album: Omit<Album, 'id'>) {
        return apiService.post<Album>('/albums', album)
    }
}
