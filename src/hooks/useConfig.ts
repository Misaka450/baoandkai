import { useState, useEffect, useCallback } from 'react'
import { apiService } from '../services/apiService'
import { SiteConfig } from '../types'

const CACHE_KEY = 'home_config_cache'

const DEFAULT_CONFIG: SiteConfig = {
    coupleName1: '包包',
    coupleName2: '恺恺',
    anniversaryDate: '2023-10-08',
    homeTitle: '包包和恺恺的小窝',
    homeSubtitle: '遇见你，是银河赠予我的糖。',
    avatar1: '',
    avatar2: ''
}

export function useConfig() {
    const [config, setConfig] = useState<SiteConfig>(() => {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
            try {
                const parsed = JSON.parse(cached)
                return { ...DEFAULT_CONFIG, ...parsed }
            } catch (e) {
                console.error('Failed to parse config cache:', e)
            }
        }
        return DEFAULT_CONFIG
    })

    const [loading, setLoading] = useState(true)

    const fetchConfig = useCallback(async () => {
        try {
            const { data, error } = await apiService.get<SiteConfig>('/config')
            if (error) throw new Error(error)
            if (data) {
                const newConfig = {
                    ...DEFAULT_CONFIG,
                    ...data
                }
                setConfig(newConfig)
                localStorage.setItem(CACHE_KEY, JSON.stringify(newConfig))
            }
        } catch (error) {
            console.error('Failed to fetch config:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    const updateConfig = useCallback(async (newConfig: SiteConfig) => {
        try {
            const { error } = await apiService.put('/config', newConfig)
            if (error) throw new Error(error)

            setConfig(newConfig)
            localStorage.setItem(CACHE_KEY, JSON.stringify(newConfig))
            return { success: true }
        } catch (error) {
            console.error('Failed to update config:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }, [])

    useEffect(() => {
        fetchConfig()
    }, [fetchConfig])

    return {
        config,
        loading,
        refresh: fetchConfig,
        updateConfig
    }
}
