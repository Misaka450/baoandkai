import { describe, it, expect } from 'vitest';
import { isPublicPath } from './auth.js';

describe('isPublicPath 路径安全性判断', () => {
    it('/api/config 仅允许公开 GET 请求，拒绝未授权 PUT/POST 修改', () => {
        expect(isPublicPath('/api/config', 'GET')).toBe(true);
        expect(isPublicPath('/api/config', 'PUT')).toBe(false);
        expect(isPublicPath('/api/config', 'POST')).toBe(false);
        expect(isPublicPath('/api/config', 'DELETE')).toBe(false);
    });

    it('/api/vault/export 仅允许 POST 导出请求', () => {
        expect(isPublicPath('/api/vault/export', 'POST')).toBe(true);
        expect(isPublicPath('/api/vault/export', 'GET')).toBe(false);
    });

    it('/api/images/* 仅允许 GET 访问图片', () => {
        expect(isPublicPath('/api/images/test.jpg', 'GET')).toBe(true);
        expect(isPublicPath('/api/images/test.jpg', 'DELETE')).toBe(false);
        expect(isPublicPath('/api/images/test.jpg', 'POST')).toBe(false);
    });

    it('公开认证路由允许访问', () => {
        expect(isPublicPath('/api/auth/login', 'POST')).toBe(true);
        expect(isPublicPath('/api/auth/check-token', 'GET')).toBe(true);
    });

    it('业务私有接口必须拦截', () => {
        expect(isPublicPath('/api/timeline', 'GET')).toBe(false);
        expect(isPublicPath('/api/albums', 'GET')).toBe(false);
        expect(isPublicPath('/api/food', 'GET')).toBe(false);
        expect(isPublicPath('/api/todos', 'GET')).toBe(false);
        expect(isPublicPath('/api/map', 'GET')).toBe(false);
        expect(isPublicPath('/api/notes', 'GET')).toBe(false);
        expect(isPublicPath('/api/stats', 'GET')).toBe(false);
    });
});
