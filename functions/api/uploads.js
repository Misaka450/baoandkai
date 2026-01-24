import { jsonResponse, errorResponse } from '../utils/response';

// POST /api/uploads - 通用文件上传
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return errorResponse('未找到文件', 400);
        }

        // 生成唯一文件名
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop();
        const fileName = `${timestamp}-${random}.${ext}`;

        // 如果有 R2 绑定
        if (env.IMAGES) {
            await env.IMAGES.put(fileName, file.stream(), {
                httpMetadata: {
                    contentType: file.type,
                },
            });

            // 假设有一个公共访问域名（需要在 Cloudflare 设置中配置自定义域或 Public Access）
            // 这里如果没配置，我们可以返回一个 R2 的临时 URL 或者假设有一个 worker 代理
            // 为了简单，我们假设 r2.dev 或者自定义域名配置好了。
            // 如果没有自定义域名，可以使用 /api/images/:key 来代理访问
            const url = `/api/images/${fileName}`;
            return jsonResponse({ url });
        }

        // 本地开发回退方案：直接返回 Data URL (不推荐生产使用，但用于演示)
        // 注意：worker functions 对于 File 读取 arrayBuffer
        // 本地没有 R2 模拟时，此分支可能无法持久化。
        // 但 Wrangler local 应该支持本地 R2 模拟。

        return errorResponse('存储服务未配置', 500);

    } catch (error) {
        return errorResponse(error.message, 500);
    }
}
