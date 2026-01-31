import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
    IMAGES: R2Bucket;
    DB: D1Database;
}

/**
 * 诊断端点：检查 R2 绑定状态和文件存在性
 * GET /api/debug/check
 */
export async function onRequestGet(context: { env: Env; request: Request }) {
    const { env, request } = context;

    const diagnostics: any = {
        timestamp: new Date().toISOString(),
        r2_binding: null,
        db_binding: null,
        sample_files: [],
        test_file: null
    };

    // 检查 R2 绑定
    if (env.IMAGES) {
        diagnostics.r2_binding = 'OK';
        try {
            const list = await env.IMAGES.list({ limit: 5 });
            diagnostics.sample_files = list.objects.map(o => ({
                key: o.key,
                size: o.size
            }));
        } catch (e: any) {
            diagnostics.r2_binding = 'ERROR: ' + e.message;
        }
    } else {
        diagnostics.r2_binding = 'NOT_CONFIGURED';
    }

    // 检查 DB 绑定
    if (env.DB) {
        diagnostics.db_binding = 'OK';
    } else {
        diagnostics.db_binding = 'NOT_CONFIGURED';
    }

    // 检查特定测试文件
    const url = new URL(request.url);
    const testKey = url.searchParams.get('key');
    if (testKey && env.IMAGES) {
        try {
            const obj = await env.IMAGES.get(testKey);
            if (obj) {
                diagnostics.test_file = {
                    key: testKey,
                    exists: true,
                    size: obj.size,
                    contentType: obj.httpMetadata?.contentType
                };
            } else {
                diagnostics.test_file = { key: testKey, exists: false };
            }
        } catch (e: any) {
            diagnostics.test_file = { key: testKey, error: e.message };
        }
    }

    return jsonResponse(diagnostics);
}
