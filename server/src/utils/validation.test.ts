/**
 * 输入校验工具函数测试（对应审计 M-4 首批安全测试）
 *
 * 覆盖 XSS 检测、SQL 注入特征检测、文件魔数验证、日期与评分校验。
 */
import { describe, it, expect } from 'vitest';
import {
    hasXSS,
    hasSQLInjection,
    validateImageMagic,
    validateDate,
    validateRating,
    validateRequired,
    validateLength,
} from './validation.js';

describe('hasXSS（XSS 攻击特征检测）', () => {
    it('识别 script 标签', () => {
        expect(hasXSS('<script>alert(1)</script>')).toBe(true);
        expect(hasXSS('正常文字<script>')).toBe(true);
    });

    it('识别 javascript: 伪协议', () => {
        expect(hasXSS('javascript:alert(1)')).toBe(true);
    });

    it('识别 on* 事件属性注入', () => {
        expect(hasXSS('<img src=x onerror=alert(1)>')).toBe(true);
        expect(hasXSS('<body onload=alert(1)>')).toBe(true);
    });

    it('正常文本不误报', () => {
        expect(hasXSS('今天和包包一起吃了火锅，很开心！')).toBe(false);
        expect(hasXSS('Constitution Day 纪念日 2026-10-01')).toBe(false);
    });
});

describe('hasSQLInjection（SQL 注入特征检测）', () => {
    it('识别常见注入语句', () => {
        expect(hasSQLInjection('1 union select * from users')).toBe(true);
        expect(hasSQLInjection("'; drop table users;--")).toBe(true);
    });

    it('正常文本不误报', () => {
        expect(hasSQLInjection('今天天气不错')).toBe(false);
        expect(hasSQLInjection('I want to update my profile set')).toBe(false);
    });
});

describe('validateImageMagic（文件魔数验证）', () => {
    it('JPEG 文件头匹配成功', () => {
        const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
        expect(validateImageMagic(jpegBytes, 'image/jpeg')).toBe(true);
    });

    it('PNG 文件头匹配成功', () => {
        const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A]);
        expect(validateImageMagic(pngBytes, 'image/png')).toBe(true);
    });

    it('伪造的 MIME 类型被拒绝（恶意文件伪装成图片）', () => {
        // 内容实际是 PNG，却声明为 JPEG —— 必须拒绝
        const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47]);
        expect(validateImageMagic(pngBytes, 'image/jpeg')).toBe(false);
    });

    it('完全无关的内容被拒绝', () => {
        const evilBytes = new Uint8Array([0x4D, 0x5A, 0x90, 0x00]); // Windows 可执行文件头
        expect(validateImageMagic(evilBytes, 'image/png')).toBe(false);
    });
});

describe('validateDate / validateRating（业务字段校验）', () => {
    it('合法日期通过校验', () => {
        expect(validateDate('2026-10-04', '日期')).toBeNull();
    });

    it('非法日期格式被拒绝', () => {
        expect(validateDate('2026/10/04', '日期')).not.toBeNull();
        expect(validateDate('2026-13-40', '日期')).not.toBeNull();
        expect(validateDate('not-a-date', '日期')).not.toBeNull();
    });

    it('评分必须在 1-5 的整数', () => {
        expect(validateRating(3, '评分')).toBeNull();
        expect(validateRating(0, '评分')).not.toBeNull();
        expect(validateRating(6, '评分')).not.toBeNull();
        expect(validateRating(4.5, '评分')).not.toBeNull();
    });
});

describe('validateRequired / validateLength（基础校验）', () => {
    it('空值与空白字符串被拒绝', () => {
        expect(validateRequired('', '名称')).not.toBeNull();
        expect(validateRequired('   ', '名称')).not.toBeNull();
        expect(validateRequired(null, '名称')).not.toBeNull();
        expect(validateRequired('包包', '名称')).toBeNull();
    });

    it('长度超限被拒绝', () => {
        expect(validateLength('a'.repeat(101), '名称', 1, 100)).not.toBeNull();
        expect(validateLength('a', '名称', 1, 100)).toBeNull();
    });
});
