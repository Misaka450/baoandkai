import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// 获取上传目录，默认在项目根目录下的 uploads 文件夹
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(process.cwd(), '../uploads');

// 确保上传目录存在
try {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
} catch (err) {
  console.error(`Failed to create upload directory at ${UPLOAD_DIR}:`, err);
}

/**
 * 路径安全校验（防路径遍历攻击的核心防线）
 *
 * 原理：path.join 遇到 "../../" 这类相对路径片段时会"逃逸"出上传目录，
 * 例如 path.join('/app/uploads', '../server/.env') 会解析成 /app/server/.env。
 * 因此所有文件操作前，必须先把路径解析成绝对路径，
 * 再确认它仍然位于上传目录内部，否则视为非法请求直接拒绝。
 *
 * @param key 客户端传入的相对路径（不可信输入）
 * @returns 校验通过的绝对文件路径
 * @throws 路径逃逸出上传目录时抛出错误
 */
function resolveSafe(key: string): string {
  // 1. 先做 URL 解码（防止 %2e%2e%2f 这种编码形态的 "../" 绕过）
  // 声明时不赋初值：解码成功必走 try 内赋值，失败必抛错，初始值永远不会被使用
  let decodedKey: string;
  try {
    decodedKey = decodeURIComponent(key);
  } catch {
    // 解码失败说明路径格式本身异常，直接拒绝
    throw new Error('非法的文件路径');
  }

  // 2. 反斜杠统一转成正斜杠（防止 Windows 风格 ..\ 绕过）
  const normalizedKey = decodedKey.replace(/\\/g, '/');

  // 3. 解析成绝对路径，并与上传目录的真实绝对路径做前缀比对
  const uploadRoot = path.resolve(UPLOAD_DIR);
  const filePath = path.resolve(uploadRoot, normalizedKey);

  if (filePath !== uploadRoot && !filePath.startsWith(uploadRoot + path.sep)) {
    // 路径逃逸出了上传目录，属于路径遍历攻击，拒绝访问
    throw new Error('非法的文件路径');
  }

  return filePath;
}

export const storage = {
  getUploadDir() {
    return UPLOAD_DIR;
  },

  /**
   * 写入文件
   * @param key 相对文件名/路径，例如 'albums/123/photo.jpg'
   * @param data 文件二进制数据 (Buffer)
   */
  async put(key: string, data: Buffer | Uint8Array): Promise<void> {
    // 安全校验：确保写入路径不会逃逸出上传目录
    const filePath = resolveSafe(key);
    // 确保父目录存在
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
  },

  /**
   * 删除文件
   * @param key 相对文件名/路径
   */
  async delete(key: string): Promise<void> {
    // 安全校验：确保删除路径不会逃逸出上传目录
    const filePath = resolveSafe(key);
    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error(`Failed to delete local file at ${filePath}:`, err);
        throw err;
      }
    }
  },

  /**
   * 获取文件二进制数据 (仅作为降级/测试用，Nginx 正常会直接服务)
   * @returns 文件内容；文件不存在或路径非法时返回 null（不向调用方泄露细节）
   */
  async get(key: string): Promise<Buffer | null> {
    // 安全校验：路径逃逸时静默返回 null（等同"文件不存在"），
    // 避免向攻击者暴露"路径被拦截"的信号
    let filePath: string;
    try {
      filePath = resolveSafe(key);
    } catch {
      return null;
    }
    try {
      return await fs.readFile(filePath);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }
};
