import { useEffect, useState } from 'react'
import type { MapCheckin } from '../../types'
import { findProvinceByName } from '../../data/chinaMapData'
import { hasCityPathsForProvince, loadCityPathsForProvince, type CityPathData } from '../../data/provinceCityPaths'
import ProvinceDetail from './ProvinceDetail'

interface ProvinceDetailLoaderProps {
    provinceName: string
    checkins: MapCheckin[]
    onBack: () => void
    onCityClick: (cityName: string, cityCheckins: MapCheckin[]) => void
    onNavigateToTimeline?: (province: string, city?: string) => void
}

export default function ProvinceDetailLoader({
    provinceName,
    checkins,
    onBack,
    onCityClick,
    onNavigateToTimeline
}: ProvinceDetailLoaderProps) {
    const [cityPaths, setCityPaths] = useState<CityPathData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const province = findProvinceByName(provinceName)

    useEffect(() => {
        let isActive = true

        async function loadCityPaths() {
            setIsLoading(true)
            const nextCityPaths = hasCityPathsForProvince(provinceName)
                ? await loadCityPathsForProvince(provinceName)
                : []

            if (!isActive) return
            setCityPaths(nextCityPaths)
            setIsLoading(false)
        }

        loadCityPaths()

        return () => {
            isActive = false
        }
    }, [provinceName])

    if (!province) {
        return (
            <div className="text-center py-16">
                <p className="text-slate-400 font-bold">未找到省份数据</p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group"
                    >
                        <span className="text-sm font-bold">返回全国</span>
                    </button>
                    <div className="text-right">
                        <h3 className="text-2xl font-black text-slate-800">{province.name}</h3>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                            正在加载城市边界
                        </p>
                    </div>
                </div>

                <div className="relative premium-card !p-8 !bg-white/40 backdrop-blur-sm overflow-hidden">
                    <div className="h-[400px] animate-pulse rounded-3xl bg-slate-100/80" />
                </div>
            </div>
        )
    }

    return (
        <ProvinceDetail
            province={province}
            cityPaths={cityPaths}
            checkins={checkins}
            onBack={onBack}
            onCityClick={onCityClick}
            onNavigateToTimeline={onNavigateToTimeline}
        />
    )
}
