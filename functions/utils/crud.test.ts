import { describe, it, expect } from 'vitest';
import {
    extractIdFromUrl,
    validateAndSanitize,
    parsePaginationFromUrl,
    ValidationError,
    NotFoundError,
    handleCrudError,
} from './crud';

describe('extractIdFromUrl', () => {
    it('应该从URL中提取ID', () => {
        const url = new URL('https://example.com/api/map/123');
        expect(extractIdFromUrl(url)).toBe(123);
    });

    it('应该从多段URL中提取最后一段作为ID', () => {
        const url = new URL('https://example.com/api/photos/789');
        expect(extractIdFromUrl(url)).toBe(789);
    });

    it('无效ID应抛出ValidationError', () => {
        const url = new URL('https://example.com/api/map/abc');
        expect(() => extractIdFromUrl(url)).toThrow(ValidationError);
    });

    it('负数ID应抛出ValidationError', () => {
        const url = new URL('https://example.com/api/map/-1');
        expect(() => extractIdFromUrl(url)).toThrow(ValidationError);
    });

    it('缺少ID应抛出ValidationError', () => {
        const url = new URL('https://example.com/api/map/');
        expect(() => extractIdFromUrl(url)).toThrow(ValidationError);
    });
});

describe('validateAndSanitize', () => {
    it('应该验证并消毒有效数据', () => {
        const body = { title: 'Hello World', description: 'A test' };
        const result = validateAndSanitize(body, [
            { name: 'title', label: '标题', maxLength: 100 },
        ]);
        expect(result.title).toBe('Hello World');
    });

    it('缺少必填字段应抛出ValidationError', () => {
        const body = { title: '' };
        expect(() =>
            validateAndSanitize(body, [{ name: 'title', label: '标题' }])
        ).toThrow(ValidationError);
    });

    it('XSS内容应抛出ValidationError', () => {
        const body = { title: '<script>alert(1)</script>' };
        expect(() =>
            validateAndSanitize(body, [{ name: 'title', label: '标题' }])
        ).toThrow(ValidationError);
    });

    it('应该跳过指定字段的消毒', () => {
        const body = { title: 'Hello', images: ['<script>url</script>'] };
        const result = validateAndSanitize(
            body,
            [{ name: 'title', label: '标题' }],
            ['images']
        );
        expect(result.images).toEqual(['<script>url</script>']);
    });

    it('超长字段应抛出ValidationError', () => {
        const body = { title: 'a'.repeat(101) };
        expect(() =>
            validateAndSanitize(body, [{ name: 'title', label: '标题', maxLength: 100 }])
        ).toThrow(ValidationError);
    });
});

describe('parsePaginationFromUrl', () => {
    it('应该解析默认分页参数', () => {
        const url = new URL('https://example.com/api/data');
        const result = parsePaginationFromUrl(url);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
        expect(result.offset).toBe(0);
    });

    it('应该解析自定义分页参数', () => {
        const url = new URL('https://example.com/api/data?page=3&limit=10');
        const result = parsePaginationFromUrl(url);
        expect(result.page).toBe(3);
        expect(result.limit).toBe(10);
        expect(result.offset).toBe(20);
    });

    it('limit超过最大值时应限制', () => {
        const url = new URL('https://example.com/api/data?limit=200');
        const result = parsePaginationFromUrl(url);
        expect(result.limit).toBe(100);
    });
});

describe('handleCrudError', () => {
    it('ValidationError应返回400', async () => {
        const response = handleCrudError(new ValidationError('验证失败'));
        expect(response.status).toBe(400);
        const body = await response.json() as { error: string };
        expect(body.error).toBe('验证失败');
    });

    it('NotFoundError应返回404', async () => {
        const response = handleCrudError(new NotFoundError('记录不存在'));
        expect(response.status).toBe(404);
        const body = await response.json() as { error: string };
        expect(body.error).toBe('记录不存在');
    });

    it('普通Error应返回500', async () => {
        const response = handleCrudError(new Error('数据库错误'));
        expect(response.status).toBe(500);
        const body = await response.json() as { error: string };
        expect(body.error).toBe('服务器内部错误');
    });

    it('未知错误类型应返回500', async () => {
        const response = handleCrudError('unknown error');
        expect(response.status).toBe(500);
    });
});
