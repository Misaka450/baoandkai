/**
 * 从阿里云 DataV 获取各省城市级 GeoJSON，
 * 计算每个城市在 SVG 坐标系中的位置，
 * 生成相对于省份中心的偏移量
 */
import { writeFileSync } from 'fs'

// 与 convertGeoJson.mjs 保持完全一致的投影参数
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

// 省份映射 (简称)
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

// 直辖市不需要进一步下钻
const MUNICIPALITIES = new Set(['北京', '天津', '上海', '重庆'])
// 特别行政区也不下钻
const SPECIAL_REGIONS = new Set(['香港', '澳门'])

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
    console.log('Step 1: Fetching national GeoJSON for province adcodes...')
    const nationalRes = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
    const nationalGeo = await nationalRes.json()

    // 收集省份 adcode 和中心
    const provinceInfos = []
    for (const feature of nationalGeo.features) {
        const fullName = feature.properties.name
        const shortName = NAME_MAP[fullName]
        if (!shortName) continue

        const adcode = feature.properties.adcode
        const geoCenter = feature.properties.center // [lon, lat]

        // 计算 SVG 坐标系中的省份中心
        const svgCenterX = Math.round(projectLon(geoCenter[0]))
        const svgCenterY = Math.round(projectLat(geoCenter[1]))

        provinceInfos.push({ shortName, fullName, adcode, svgCenter: [svgCenterX, svgCenterY] })
    }

    console.log(`Found ${provinceInfos.length} provinces`)

    // Step 2: 逐省获取城市数据
    const provinceCities = {}

    for (const prov of provinceInfos) {
        // 直辖市和特别行政区只有单一城市
        if (MUNICIPALITIES.has(prov.shortName)) {
            provinceCities[prov.shortName] = [
                { name: `${prov.shortName}市`, offset: [0, 0] }
            ]
            console.log(`  ${prov.shortName}: 直辖市，跳过下钻`)
            continue
        }
        if (SPECIAL_REGIONS.has(prov.shortName)) {
            provinceCities[prov.shortName] = [
                { name: prov.shortName, offset: [0, 0] }
            ]
            console.log(`  ${prov.shortName}: 特别行政区，跳过下钻`)
            continue
        }

        // 获取省份下的城市 GeoJSON
        const url = `https://geo.datav.aliyun.com/areas_v3/bound/${prov.adcode}_full.json`
        console.log(`  Fetching cities for ${prov.shortName} (adcode: ${prov.adcode})...`)

        try {
            const res = await fetch(url)
            if (!res.ok) {
                console.warn(`    Failed to fetch: ${res.status}`)
                provinceCities[prov.shortName] = []
                continue
            }
            const geo = await res.json()

            const cities = []
            for (const feature of geo.features) {
                const cityName = feature.properties.name
                const cityCenter = feature.properties.center // [lon, lat]
                if (!cityCenter) continue

                const citySvgX = Math.round(projectLon(cityCenter[0]))
                const citySvgY = Math.round(projectLat(cityCenter[1]))

                // 偏移量 = 城市SVG坐标 - 省份SVG中心坐标
                const dx = citySvgX - prov.svgCenter[0]
                const dy = citySvgY - prov.svgCenter[1]

                cities.push({ name: cityName, offset: [dx, dy] })
            }

            provinceCities[prov.shortName] = cities
            console.log(`    Found ${cities.length} cities`)
        } catch (err) {
            console.error(`    Error: ${err.message}`)
            provinceCities[prov.shortName] = []
        }

        // 限流，避免太快请求
        await sleep(200)
    }

    // Step 3: 生成 TypeScript 文件
    let output = `/**
 * 省份城市数据
 * 基于阿里云 DataV GeoAtlas 真实地理数据
 * 每个省份下的主要城市及其在省地图中的相对坐标
 * 坐标基于各省中心为原点的相对偏移量（SVG 坐标系）
 */

export interface CityData {
    name: string
    offset: [number, number]  // 相对于省中心的偏移 [dx, dy]
}

export const provinceCities: Record<string, CityData[]> = {\n`

    for (const [provName, cities] of Object.entries(provinceCities)) {
        output += `    '${provName}': [\n`
        for (const city of cities) {
            output += `        { name: '${city.name}', offset: [${city.offset[0]}, ${city.offset[1]}] },\n`
        }
        output += `    ],\n`
    }

    output += `}

/**
 * 获取指定省份的城市列表
 */
export function getCitiesForProvince(provinceName: string): CityData[] {
    return provinceCities[provinceName] || []
}

/**
 * 获取所有省份名称
 */
export function getAllProvinces(): string[] {
    return Object.keys(provinceCities)
}
`

    const outPath = new URL('../src/data/provinceCities.ts', import.meta.url).pathname
    const cleanPath = outPath.startsWith('/') && outPath[2] === ':' ? outPath.slice(1) : outPath
    writeFileSync(cleanPath, output, 'utf-8')
    console.log(`\nWritten to ${cleanPath}`)
    console.log(`Total provinces: ${Object.keys(provinceCities).length}`)
}

main().catch(console.error)
