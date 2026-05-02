import * as Sentry from "@sentry/react"
import { API_BASE } from '../config/api'
import { getCookieValue } from '../utils/cookie'

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
 * 使用HttpOnly Cookie认证 + CSRF Token防护
 */
class ApiService {
    private baseURL: string
    private defaultTimeout: number = 30000

    constructor() {
        this.baseURL = API_BASE
    }

    /**
     * 创建带超时的 AbortController
     */
    private createTimeoutController(timeout: number, externalSignal?: AbortSignal): { controller: AbortController; cleanup: () => void } {
        const controller = new AbortController()

        const timeoutId = setTimeout(() => {
            controller.abort(new DOMException('Request timeout', 'TimeoutError'))
        }, timeout)

        if (externalSignal) {
            externalSignal.addEventListener('abort', () => {
                controller.abort(externalSignal.reason)
            })
        }

        const cleanup = () => clearTimeout(timeoutId)

        return { controller, cleanup }
    }

    /**
     * 构建请求头，包含CSRF Token（非GET请求）
     * Cookie由浏览器自动携带（credentials: same-origin）
     */
    private buildHeaders(method: string, extraHeaders?: Record<string, string>): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...extraHeaders,
        }

        // 非GET请求添加CSRF Token头
        if (method !== 'GET') {
            const csrf = getCookieValue('csrf_token')
            if (csrf) {
                headers['X-CSRF-Token'] = csrf
            }
        }

        return headers
    }

    /**
     * 通用请求方法
     */
    async request<T = unknown>(endpoint: string, options: RequestConfig = {}): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`
        const timeout = options.timeout ?? this.defaultTimeout

        const { controller, cleanup } = this.createTimeoutController(timeout, options.signal)

        const method = options.method || 'GET'
        const config: RequestInit = {
            ...options,
            signal: controller.signal,
            credentials: 'same-origin',
            headers: this.buildHeaders(method, options.headers),
        }

        try {
            const response = await fetch(url, config)
            cleanup()

            if (response.status === 401) {
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login'
                }
                return { data: null, error: 'Unauthorized' }
            }

            if (!response.ok) {
                let errorData: { error?: string; message?: string } | null = null
                try {
                    const contentType = response.headers.get('content-type')
                    if (contentType && contentType.includes('application/json')) {
                        errorData = await response.json()
                    }
                } catch {
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
     * 上传文件（Cookie认证 + CSRF防护）
     */
    async upload<T = unknown>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`
        const csrf = getCookieValue('csrf_token')

        try {
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
                },
                body: formData,
            })

            if (response.status === 401) {
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
     * 上传文件（带进度回调，Cookie认证 + CSRF防护）
     */
    uploadWithProgress<T = unknown>(
        endpoint: string,
        formData: FormData,
        onProgress?: (progress: { percent: number; speed: number; loaded: number; total: number }) => void
    ): Promise<ApiResponse<T>> {
        return new Promise((resolve) => {
            const url = `${this.baseURL}${endpoint}`
            const csrf = getCookieValue('csrf_token')
            const xhr = new XMLHttpRequest()
            let startTime = Date.now()
            let lastLoaded = 0

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    const now = Date.now()
                    const elapsed = (now - startTime) / 1000
                    const bytesLoaded = e.loaded - lastLoaded
                    const speed = elapsed > 0 ? (bytesLoaded / 1024) / elapsed : 0

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
            // XHR也需要携带Cookie凭证
            xhr.withCredentials = true
            if (csrf) {
                xhr.setRequestHeader('X-CSRF-Token', csrf)
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
        return apiService.get<{ data: Album[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>('/albums')
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
        return apiService.get<{ data: MapCheckin[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(`/map${query}`)
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

export interface TimeCapsuleData {
    id: string
    title?: string
    message: string
    unlock_date: string
    is_unlocked: boolean
    created_by: string
    created_at: string
    updated_at: string
}

export const timeCapsuleService = {
    async getAll() {
        return apiService.get<{ data: TimeCapsuleData[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>('/time-capsules')
    },

    async create(capsule: Omit<TimeCapsuleData, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'is_unlocked'>) {
        return apiService.post<TimeCapsuleData>('/time-capsules', capsule)
    },

    async delete(id: number | string) {
        return apiService.delete(`/time-capsules/${id}`)
    }
}

// 统计数据类型定义
export interface StatsOverview {
    photos: number
    albums: number
    timeline: number
    food: number
    map: number
    checkins: number
    todos: number
    todosCompleted: number
    capsules: number
    capsulesUnlocked: number
    notes: number
    recentPhotos: number
}

export interface MonthlyActivity {
    timeline: number
    food: number
    map: number
    total: number
}

export interface DistributionItem {
    cuisine?: string
    province?: string
    category?: string
    count: number
}

export interface StatsData {
    overview: StatsOverview
    activityTrend: Record<string, MonthlyActivity>
    cuisineDistribution: DistributionItem[]
    provinceDistribution: DistributionItem[]
    categoryDistribution: DistributionItem[]
}

export const statsService = {
    async getDashboard() {
        return apiService.get<StatsData>('/stats')
    }
}
