import * as Sentry from "@sentry/react"
import { API_BASE } from '../config/api'

import { ApiResponse, Note, Todo, Album, TimelineEvent, MapCheckin } from '../types'

/**
 * 请求配置接口
 */
interface RequestConfig extends Omit<RequestInit, 'signal'> {
    headers?: Record<string, string>
    signal?: AbortSignal
    timeout?: number // 超时时间（毫秒）
}

/**
 * 统一的API服务类
 * 提供统一的错误处理、请求取消和超时处理
 */
class ApiService {
    private baseURL: string
    private defaultTimeout: number = 30000 // 默认30秒超时

    constructor() {
        this.baseURL = API_BASE
    }

    /**
     * 创建带超时的 AbortController
     */
    private createTimeoutController(timeout: number, externalSignal?: AbortSignal): { controller: AbortController; cleanup: () => void } {
        const controller = new AbortController()

        // 超时自动取消
        const timeoutId = setTimeout(() => {
            controller.abort(new DOMException('Request timeout', 'TimeoutError'))
        }, timeout)

        // 如果传入外部 signal，当外部取消时也取消此请求
        if (externalSignal) {
            externalSignal.addEventListener('abort', () => {
                controller.abort(externalSignal.reason)
            })
        }

        const cleanup = () => clearTimeout(timeoutId)

        return { controller, cleanup }
    }

    /**
     * 通用请求方法
     */
    async request<T = unknown>(endpoint: string, options: RequestConfig = {}): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`
        const timeout = options.timeout ?? this.defaultTimeout

        // 创建超时控制器
        const { controller, cleanup } = this.createTimeoutController(timeout, options.signal)

        // 获取Token
        const token = localStorage.getItem('token')

        const config: RequestInit = {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers,
            },
        }

        try {
            const response = await fetch(url, config)
            cleanup() // 清理超时定时器

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
            cleanup() // 确保清理超时定时器

            // 处理请求取消
            if (error instanceof DOMException && error.name === 'AbortError') {
                return { data: null, error: 'Request cancelled' }
            }

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

    /**
     * 上传文件（带进度回调）
     * @param endpoint 上传端点
     * @param formData 表单数据
     * @param onProgress 进度回调函数，接收 { percent: 百分比, speed: 速率(KB/s), loaded: 已上传字节, total: 总字节 }
     */
    uploadWithProgress<T = unknown>(
        endpoint: string,
        formData: FormData,
        onProgress?: (progress: { percent: number; speed: number; loaded: number; total: number }) => void
    ): Promise<ApiResponse<T>> {
        return new Promise((resolve) => {
            const url = `${this.baseURL}${endpoint}`
            const token = localStorage.getItem('token')
            const xhr = new XMLHttpRequest()
            let startTime = Date.now()
            let lastLoaded = 0

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    const now = Date.now()
                    const elapsed = (now - startTime) / 1000 // 秒
                    const bytesLoaded = e.loaded - lastLoaded
                    const speed = elapsed > 0 ? (bytesLoaded / 1024) / elapsed : 0 // KB/s

                    // 更新基准
                    startTime = now
                    lastLoaded = e.loaded

                    onProgress({
                        percent: Math.round((e.loaded / e.total) * 100),
                        speed: Math.round(speed),
                        loaded: e.loaded,
                        total: e.total
                    })
                }
            })

            xhr.addEventListener('load', () => {
                if (xhr.status === 401) {
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login'
                    }
                    resolve({ data: null, error: 'Unauthorized' })
                    return
                }

                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data: T = JSON.parse(xhr.responseText)
                        resolve({ data, error: null })
                    } catch {
                        resolve({ data: null, error: 'Failed to parse response' })
                    }
                } else {
                    resolve({ data: null, error: `Upload failed! status: ${xhr.status}` })
                }
            })

            xhr.addEventListener('error', () => {
                resolve({ data: null, error: 'Network error' })
            })

            xhr.addEventListener('abort', () => {
                resolve({ data: null, error: 'Upload cancelled' })
            })

            xhr.open('POST', url)
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`)
            }
            xhr.send(formData)
        })
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

    async getById(id: string) {
        return apiService.get<Album & { photos: { id: string; url: string; caption?: string }[] }>(`/albums/${id}`)
    },

    async create(album: Omit<Album, 'id'>) {
        return apiService.post<Album>('/albums', album)
    },

    async update(id: string, album: Partial<Album>) {
        return apiService.put<Album>(`/albums/${id}`, album)
    },

    async delete(id: string) {
        return apiService.delete(`/albums/${id}`)
    }
}

export const timelineService = {
    async getAll(page: number = 1, limit: number = 10) {
        return apiService.get<{ data: TimelineEvent[]; pagination: { totalPages: number } }>(`/timeline?page=${page}&limit=${limit}`)
    },

    async create(event: Omit<TimelineEvent, 'id'>) {
        return apiService.post<TimelineEvent>('/timeline', event)
    },

    async update(id: number | string, event: Partial<TimelineEvent>) {
        return apiService.put<TimelineEvent>(`/timeline/${id}`, event)
    },

    async delete(id: number | string) {
        return apiService.delete(`/timeline/${id}`)
    }
}

/**
 * 创建可取消的请求 Hook 辅助函数
 * 用于 React 组件中管理请求生命周期
 */
export function createAbortController(): AbortController {
    return new AbortController()
}

export const mapService = {
    async getAll(province?: string) {
        const query = province ? `?province=${encodeURIComponent(province)}` : ''
        return apiService.get<{ data: MapCheckin[] }>(`/map${query}`)
    },

    async create(checkin: Omit<MapCheckin, 'id'>) {
        return apiService.post<MapCheckin>('/map', checkin)
    },

    async update(id: number | string, checkin: Partial<MapCheckin>) {
        return apiService.put<MapCheckin>(`/map/${id}`, checkin)
    },

    async delete(id: number | string) {
        return apiService.delete(`/map/${id}`)
    }
}
