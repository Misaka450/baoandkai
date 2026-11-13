/**
 * 省份地级市 SVG path 边界数据（按省份从 /map-data/provinces/*.json 异步懒加载）
 * 与 chinaMapData.ts 使用相同坐标系。
 */

export interface CityPathData {
    name: string
    path: string
    center: [number, number]
}

export const PROVINCE_FILE_MAP: Record<string, string> = {
    "北京": "01",
    "天津": "02",
    "河北": "03",
    "山西": "04",
    "内蒙古": "05",
    "辽宁": "06",
    "吉林": "07",
    "黑龙江": "08",
    "上海": "09",
    "江苏": "10",
    "浙江": "11",
    "安徽": "12",
    "福建": "13",
    "江西": "14",
    "山东": "15",
    "河南": "16",
    "湖北": "17",
    "湖南": "18",
    "广东": "19",
    "广西": "20",
    "海南": "21",
    "重庆": "22",
    "四川": "23",
    "贵州": "24",
    "云南": "25",
    "西藏": "26",
    "陕西": "27",
    "甘肃": "28",
    "青海": "29",
    "宁夏": "30",
    "新疆": "31",
    "台湾": "32",
    "香港": "33",
    "澳门": "34",
}

const cityPathCache = new Map<string, CityPathData[]>()
const cityPathPending = new Map<string, Promise<CityPathData[]>>()

export async function loadCityPathsForProvince(provinceName: string): Promise<CityPathData[]> {
    if (cityPathCache.has(provinceName)) {
        return cityPathCache.get(provinceName) || []
    }

    const fileId = PROVINCE_FILE_MAP[provinceName]
    if (!fileId) return []

    const pending = cityPathPending.get(provinceName)
    if (pending) {
        return pending
    }

    const request = fetch(`/map-data/provinces/${fileId}.json`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`Failed to load /map-data/provinces/${fileId}.json: ${res.status}`)
            }
            return res.json() as Promise<CityPathData[]>
        })
        .then(data => {
            cityPathCache.set(provinceName, data)
            cityPathPending.delete(provinceName)
            return data
        })
        .catch(err => {
            cityPathPending.delete(provinceName)
            console.error(`加载省份(${provinceName})城市边界数据失败:`, err)
            return []
        })

    cityPathPending.set(provinceName, request)
    return request
}

export function hasCityPathsForProvince(provinceName: string): boolean {
    return provinceName in PROVINCE_FILE_MAP
}
