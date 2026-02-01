/**
 * 客户端图片压缩工具
 * 
 * @param file 原始 File 对象
 * @param maxWidth 最大宽度 (默认为 1920)
 * @param quality 压缩质量 (0-1, 默认为 0.8)
 * @returns Promise<File> 压缩后的 File 对象
 */
export const compressImage = (file: File, maxWidth = 1920, quality = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
        // 如果不是图片，直接返回原文件
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // 计算缩放比例
                if (width > maxWidth) {
                    height = Math.round(height * (maxWidth / width));
                    width = maxWidth;
                }

                // 创建 Canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    resolve(file); // Canvas 不支持，降级返回原文件
                    return;
                }

                // 绘制图片
                ctx.drawImage(img, 0, 0, width, height);

                // 导出为 Blob -> File
                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve(file);
                        return;
                    }

                    // 创建新文件，保留原文件名和更新后的类型
                    const newFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });

                    console.log(`[Image Compression] ${file.name}: ${(file.size / 1024).toFixed(2)}KB -> ${(newFile.size / 1024).toFixed(2)}KB`);
                    resolve(newFile);
                }, 'image/jpeg', quality);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};
