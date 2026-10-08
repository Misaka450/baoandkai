import { describe, it, expect } from 'vitest';
import { parsePagination, buildPaginatedResponse } from './pagination.js';

describe('parsePagination 分页参数解析', () => {
    it('使用默认参数', () => {
        const url = new URL('http://localhost/api/test');
        const result = parsePagination(url);
        expect(result).toEqual({ page: 1, pageSize: 20, offset: 0 });
    });

    it('解析 page 与 pageSize', () => {
        const url = new URL('http://localhost/api/test?page=3&pageSize=15');
        const result = parsePagination(url);
        expect(result).toEqual({ page: 3, pageSize: 15, offset: 30 });
    });

    it('兼容 limit 参数作为 pageSize 的别名', () => {
        const url = new URL('http://localhost/api/test?page=2&limit=50');
        const result = parsePagination(url);
        expect(result).toEqual({ page: 2, pageSize: 50, offset: 50 });
    });

    it('pageSize 优先于 limit', () => {
        const url = new URL('http://localhost/api/test?pageSize=10&limit=50');
        const result = parsePagination(url);
        expect(result.pageSize).toBe(10);
    });

    it('限制最大每页条数 maxPageSize', () => {
        const url = new URL('http://localhost/api/test?limit=500');
        const result = parsePagination(url, 20, 100);
        expect(result.pageSize).toBe(100);
    });

    it('非数字或负数自动校正为合法值', () => {
        const url = new URL('http://localhost/api/test?page=-5&limit=abc');
        const result = parsePagination(url, 10);
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(10);
        expect(result.offset).toBe(0);
    });
});

describe('buildPaginatedResponse 分页响应封装', () => {
    it('正确计算 totalPages', () => {
        const params = { page: 2, pageSize: 10, offset: 10 };
        const data = [{ id: 1 }, { id: 2 }];
        const response = buildPaginatedResponse(data, 25, params);

        expect(response.data).toEqual(data);
        expect(response.pagination).toEqual({
            page: 2,
            pageSize: 10,
            total: 25,
            totalPages: 3,
        });
    });
});
