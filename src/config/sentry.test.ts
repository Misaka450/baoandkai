import { describe, it, expect, vi } from 'vitest';
import { initSentry, captureError } from './sentry';

describe('sentry 异步按需加载配置', () => {
    it('非生产环境下 initSentry 不触发报错', async () => {
        await expect(initSentry()).resolves.toBeUndefined();
    });

    it('开发环境下 captureError 安全降级输出 warning', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        captureError(new Error('test error'), { context: 'test' });
        // 在 Vitest 默认模式下 import.meta.env.PROD 为 false
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });
});
