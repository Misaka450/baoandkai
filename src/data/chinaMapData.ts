import { useState, useEffect } from 'react'

/**
 * 中国地图 SVG 数据
 * 基于阿里云 DataV GeoAtlas 真实地理数据，墨卡托投影
 * viewBox="0 0 800 700"
 * 静态数据已抽离至 /map-data/china.json
 */

export interface ProvinceData {
    id: string       // 英文标识
    name: string     // 中文名称
    path: string     // SVG path
    center: [number, number]  // 中心点坐标 [x, y]
}

export const CHINA_MAP_VIEWBOX = '0 0 800 700'

let cachedProvinces: ProvinceData[] | null = null
let loadingPromise: Promise<ProvinceData[]> | null = null

/**
 * 异步加载全国省份 SVG 数据（带模块级 Promise 与内存缓存）
 */
export async function loadChinaProvinces(): Promise<ProvinceData[]> {
    if (cachedProvinces) {
        return cachedProvinces
    }

    if (!loadingPromise) {
        loadingPromise = fetch('/map-data/china.json')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to load /map-data/china.json: ${res.status}`)
                }
                return res.json() as Promise<ProvinceData[]>
            })
            .then(data => {
                cachedProvinces = data
                return data
            })
            .catch(err => {
                loadingPromise = null
                console.error('加载中国地图数据失败:', err)
                return []
            })
    }

    return loadingPromise
}

/**
 * 同步获取已缓存的省份数据（未加载完成前返回空数组）
 */
export function getCachedProvinces(): ProvinceData[] {
    return cachedProvinces ?? []
}

/**
 * React Hook：获取全国省份 SVG 数据（自动触发异步加载并复用缓存）
 */
export function useChinaProvinces() {
    const [provinces, setProvinces] = useState<ProvinceData[]>(() => cachedProvinces ?? [])
    const [isLoading, setIsLoading] = useState<boolean>(() => cachedProvinces === null)

    useEffect(() => {
        if (cachedProvinces) {
            setProvinces(cachedProvinces)
            setIsLoading(false)
            return
        }

        let isActive = true
        loadChinaProvinces().then(data => {
            if (isActive) {
                setProvinces(data)
                setIsLoading(false)
            }
        })

        return () => {
            isActive = false
        }
    }, [])

    return { provinces, isLoading }
}

/**
 * 根据省份名查找省份数据
 */
export function findProvinceByName(
    name: string,
    provinceList: ProvinceData[] | null = cachedProvinces
): ProvinceData | undefined {
    return provinceList?.find(p => p.name === name)
}

/**
 * 获取所有省份名称列表
 */
export function getAllProvinceNames(
    provinceList: ProvinceData[] | null = cachedProvinces
): string[] {
    return (provinceList ?? []).map(p => p.name)
}
