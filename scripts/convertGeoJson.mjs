/**
 * 将阿里云 DataV GeoJSON 数据转为 SVG path
 * 使用墨卡托投影，输出适配 viewBox="0 0 800 700"
 */
import { writeFileSync } from 'fs'

const GEOJSON_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json'

// 省份中英文名称映射
const ID_MAP = {
    '北京市': 'beijing', '天津市': 'tianjin', '河北省': 'hebei', '山西省': 'shanxi',
    '内蒙古自治区': 'neimenggu', '辽宁省': 'liaoning', '吉林省': 'jilin', '黑龙江省': 'heilongjiang',
    '上海市': 'shanghai', '江苏省': 'jiangsu', '浙江省': 'zhejiang', '安徽省': 'anhui',
    '福建省': 'fujian', '江西省': 'jiangxi', '山东省': 'shandong', '河南省': 'henan',
    '湖北省': 'hubei', '湖南省': 'hunan', '广东省': 'guangdong', '广西壮族自治区': 'guangxi',
    '海南省': 'hainan', '重庆市': 'chongqing', '四川省': 'sichuan', '贵州省': 'guizhou',
    '云南省': 'yunnan', '西藏自治区': 'xizang', '陕西省': 'shaanxi', '甘肃省': 'gansu',
    '青海省': 'qinghai', '宁夏回族自治区': 'ningxia', '新疆维吾尔自治区': 'xinjiang',
    '台湾省': 'taiwan', '香港特别行政区': 'hongkong', '澳门特别行政区': 'macau'
}

const NAME_MAP = {
    '北京市': '北京', '天津市': '天津', '河北省': '河北', '山西省': '山西',
    '内蒙古自治区': '内蒙古', '辽宁省': '辽宁', '吉林省': '吉林', '黑龙江省': '黑龙江',
    '上海市': '上海', '江苏省': '江苏', '浙江省': '浙江', '安徽省': '安徽',
    '福建省': '福建', '江西省': '江西', '山东省': '山东', '河南省': '河南',
    '湖北省': '湖北', '湖南省': '湖南', '广东省': '广东', '广西壮族自治区': '广西',
    '海南省': '海南', '重庆市': '重庆', '四川省': '四川', '贵州省': '贵州',
    '云南省': '云南', '西藏自治区': '西藏', '陕西省': '陕西', '甘肃省': '甘肃',
    '青海省': '青海', '宁夏回族自治区': '宁夏', '新疆维吾尔自治区': '新疆',
    '台湾省': '台湾', '香港特别行政区': '香港', '澳门特别行政区': '澳门'
}

// 墨卡托投影
function mercatorY(lat) {
    const rad = (lat * Math.PI) / 180
    return Math.log(Math.tan(Math.PI / 4 + rad / 2))
}

// 投影参数 - 中国范围
const LON_MIN = 73
const LON_MAX = 136
const LAT_MIN = 17
const LAT_MAX = 54

// SVG ViewBox
const SVG_W = 800
const SVG_H = 700
const PADDING = 30

const drawW = SVG_W - PADDING * 2
const drawH = SVG_H - PADDING * 2

// 计算投影范围
const mercYMin = mercatorY(LAT_MIN)
const mercYMax = mercatorY(LAT_MAX)

function projectLon(lon) {
    return PADDING + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * drawW
}

function projectLat(lat) {
    const mercY = mercatorY(lat)
    // Y 轴翻转（SVG 的 Y 轴向下）
    return PADDING + ((mercYMax - mercY) / (mercYMax - mercYMin)) * drawH
}

function coordsToPath(coords) {
    if (coords.length === 0) return ''
    const parts = coords.map((c, i) => {
        const x = projectLon(c[0]).toFixed(1)
        const y = projectLat(c[1]).toFixed(1)
        return (i === 0 ? 'M' : 'L') + x + ',' + y
    })
    return parts.join(' ') + ' Z'
}

function geometryToPath(geometry) {
    const paths = []
    if (geometry.type === 'Polygon') {
        // 只取外环
        paths.push(coordsToPath(geometry.coordinates[0]))
    } else if (geometry.type === 'MultiPolygon') {
        // 取每个多边形的外环
        for (const polygon of geometry.coordinates) {
            paths.push(coordsToPath(polygon[0]))
        }
    }
    return paths.join(' ')
}

function computeCenter(geometry) {
    let sumX = 0, sumY = 0, count = 0
    const processCoords = (coords) => {
        for (const c of coords) {
            sumX += projectLon(c[0])
            sumY += projectLat(c[1])
            count++
        }
    }
    if (geometry.type === 'Polygon') {
        processCoords(geometry.coordinates[0])
    } else if (geometry.type === 'MultiPolygon') {
        // 使用最大多边形的中心
        let maxLen = 0, maxCoords = null
        for (const polygon of geometry.coordinates) {
            if (polygon[0].length > maxLen) {
                maxLen = polygon[0].length
                maxCoords = polygon[0]
            }
        }
        if (maxCoords) processCoords(maxCoords)
    }
    return [Math.round(sumX / count), Math.round(sumY / count)]
}

async function main() {
    console.log('Fetching GeoJSON data...')
    const res = await fetch(GEOJSON_URL)
    const geojson = await res.json()

    const provinces = []

    for (const feature of geojson.features) {
        const fullName = feature.properties.name
        const id = ID_MAP[fullName]
        const name = NAME_MAP[fullName]

        if (!id || !name) {
            console.warn(`Skipping unknown province: ${fullName}`)
            continue
        }

        const path = geometryToPath(feature.geometry)
        const center = computeCenter(feature.geometry)

        provinces.push({ id, name, path, center })
    }

    // 生成 TypeScript 文件
    let output = `/**
 * 中国地图 SVG 数据
 * 基于阿里云 DataV GeoAtlas 真实地理数据，墨卡托投影
 * viewBox="0 0 ${SVG_W} ${SVG_H}"
 */

export interface ProvinceData {
    id: string       // 英文标识
    name: string     // 中文名称
    path: string     // SVG path
    center: [number, number]  // 中心点坐标 [x, y]
}

export const CHINA_MAP_VIEWBOX = '0 0 ${SVG_W} ${SVG_H}'

export const provinces: ProvinceData[] = [\n`

    for (const p of provinces) {
        output += `    {\n`
        output += `        id: '${p.id}', name: '${p.name}',\n`
        output += `        path: '${p.path}',\n`
        output += `        center: [${p.center[0]}, ${p.center[1]}]\n`
        output += `    },\n`
    }

    output += `]

/**
 * 根据省份名查找省份数据
 */
export function findProvinceByName(name: string): ProvinceData | undefined {
    return provinces.find(p => p.name === name)
}

/**
 * 获取所有省份名称列表
 */
export function getAllProvinceNames(): string[] {
    return provinces.map(p => p.name)
}
`

    const outPath = new URL('../src/data/chinaMapData.ts', import.meta.url).pathname
    // Handle Windows paths - remove leading slash if on Windows
    const cleanPath = outPath.startsWith('/') && outPath[2] === ':' ? outPath.slice(1) : outPath
    writeFileSync(cleanPath, output, 'utf-8')
    console.log(`Written to ${cleanPath}`)
    console.log(`Total provinces: ${provinces.length}`)
}

main().catch(console.error)
