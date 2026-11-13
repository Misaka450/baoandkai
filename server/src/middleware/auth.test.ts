import { describe, it, expect } from 'vitest';
import { isPublicPath, safeCompareCsrf } from './auth.js';

describe('isPublicPath 路径安全性判断', () => {
    it('/api/health 仅允许公开 GET 健康检查', () => {
        expect(isPublicPath('/api/health', 'GET')).toBe(true);
        expect(isPublicPath('/api/health', 'POST')).toBe(false);
    });

    it('/api/config 仅允许公开 GET 请求，拒绝未授权 PUT/POST 修改', () => {
        expect(isPublicPath('/api/config', 'GET')).toBe(true);
        expect(isPublicPath('/api/config', 'PUT')).toBe(false);
        expect(isPublicPath('/api/config', 'POST')).toBe(false);
        expect(isPublicPath('/api/config', 'DELETE')).toBe(false);
    });

    it('/api/vault/export 已从公开路径移除，必须经过登录 Session 与 CSRF 校验', () => {
        expect(isPublicPath('/api/vault/export', 'POST')).toBe(false);
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
        expect(isPublicPath('/api/auth/update-password-hash', 'POST')).toBe(true);
        expect(isPublicPath('/api/auth/update-password-hash', 'GET')).toBe(false);
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

describe('safeCompareCsrf 常量时间比对', () => {
    it('相同长度相同内容返回 true', () => {
        expect(safeCompareCsrf('a1b2c3d4e5f6', 'a1b2c3d4e5f6')).toBe(true);
    });

    it('相同长度不同内容返回 false', () => {
        expect(safeCompareCsrf('a1b2c3d4e5f6', 'a1b2c3d4e5f7')).toBe(false);
    });

    it('长度不等时安全返回 false 且不抛异常', () => {
        expect(safeCompareCsrf('short', 'much_longer_token')).toBe(false);
        expect(safeCompareCsrf('', 'nonempty')).toBe(false);
    });
});
