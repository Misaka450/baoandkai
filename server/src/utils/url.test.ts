import { describe, it, expect } from 'vitest';
import {
  transformImageUrl,
  serializeImages,
  transformImageArray,
  extractStorageKey,
  isLocalImageUrl
} from './url.js';

describe('url utils', () => {
  it('isLocalImageUrl 识别本地路径', () => {
    expect(isLocalImageUrl('/uploads/photos/1.jpg')).toBe(true);
    expect(isLocalImageUrl('/api/images/photos/1.jpg?w=400')).toBe(true);
    expect(isLocalImageUrl('https://example.com/1.jpg')).toBe(false);
    expect(isLocalImageUrl('')).toBe(false);
    expect(isLocalImageUrl(null)).toBe(false);
  });

  it('extractStorageKey 准确提取相对文件 Key', () => {
    expect(extractStorageKey('/uploads/albums/test/1.jpg')).toBe('albums/test/1.jpg');
    expect(extractStorageKey('https://example.com/uploads/albums/test/1.jpg')).toBe('albums/test/1.jpg');
    expect(extractStorageKey('/api/images/photos/2.jpg?w=400&q=80')).toBe('photos/2.jpg');
    expect(extractStorageKey('images/%E7%85%A7%E7%89%87.jpg')).toBe('images/照片.jpg');
    expect(extractStorageKey(null)).toBe('');
  });

  it('transformImageUrl 转换相对 Key 为访问路径', () => {
    expect(transformImageUrl('albums/1.jpg')).toBe('/uploads/albums/1.jpg');
    expect(transformImageUrl('/uploads/albums/1.jpg')).toBe('/uploads/albums/1.jpg');
    expect(transformImageUrl('https://example.com/1.jpg')).toBe('https://example.com/1.jpg');
    expect(transformImageUrl('')).toBe('');
  });

  it('serializeImages 统一序列化为 JSON 字符串', () => {
    expect(serializeImages(['a.jpg', 'b.jpg'])).toBe('["a.jpg","b.jpg"]');
    expect(serializeImages('a.jpg,b.jpg')).toBe('["a.jpg","b.jpg"]');
    expect(serializeImages('["a.jpg"]')).toBe('["a.jpg"]');
    expect(serializeImages(null)).toBe('[]');
  });

  it('transformImageArray 解析并转换图片数组', () => {
    expect(transformImageArray('["1.jpg", "2.jpg"]')).toEqual([
      '/uploads/1.jpg',
      '/uploads/2.jpg'
    ]);
    expect(transformImageArray(['1.jpg', '/uploads/2.jpg'])).toEqual([
      '/uploads/1.jpg',
      '/uploads/2.jpg'
    ]);
    expect(transformImageArray(null)).toEqual([]);
  });
});
