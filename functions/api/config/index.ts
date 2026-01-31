import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
  DB: D1Database;
  ENVIRONMENT?: string;
  VERSION?: string;
}

// 获取系统配置信息
export async function onRequestGet(context: { env: Env }) {
  const { env } = context;

  try {
    // 这里可以返回一些公开的非敏感配置
    return jsonResponse({
      environment: env.ENVIRONMENT || 'production',
      version: env.VERSION || '1.0.0',
      features: {
        albums: true,
        todos: true,
        timeline: true,
        notes: true
      }
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}