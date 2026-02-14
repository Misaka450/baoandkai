/**
 * 从阿里云 DataV 获取各省地级市 GeoJSON 边界，
 * 转为 SVG path 数据，与全国地图使用相同的墨卡托投影坐标系。
 * 生成 src/data/provinceCityPaths.ts
 */
import { writeFileSync } from 'fs'

// ===== 与 convertGeoJson.mjs 完全一致的投影参数 =====
const LON_MIN = 73
const LON_MAX = 136
const LAT_MIN = 17
const LAT_MAX = 54
const SVG_W = 800
const SVG_H = 700
const PADDING = 30
const drawW = SVG_W - PADDING * 2
const drawH = SVG_H - PADDING * 2

function mercatorY(lat) {
    const rad = (lat * Math.PI) / 180
    return Math.log(Math.tan(Math.PI / 4 + rad / 2))
}

const mercYMin = mercatorY(LAT_MIN)
const mercYMax = mercatorY(LAT_MAX)

function projectLon(lon) {
    return PADDING + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * drawW
}

function projectLat(lat) {
    const mercY = mercatorY(lat)
    return PADDING + ((mercYMax - mercY) / (mercYMax - mercYMin)) * drawH
}

// ===== GeoJSON 转 SVG path =====
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
        paths.push(coordsToPath(geometry.coordinates[0]))
    } else if (geometry.type === 'MultiPolygon') {
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

// ===== 省份名称映射 =====
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

// 直辖市和特别行政区：获取区级数据
const MUNICIPALITIES = new Set(['北京', '天津', '上海', '重庆'])
const SPECIAL_REGIONS = new Set(['香港', '澳门'])

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
    console.log('Step 1: Fetching national GeoJSON for province adcodes...')
    const nationalRes = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
    const nationalGeo = await nationalRes.json()

    const provinceInfos = []
    for (const feature of nationalGeo.features) {
        const fullName = feature.properties.name
        const shortName = NAME_MAP[fullName]
        if (!shortName) continue

        const adcode = feature.properties.adcode
        provinceInfos.push({ shortName, fullName, adcode })
    }

    console.log(`Found ${provinceInfos.length} provinces`)

    // Step 2: 逐省获取城市/区级边界
    const provinceCityPaths = {}

    for (const prov of provinceInfos) {
        const url = `https://geo.datav.aliyun.com/areas_v3/bound/${prov.adcode}_full.json`
        console.log(`  Fetching cities for ${prov.shortName} (adcode: ${prov.adcode})...`)

        try {
            const res = await fetch(url)
            if (!res.ok) {
                console.warn(`    Failed to fetch: ${res.status}`)
                provinceCityPaths[prov.shortName] = []
                continue
            }
            const geo = await res.json()

            const cities = []
            for (const feature of geo.features) {
                const cityName = feature.properties.name
                const path = geometryToPath(feature.geometry)
                const center = computeCenter(feature.geometry)

                if (!path) continue

                cities.push({ name: cityName, path, center })
            }

            provinceCityPaths[prov.shortName] = cities
            console.log(`    Found ${cities.length} cities/districts`)
        } catch (err) {
            console.error(`    Error: ${err.message}`)
            provinceCityPaths[prov.shortName] = []
        }

        await sleep(200)
    }

    // Step 3: 生成 TypeScript 文件
    let output = `/**
 * 省份地级市 SVG path 边界数据
 * 基于阿里云 DataV GeoAtlas 真实地理数据，墨卡托投影
 * 与 chinaMapData.ts 使用完全相同的坐标系 (viewBox="0 0 800 700")
 * 由 scripts/convertCityPaths.mjs 自动生成，请勿手动编辑
 */

export interface CityPathData {
    name: string
    path: string                // SVG path 数据
    center: [number, number]    // 城市中心 [x, y] (绝对 SVG 坐标)
}

export const provinceCityPaths: Record<string, CityPathData[]> = {\n`

    for (const [provName, cities] of Object.entries(provinceCityPaths)) {
        output += `    '${provName}': [\n`
        for (const city of cities) {
            output += `        { name: '${city.name}', path: '${city.path}', center: [${city.center[0]}, ${city.center[1]}] },\n`
        }
        output += `    ],\n`
    }

    output += `}

/**
 * 获取指定省份的城市边界数据
 */
export function getCityPathsForProvince(provinceName: string): CityPathData[] {
    return provinceCityPaths[provinceName] || []
}
`

    const outPath = new URL('../src/data/provinceCityPaths.ts', import.meta.url).pathname
    const cleanPath = outPath.startsWith('/') && outPath[2] === ':' ? outPath.slice(1) : outPath
    writeFileSync(cleanPath, output, 'utf-8')
    console.log(`\nWritten to ${cleanPath}`)

    // 统计
    let totalCities = 0
    for (const cities of Object.values(provinceCityPaths)) {
        totalCities += cities.length
    }
    console.log(`Total provinces: ${Object.keys(provinceCityPaths).length}`)
    console.log(`Total cities/districts: ${totalCities}`)
}

main().catch(console.error)
