/**
 * R2 图片上传工具
 * 提供图片压缩、上传、删除等功能
 */

class R2UploadManager {
    private baseUrl: string

    constructor() {
        this.baseUrl = import.meta.env.PROD
            ? 'https://1eaf793b.baoandkai.pages.dev'
            : 'http://localhost:3000'
    }

    /**
     * 生成唯一的文件名
     */
    generateUniqueFilename(originalName: string): string {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 8)
        const parts = originalName.split('.')
        const extension = parts.length > 1 ? parts.pop() : 'jpg'
        return `${timestamp}_${random}.${extension}`
    }

    /**
     * 压缩图片
     */
    async compressImage(
        file: File,
        maxWidth: number = 1920,
        maxHeight: number = 1080,
        quality: number = 0.8
    ): Promise<File> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    let { width, height } = img

                    // 计算缩放比例
                    const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
                    width *= ratio
                    height *= ratio

                    canvas.width = width
                    canvas.height = height

                    const ctx = canvas.getContext('2d')
                    if (!ctx) {
                        reject(new Error('无法获取 canvas context'))
                        return
                    }
                    ctx.drawImage(img, 0, 0, width, height)

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(new File([blob], file.name, { type: 'image/jpeg' }))
                            } else {
                                reject(new Error('图片压缩失败'))
                            }
                        },
                        'image/jpeg',
                        quality
                    )
                }
                img.onerror = () => reject(new Error('图片加载失败'))
                img.src = e.target?.result as string
            }
            reader.onerror = () => reject(new Error('文件读取失败'))
            reader.readAsDataURL(file)
        })
    }

    /**
     * 上传图片到R2
     */
    async uploadToR2(file: File, folder: string = 'images'): Promise<string[]> {
        try {
            const filename = this.generateUniqueFilename(file.name)
            const compressedFile = await this.compressImage(file)

            const formData = new FormData()
            formData.append('file', compressedFile, filename)
            formData.append('folder', folder)

            // 使用正确的API路径上传
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error('上传失败')
            }

            const result = await response.json() as { urls?: string[]; url?: string }
            // 使用R2公共URL，支持多文件
            return result.urls ?? (result.url ? [result.url] : [])
        } catch (error) {
            console.error('上传图片失败:', error)
            throw error
        }
    }

    /**
     * 删除图片
     */
    async deleteFromR2(url: string): Promise<boolean> {
        try {
            const parts = url.split('/')
            const filename = parts.pop() ?? ''

            // 使用正确的API路径删除
            const response = await fetch('/api/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filename }),
            })

            if (!response.ok) {
                throw new Error('删除失败')
            }

            return true
        } catch (error) {
            console.error('删除图片失败:', error)
            return false
        }
    }

    /**
     * 批量上传图片
     */
    async uploadMultipleFiles(files: FileList | File[], folder: string = 'images'): Promise<string[]> {
        const uploadPromises = Array.from(files).map(file =>
            this.uploadToR2(file, folder)
        )

        const results = await Promise.all(uploadPromises)
        // 扁平化数组，因为每个uploadToR2返回URL数组
        return results.flat()
    }
}

// 创建单例实例
export const r2UploadManager = new R2UploadManager()

// 导出类以便需要时创建新实例
export default R2UploadManager
