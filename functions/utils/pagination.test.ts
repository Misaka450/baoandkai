import { describe, it, expect } from 'vitest';
import { parsePagination, buildPaginatedResponse } from './pagination';

describe('parsePagination', () => {
    it('应该解析默认分页参数', () => {
        const url = new URL('https://example.com/api/data');
        const result = parsePagination(url);
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(20);
        expect(result.offset).toBe(0);
    });

    it('应该解析自定义分页参数', () => {
        const url = new URL('https://example.com/api/data?page=3&pageSize=10');
        const result = parsePagination(url);
        expect(result.page).toBe(3);
        expect(result.pageSize).toBe(10);
        expect(result.offset).toBe(20);
    });

    it('应该使用自定义默认值', () => {
        const url = new URL('https://example.com/api/data');
        const result = parsePagination(url, 50);
        expect(result.pageSize).toBe(50);
    });

    it('page参数为0时应修正为1', () => {
        const url = new URL('https://example.com/api/data?page=0');
        const result = parsePagination(url);
        expect(result.page).toBe(1);
    });

    it('page参数为负数时应修正为1', () => {
        const url = new URL('https://example.com/api/data?page=-5');
        const result = parsePagination(url);
        expect(result.page).toBe(1);
    });

    it('pageSize超过最大值时应限制', () => {
        const url = new URL('https://example.com/api/data?pageSize=200');
        const result = parsePagination(url);
        expect(result.pageSize).toBe(100);
    });

    it('pageSize为0时应使用默认值', () => {
        const url = new URL('https://example.com/api/data?pageSize=0');
        const result = parsePagination(url);
        expect(result.pageSize).toBe(20);
    });

    it('无效的page参数应使用默认值', () => {
        const url = new URL('https://example.com/api/data?page=abc');
        const result = parsePagination(url);
        expect(result.page).toBe(1);
    });
});

describe('buildPaginatedResponse', () => {
    it('应该构建正确的分页响应', () => {
        const data = [{ id: 1 }, { id: 2 }];
        const params = { page: 1, pageSize: 10, offset: 0 };
        const result = buildPaginatedResponse(data, 25, params);

        expect(result.data).toEqual(data);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.pageSize).toBe(10);
        expect(result.pagination.total).toBe(25);
        expect(result.pagination.totalPages).toBe(3);
    });

    it('总数为0时应正确处理', () => {
        const result = buildPaginatedResponse([], 0, { page: 1, pageSize: 10, offset: 0 });
        expect(result.pagination.total).toBe(0);
        expect(result.pagination.totalPages).toBe(0);
    });

    it('最后一页不满时应正确计算总页数', () => {
        const result = buildPaginatedResponse([], 21, { page: 1, pageSize: 10, offset: 0 });
        expect(result.pagination.totalPages).toBe(3);
    });
});
