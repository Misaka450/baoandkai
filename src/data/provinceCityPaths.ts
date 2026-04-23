/**
 * 省份地级市 SVG path 边界数据（按省份懒加载）
 * 与 chinaMapData.ts 使用相同坐标系。
 */

export interface CityPathData {
    name: string
    path: string
    center: [number, number]
}

const cityPathLoaders: Record<string, () => Promise<{ default: CityPathData[] }>> = {
    "北京": () => import('./province-city-paths/01'),
    "天津": () => import('./province-city-paths/02'),
    "河北": () => import('./province-city-paths/03'),
    "山西": () => import('./province-city-paths/04'),
    "内蒙古": () => import('./province-city-paths/05'),
    "辽宁": () => import('./province-city-paths/06'),
    "吉林": () => import('./province-city-paths/07'),
    "黑龙江": () => import('./province-city-paths/08'),
    "上海": () => import('./province-city-paths/09'),
    "江苏": () => import('./province-city-paths/10'),
    "浙江": () => import('./province-city-paths/11'),
    "安徽": () => import('./province-city-paths/12'),
    "福建": () => import('./province-city-paths/13'),
    "江西": () => import('./province-city-paths/14'),
    "山东": () => import('./province-city-paths/15'),
    "河南": () => import('./province-city-paths/16'),
    "湖北": () => import('./province-city-paths/17'),
    "湖南": () => import('./province-city-paths/18'),
    "广东": () => import('./province-city-paths/19'),
    "广西": () => import('./province-city-paths/20'),
    "海南": () => import('./province-city-paths/21'),
    "重庆": () => import('./province-city-paths/22'),
    "四川": () => import('./province-city-paths/23'),
    "贵州": () => import('./province-city-paths/24'),
    "云南": () => import('./province-city-paths/25'),
    "西藏": () => import('./province-city-paths/26'),
    "陕西": () => import('./province-city-paths/27'),
    "甘肃": () => import('./province-city-paths/28'),
    "青海": () => import('./province-city-paths/29'),
    "宁夏": () => import('./province-city-paths/30'),
    "新疆": () => import('./province-city-paths/31'),
    "台湾": () => import('./province-city-paths/32'),
    "香港": () => import('./province-city-paths/33'),
    "澳门": () => import('./province-city-paths/34'),
}

const cityPathCache = new Map<string, CityPathData[]>()

export async function loadCityPathsForProvince(provinceName: string): Promise<CityPathData[]> {
    if (cityPathCache.has(provinceName)) {
        return cityPathCache.get(provinceName) || []
    }

    const loader = cityPathLoaders[provinceName]
    if (!loader) return []

    const module = await loader()
    cityPathCache.set(provinceName, module.default)
    return module.default
}

export function hasCityPathsForProvince(provinceName: string): boolean {
    return provinceName in cityPathLoaders
}
