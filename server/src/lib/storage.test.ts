/**
 * storage 模块安全测试（对应审计问题 C-1 路径遍历漏洞的回归测试）
 *
 * 核心目标：任何形式的目录逃逸路径都必须被拦截，
 * 确保攻击者无法通过 /api/images/* 等公开接口读取上传目录之外的任意文件。
 */
import { describe, it, expect, afterAll } from 'vitest';
import { storage } from './storage.js';

// 测试用的临时目录（由 vitest.config.ts 的 env.UPLOAD_DIR 指定，位于项目内）
const TEST_DIR = 'uploads-test';

afterAll(async () => {
  // 测试结束后清理临时文件（目录本身保留，下次测试复用）
  await storage.delete(`${TEST_DIR}/hello.txt`).catch(() => {});
});

describe('storage 路径安全校验（防路径遍历攻击）', () => {
  it('拒绝 ../ 形式的路径遍历', async () => {
    // 经典攻击：逃逸到上传目录外读取敏感文件
    expect(await storage.get('../server/.env')).toBeNull();
    expect(await storage.get('../../etc/passwd')).toBeNull();
    expect(await storage.get('images/../../secrets.txt')).toBeNull();
  });

  it('拒绝反斜杠 \\ 形式的路径遍历（Windows 风格）', async () => {
    expect(await storage.get('..\\..\\server\\.env')).toBeNull();
    expect(await storage.get('images\\..\\..\\.env')).toBeNull();
  });

  it('拒绝 URL 编码形式的路径遍历（%2e%2e = ..）', async () => {
    expect(await storage.get('%2e%2e%2fserver%2f.env')).toBeNull();
    expect(await storage.get('..%2f..%2fserver%2f.env')).toBeNull();
  });

  it('深层嵌套的合法相对路径不会误判（如 albums/xxx/photo.jpg）', async () => {
    // 该路径不存在，应返回 null（而不是抛异常），且不会被当作攻击拦截而报错
    await expect(storage.get('albums/不存在相册/photo.jpg')).resolves.toBeNull();
  });

  it('正常文件的写入、读取、删除流程不受安全校验影响', async () => {
    const key = `${TEST_DIR}/hello.txt`;
    const content = Buffer.from('hello bbkk');

    // 写入
    await storage.put(key, content);
    // 读取并比对内容
    const data = await storage.get(key);
    expect(data).not.toBeNull();
    expect(data!.toString()).toBe('hello bbkk');
    // 删除后再读取应返回 null
    await storage.delete(key);
    expect(await storage.get(key)).toBeNull();
  });
});
