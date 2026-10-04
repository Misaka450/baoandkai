import { defineConfig } from 'vitest/config';

/**
 * 后端测试配置
 *
 * UPLOAD_DIR 说明：storage.ts 在模块加载时读取该环境变量确定上传根目录。
 * 测试时指向项目内的临时目录，避免测试写入/读取到真实上传目录
 * 或项目外的路径（Windows 下默认值会指到项目上级目录）。
 */
export default defineConfig({
    test: {
        globals: false,
        environment: 'node',
        include: ['src/**/*.test.ts'],
        env: {
            UPLOAD_DIR: 'uploads-test',
        },
    },
});
