import { describe, it, expect } from 'vitest';
import {
    sanitizeString,
    cleanString,
    hasXSS,
    hasSQLInjection,
    validateRequired,
    validateLength,
    validateDate,
    validateRating,
    validateUrl,
    validate,
    sanitizeObject,
} from './validation';

describe('sanitizeString', () => {
    it('应该转义HTML特殊字符', () => {
        expect(sanitizeString('<script>alert("xss")</script>')).toBe(
            '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
        );
    });

    it('应该转义单引号', () => {
        expect(sanitizeString("it's")).toBe('it&#x27;s');
    });

    it('应该处理空字符串', () => {
        expect(sanitizeString('')).toBe('');
    });

    it('非字符串输入应返回空字符串', () => {
        expect(sanitizeString(123 as unknown as string)).toBe('');
    });
});

describe('cleanString', () => {
    it('应该移除script标签', () => {
        const result = cleanString('<script>alert(1)</script>hello');
        expect(result).not.toContain('<script');
        expect(result).not.toContain('</script');
        expect(result).toContain('hello');
    });

    it('应该移除javascript:协议', () => {
        const result = cleanString('javascript:void(0)');
        expect(result).not.toContain('javascript:');
    });

    it('应该移除on事件属性', () => {
        const result = cleanString('<div onclick="alert(1)">text</div>');
        expect(result).not.toContain('onclick=');
    });

    it('应该保留正常文本', () => {
        expect(cleanString('hello world')).toBe('hello world');
    });

    it('非字符串输入应返回空字符串', () => {
        expect(cleanString(null as unknown as string)).toBe('');
    });
});

describe('hasXSS', () => {
    it('应该检测script标签', () => {
        expect(hasXSS('<script>alert(1)</script>')).toBe(true);
    });

    it('应该检测javascript:协议', () => {
        expect(hasXSS('javascript:alert(1)')).toBe(true);
    });

    it('应该检测onclick事件', () => {
        expect(hasXSS('<img onclick="alert(1)">')).toBe(true);
    });

    it('应该检测iframe标签', () => {
        expect(hasXSS('<iframe src="evil.com"></iframe>')).toBe(true);
    });

    it('正常文本不应触发检测', () => {
        expect(hasXSS('hello world')).toBe(false);
    });

    it('非字符串输入应返回false', () => {
        expect(hasXSS(123 as unknown as string)).toBe(false);
    });
});

describe('hasSQLInjection', () => {
    it('应该检测union select', () => {
        expect(hasSQLInjection('union select * from users')).toBe(true);
    });

    it('应该检测drop table', () => {
        expect(hasSQLInjection('drop table users')).toBe(true);
    });

    it('应该检测insert into', () => {
        expect(hasSQLInjection('insert into users values(1)')).toBe(true);
    });

    it('正常文本不应触发检测', () => {
        expect(hasSQLInjection('hello world')).toBe(false);
    });

    it('非字符串输入应返回false', () => {
        expect(hasSQLInjection(123 as unknown as string)).toBe(false);
    });
});

describe('validateRequired', () => {
    it('空字符串应返回错误', () => {
        expect(validateRequired('', '标题')).toBe('标题不能为空');
    });

    it('纯空格字符串应返回错误', () => {
        expect(validateRequired('   ', '标题')).toBe('标题不能为空');
    });

    it('null应返回错误', () => {
        expect(validateRequired(null, '标题')).toBe('标题不能为空');
    });

    it('undefined应返回错误', () => {
        expect(validateRequired(undefined, '标题')).toBe('标题不能为空');
    });

    it('有效值应返回null', () => {
        expect(validateRequired('hello', '标题')).toBeNull();
    });

    it('数字0应视为有效值', () => {
        expect(validateRequired(0, '数量')).toBeNull();
    });
});

describe('validateLength', () => {
    it('过短的字符串应返回错误', () => {
        expect(validateLength('ab', '标题', 3, 10)).toBe('标题长度不能少于3个字符');
    });

    it('过长的字符串应返回错误', () => {
        expect(validateLength('a'.repeat(101), '标题', 1, 100)).toBe('标题长度不能超过100个字符');
    });

    it('合法长度应返回null', () => {
        expect(validateLength('hello', '标题', 1, 10)).toBeNull();
    });

    it('边界值应通过验证', () => {
        expect(validateLength('a', '标题', 1, 100)).toBeNull();
        expect(validateLength('a'.repeat(100), '标题', 1, 100)).toBeNull();
    });
});

describe('validateDate', () => {
    it('有效日期应返回null', () => {
        expect(validateDate('2024-01-15', '日期')).toBeNull();
    });

    it('无效格式应返回错误', () => {
        expect(validateDate('2024/01/15', '日期')).toBe('日期日期格式无效，应为YYYY-MM-DD');
    });

    it('不存在的日期应返回错误', () => {
        expect(validateDate('2024-13-01', '日期')).toBe('日期不是有效的日期');
    });

    it('空字符串应返回错误', () => {
        expect(validateDate('', '日期')).toBe('日期日期格式无效，应为YYYY-MM-DD');
    });
});

describe('validateRating', () => {
    it('有效评分应返回null', () => {
        expect(validateRating(5, '评分')).toBeNull();
        expect(validateRating(1, '评分')).toBeNull();
        expect(validateRating(3, '评分')).toBeNull();
    });

    it('超出范围的评分应返回错误', () => {
        expect(validateRating(0, '评分')).toBe('评分评分必须在1-5之间');
        expect(validateRating(6, '评分')).toBe('评分评分必须在1-5之间');
    });

    it('小数应返回错误', () => {
        expect(validateRating(3.5, '评分')).toBe('评分评分必须在1-5之间');
    });
});

describe('validateUrl', () => {
    it('有效URL应返回null', () => {
        expect(validateUrl('https://example.com', '链接')).toBeNull();
    });

    it('无效URL应返回错误', () => {
        expect(validateUrl('not-a-url', '链接')).toBe('链接URL格式无效');
    });

    it('相对路径应返回错误', () => {
        expect(validateUrl('/path/to/page', '链接')).toBe('链接URL格式无效');
    });
});

describe('validate', () => {
    it('所有规则通过时应返回null', () => {
        const result = validate([
            validateRequired('hello', '标题'),
            validateLength('hello', '标题', 1, 10),
        ]);
        expect(result).toBeNull();
    });

    it('应返回第一个错误', () => {
        const result = validate([
            validateRequired('', '标题'),
            validateLength('test', '标题', 1, 10),
        ]);
        expect(result).toBe('标题不能为空');
    });

    it('空规则数组应返回null', () => {
        expect(validate([])).toBeNull();
    });
});

describe('sanitizeObject', () => {
    it('应该消毒所有字符串字段', () => {
        const input = {
            title: '<script>alert(1)</script>hello',
            description: 'normal text',
        };
        const result = sanitizeObject(input);
        expect(result.title).not.toContain('<script');
        expect(result.description).toBe('normal text');
    });

    it('应该跳过指定的字段', () => {
        const input = {
            title: '<script>bad</script>',
            images: ['<script>url</script>'],
        };
        const result = sanitizeObject(input, ['images']);
        expect(result.title).not.toContain('<script');
        expect(result.images).toEqual(['<script>url</script>']);
    });

    it('应该保留非字符串字段', () => {
        const input = {
            title: 'hello',
            count: 42,
            active: true,
        };
        const result = sanitizeObject(input);
        expect(result.title).toBe('hello');
        expect(result.count).toBe(42);
        expect(result.active).toBe(true);
    });
});
