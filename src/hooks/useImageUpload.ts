import { useState, useCallback, useRef } from 'react'
import { apiService } from '../services/apiService'

interface UploadProgress {
    percent: number
    speed: number
    loaded: number
    total: number
}

interface UploadResult {
    url: string | null
    fileName: string
    success: boolean
}

interface UseImageUploadReturn {
    uploading: boolean
    progress: UploadProgress | null
    currentFile: string
    uploadImage: (file: File, endpoint?: string) => Promise<string | null>
    uploadMultipleImages: (files: FileList | File[], endpoint?: string, options?: UploadOptions) => Promise<string[]>
    reset: () => void
    abort: () => void
}

interface UploadOptions {
    maxConcurrent?: number
    maxRetries?: number
    retryDelay?: number
}

const DEFAULT_CONCURRENT_LIMIT = 3
const DEFAULT_MAX_RETRIES = 3
const DEFAULT_RETRY_DELAY = 1000

export function useImageUpload(): UseImageUploadReturn {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState<UploadProgress | null>(null)
    const [currentFile, setCurrentFile] = useState('')
    const abortControllerRef = useRef<AbortController | null>(null)
    const uploadedCountRef = useRef(0)
    const totalFilesRef = useRef(0)

    const abort = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
    }, [])

    const reset = useCallback(() => {
        setUploading(false)
        setProgress(null)
        setCurrentFile('')
        abortControllerRef.current = null
        uploadedCountRef.current = 0
        totalFilesRef.current = 0
    }, [])

    const uploadSingle = useCallback(async (
        file: File,
        endpoint: string = '/upload',
        onProgress?: (p: UploadProgress) => void,
        abortSignal?: AbortSignal,
        retries: number = DEFAULT_MAX_RETRIES,
        retryDelay: number = DEFAULT_RETRY_DELAY
    ): Promise<string | null> => {
        const formData = new FormData()
        formData.append('file', file)

        let lastError: string | null = null

        for (let attempt = 0; attempt <= retries; attempt++) {
            if (abortSignal?.aborted) {
                return null
            }

            if (attempt > 0) {
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
            }

            const result = await new Promise<{ url: string | null; error: string | null }>((resolve) => {
                const localAbort = new AbortController()

                const handleAbort = () => {
                    resolve({ url: null, error: 'Upload cancelled' })
                }

                abortSignal?.addEventListener('abort', handleAbort, { once: true })

                apiService.uploadWithProgress<{ url: string }>(
                    endpoint,
                    formData,
                    (p) => onProgress?.(p)
                ).then(({ data, error }) => {
                    abortSignal?.removeEventListener('abort', handleAbort)
                    resolve({ url: data?.url || null, error })
                })
            })

            if (result.url) {
                return result.url
            }

            lastError = result.error
        }

        console.error(`上传失败 [${file.name}]:`, lastError)
        return null
    }, [])

    const uploadImage = useCallback(async (file: File, endpoint: string = '/upload'): Promise<string | null> => {
        setUploading(true)
        setCurrentFile(file.name)

        const result = await uploadSingle(
            file,
            endpoint,
            (p) => setProgress(p)
        )

        setUploading(false)
        setProgress(null)
        setCurrentFile('')
        return result
    }, [uploadSingle])

    const uploadMultipleImages = useCallback(async (
        files: FileList | File[],
        endpoint: string = '/upload',
        options: UploadOptions = {}
    ): Promise<string[]> => {
        const fileArray = Array.from(files)
        if (fileArray.length === 0) return []

        const {
            maxConcurrent = DEFAULT_CONCURRENT_LIMIT,
            maxRetries = DEFAULT_MAX_RETRIES,
            retryDelay = DEFAULT_RETRY_DELAY
        } = options

        setUploading(true)
        setProgress(null)
        uploadedCountRef.current = 0
        totalFilesRef.current = fileArray.length

        abortControllerRef.current = new AbortController()
        const urls: string[] = []
        const results: (string | null)[] = new Array(fileArray.length).fill(null)

        const updateTotalProgress = (loaded: number, total: number, speed: number) => {
            const percent = Math.round((loaded / total) * 100)
            setProgress({ percent, speed, loaded, total })
        }

        const uploadWithIndex = async (index: number): Promise<void> => {
            if (abortControllerRef.current?.signal.aborted) {
                return
            }

            const file = fileArray[index]
            if (!file) return

            setCurrentFile(`${file.name} (${index + 1}/${fileArray.length})`)

            const result = await uploadSingle(
                file,
                endpoint,
                undefined,
                abortControllerRef.current?.signal,
                maxRetries,
                retryDelay
            )

            results[index] = result
            if (result) {
                urls.push(result)
            }
            uploadedCountRef.current++

            const completedRatio = uploadedCountRef.current / fileArray.length
            const baseLoaded = completedRatio * 50
            const currentFileRatio = result ? 50 / fileArray.length : 0
            updateTotalProgress(
                baseLoaded + currentFileRatio,
                100,
                0
            )
        }

        const chunks: number[][] = []
        for (let i = 0; i < fileArray.length; i += maxConcurrent) {
            chunks.push([i, Math.min(i + maxConcurrent, fileArray.length)])
        }

        for (const chunkRange of chunks) {
            if (abortControllerRef.current?.signal.aborted) {
                break
            }

            const start = chunkRange[0] ?? 0
            const end = chunkRange[1] ?? start
            const chunk: Promise<void>[] = []
            for (let j = start; j < end; j++) {
                chunk.push(uploadWithIndex(j))
            }
            await Promise.all(chunk)
        }

        setUploading(false)
        setProgress(null)
        setCurrentFile('')

        return urls.filter((url): url is string => url !== null)
    }, [uploadSingle])

    return {
        uploading,
        progress,
        currentFile,
        uploadImage,
        uploadMultipleImages,
        reset,
        abort
    }
}