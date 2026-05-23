import pg from 'pg';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

export const pool = databaseUrl 
  ? new Pool({ connectionString: databaseUrl })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'bbkk',
      user: process.env.DB_USER || 'bbkk',
      password: process.env.DB_PASSWORD || 'bbkk',
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
