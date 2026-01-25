import { useState, useCallback } from 'react'
import { apiService } from '../services/apiService'

interface UploadProgress {
    percent: number
    speed: number
    loaded: number
    total: number
}

interface UseImageUploadReturn {
    uploading: boolean
    progress: UploadProgress | null
    uploadImage: (file: File, endpoint?: string) => Promise<string | null>
    uploadMultipleImages: (files: FileList | File[], endpoint?: string) => Promise<string[]>
    reset: () => void
}

/**
 * 通用图片上传 Hook
 * 集成进度处理和多图上传逻辑
 */
export function useImageUpload(): UseImageUploadReturn {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState<UploadProgress | null>(null)

    const uploadImage = useCallback(async (file: File, endpoint: string = '/upload'): Promise<string | null> => {
        setUploading(true)
        setProgress(null)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const { data, error } = await apiService.uploadWithProgress<{ url: string }>(
                endpoint,
                formData,
                (p) => setProgress(p)
            )

            if (error) {
                console.error('上传失败:', error)
                return null
            }

            return data?.url || null
        } catch (e) {
            console.error('上传异常:', e)
            return null
        } finally {
            setUploading(false)
        }
    }, [])

    const uploadMultipleImages = useCallback(async (files: FileList | File[], endpoint: string = '/upload'): Promise<string[]> => {
        const fileArray = Array.from(files)
        if (fileArray.length === 0) return []

        setUploading(true)
        const urls: string[] = []

        // 串行上传以保证进度条的合理性，或者并行上传（这里选择串行以简化进度逻辑）
        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i];
            if (file) {
                const url = await uploadImage(file, endpoint)
                if (url) urls.push(url)
            }
        }

        setUploading(false)
        return urls
    }, [uploadImage])

    const reset = useCallback(() => {
        setUploading(false)
        setProgress(null)
    }, [])

    return {
        uploading,
        progress,
        uploadImage,
        uploadMultipleImages,
        reset
    }
}
