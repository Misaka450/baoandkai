/**
 * API 端点常量
 * 统一管理所有 API 请求路径
 */

/** 认证相关端点 */
export const AUTH_ENDPOINTS = {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VERIFY: '/auth/verify'
} as const

/** 时间胶囊端点 */
export const TIME_CAPSULE_ENDPOINTS = {
    BASE: '/time-capsules',
    GET_ALL: '/time-capsules',
    CREATE: '/time-capsules',
    UPDATE: (id: string) => `/time-capsules/${id}`,
    DELETE: (id: string) => `/time-capsules/${id}`,
    UNLOCK: (id: string) => `/time-capsules/${id}/unlock`
} as const

/** 旅行足迹端点 */
export const TRAVEL_ENDPOINTS = {
    BASE: '/travel-map',
    GET_ALL: '/travel-map',
    CREATE: '/travel-map',
    UPDATE: (id: string) => `/travel-map/${id}`,
    DELETE: (id: string) => `/travel-map/${id}`
} as const

/** 碎碎念端点 */
export const NOTES_ENDPOINTS = {
    BASE: '/notes',
    GET_ALL: '/notes',
    CREATE: '/notes',
    DELETE: (id: number) => `/notes/${id}`
} as const

/** 配置端点 */
export const CONFIG_ENDPOINTS = {
    GET: '/config',
    UPDATE: '/config'
} as const

/** 图片上传端点 */
export const UPLOAD_ENDPOINTS = {
    UPLOAD: '/upload',
    DELETE: '/delete'
} as const

/** 相册端点 */
export const ALBUM_ENDPOINTS = {
    BASE: '/albums',
    GET_ALL: '/albums',
    CREATE: '/albums',
    UPDATE: (id: string) => `/albums/${id}`,
    DELETE: (id: string) => `/albums/${id}`
} as const

/** 待办事项端点 */
export const TODO_ENDPOINTS = {
    BASE: '/todos',
    GET_ALL: '/todos',
    CREATE: '/todos',
    UPDATE: (id: string) => `/todos/${id}`,
    DELETE: (id: string) => `/todos/${id}`,
    TOGGLE: (id: string) => `/todos/${id}/toggle`
} as const

/** 时间线端点 */
export const TIMELINE_ENDPOINTS = {
    BASE: '/timeline',
    GET_ALL: '/timeline',
    CREATE: '/timeline',
    UPDATE: (id: string) => `/timeline/${id}`,
    DELETE: (id: string) => `/timeline/${id}`
} as const

/** 美食打卡端点 */
export const FOOD_ENDPOINTS = {
    BASE: '/food-checkins',
    GET_ALL: '/food-checkins',
    CREATE: '/food-checkins',
    UPDATE: (id: string) => `/food-checkins/${id}`,
    DELETE: (id: string) => `/food-checkins/${id}`
} as const
