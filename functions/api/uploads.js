import { jsonResponse, errorResponse } from '../utils/response';

// POST /api/uploads - 通用文件上传
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const folder = formData.get('folder') || 'images'; // 支持文件夹参数

        if (!file || !(file instanceof File)) {
            return errorResponse('未找到文件', 400);
        }

        // 生成唯一文件名（带文件夹路径）
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop();
        const fileName = `${folder}/${timestamp}-${random}.${ext}`;

        // 如果有 R2 绑定
        if (env.IMAGES) {
            await env.IMAGES.put(fileName, file.stream(), {
                httpMetadata: {
                    contentType: file.type,
                    cacheControl: 'public, max-age=31536000',
                },
            });

            // 返回公开访问 URL
            const url = `https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/${fileName}`;
            return jsonResponse({ url });
        }

        return errorResponse('存储服务未配置', 500);

    } catch (error) {
        return errorResponse(error.message, 500);
    }
}
