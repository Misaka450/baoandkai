import pg from 'pg';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

// 连接池配置
const poolConfig = {
  max: 20,                    // 最大连接数（默认 10）
  idleTimeoutMillis: 30000,   // 空闲连接超时 30 秒
  connectionTimeoutMillis: 5000, // 连接超时 5 秒
  maxUses: 7500,              // 单个连接最大复用次数后自动回收（防内存泄漏）
  allowExitOnIdle: true,     // 允许空闲时退出进程
};

export const pool = databaseUrl 
  ? new Pool({ connectionString: databaseUrl, ...poolConfig })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'bbkk',
      user: process.env.DB_USER || 'bbkk',
      password: process.env.DB_PASSWORD || 'bbkk',
      ...poolConfig,
    });

// 监听连接池错误
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * 方便执行 SQL 查询的助手函数
 */
export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}
