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
    const filePath = path.join(UPLOAD_DIR, key);
    // 确保父目录存在
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
  },

  /**
   * 删除文件
   * @param key 相对文件名/路径
   */
  async delete(key: string): Promise<void> {
    const filePath = path.join(UPLOAD_DIR, key);
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
   */
  async get(key: string): Promise<Buffer | null> {
    const filePath = path.join(UPLOAD_DIR, key);
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
