import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
    IMAGES: R2Bucket;
    DB: D1Database;
}

/**
 * 诊断上传接口：测试 R2 写入是否成功
 * POST /api/debug/test-upload
 */
export async function onRequestPost(context: { request: Request; env: Env }) {
    const { request, env } = context;

    const diagnostics: any = {
        steps: [],
        error: null,
        success: false
    };

    try {
        // Step 1: Check bindings
        diagnostics.steps.push({ step: 1, action: 'check_bindings', images_binding: !!env.IMAGES, db_binding: !!env.DB });

        if (!env.IMAGES) {
            throw new Error('IMAGES binding not available');
        }

        // Step 2: Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        diagnostics.steps.push({
            step: 2,
            action: 'parse_formdata',
            file_exists: !!file,
            file_name: file?.name,
            file_size: file?.size,
            file_type: file?.type
        });

        if (!file) {
            throw new Error('No file in form data');
        }

        // Step 3: Generate key
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const key = `test-uploads/${timestamp}-${randomStr}.${extension}`;
        diagnostics.steps.push({ step: 3, action: 'generate_key', key });

        // Step 4: Attempt R2 put with stream
        let putResult;
        try {
            putResult = await env.IMAGES.put(key, file.stream(), {
                httpMetadata: { contentType: file.type },
            });
            diagnostics.steps.push({
                step: 4,
                action: 'r2_put_stream',
                success: true,
                result_key: putResult?.key,
                result_size: putResult?.size
            });
        } catch (putError: any) {
            diagnostics.steps.push({
                step: 4,
                action: 'r2_put_stream',
                success: false,
                error: putError.message
            });
            throw putError;
        }

        // Step 5: Verify the file exists
        const verifyObject = await env.IMAGES.get(key);
        diagnostics.steps.push({
            step: 5,
            action: 'verify_exists',
            exists: !!verifyObject,
            size: verifyObject?.size
        });

        if (!verifyObject) {
            throw new Error('File not found after put - verification failed');
        }

        // Step 6: Clean up test file
        await env.IMAGES.delete(key);
        diagnostics.steps.push({ step: 6, action: 'cleanup', deleted: true });

        diagnostics.success = true;
        return jsonResponse(diagnostics);
    } catch (error: any) {
        diagnostics.error = error.message;
        return jsonResponse(diagnostics, 500);
    }
}
