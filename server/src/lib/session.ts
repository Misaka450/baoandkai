/**
 * Session 管理模块
 * 
 * 使用 SHA-256 哈希存储 Token，避免 Token 明文存储在数据库中。
 * 支持多设备登录、单个 Session 吊销、自动过期清理。
 */

import crypto from 'crypto';
import { pool } from './db.js';

/** Session 的有效期（7 天） */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** CSRF 令牌的字节长度 */
const CSRF_BYTES = 16;

export interface SessionUser {
  id: number;
  username: string;
  email: string;
  sessionId: number;
  tokenExpires: string;
}

/**
 * 对 Token 进行 SHA-256 哈希
 * Token 本身（随机 UUID）作为密码学凭证，数据库中只存哈希值
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * 生成 CSRF 令牌（16 字节随机 hex 字符串）
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_BYTES).toString('hex');
}

/**
 * 创建一个新的 Session
 *
 * @param userId 用户 ID
 * @returns { token, csrfToken, expiresAt }  返回的 token 是原始值，需要交给客户端
 */
export async function createSession(userId: number): Promise<{
  token: string;
  csrfToken: string;
  expiresAt: Date;
}> {
  const token = crypto.randomUUID();
  const csrfToken = generateCsrfToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const tokenHash = hashToken(token);

  await pool.query(
    `INSERT INTO sessions (user_id, token_hash, csrf_token, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, tokenHash, csrfToken, expiresAt.toISOString()]
  );

  return { token, csrfToken, expiresAt };
}

/**
 * 根据 Token 查找 Session
 * 使用哈希值查询，Token 明文不会触及数据库
 */
export async function getSessionByToken(token: string): Promise<SessionUser | null> {
  const tokenHash = hashToken(token);

  const { rows } = await pool.query(
    `SELECT s.id AS session_id, s.expires_at, s.csrf_token,
            u.id, u.username, u.email
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    sessionId: row.session_id,
    tokenExpires: row.expires_at,
  };
}

/**
 * 删除指定 Session（单个设备登出）
 */
export async function deleteSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
}

/**
 * 删除用户的所有 Session（全部设备登出，如改密码时）
 */
export async function deleteUserSessions(userId: number): Promise<void> {
  await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
}

/**
 * 更新 Session 的最后活动时间
 */
export async function updateSessionActivity(sessionId: number): Promise<void> {
  await pool.query(
    'UPDATE sessions SET last_activity_at = NOW() WHERE id = $1',
    [sessionId]
  );
}

/**
 * 清理所有过期的 Session
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const { rowCount } = await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()');
  return rowCount || 0;
}

/**
 * 更新 Session 的 CSRF Token（每次登录后刷新）
 */
export async function refreshCsrfToken(sessionId: number): Promise<string> {
  const csrfToken = generateCsrfToken();
  await pool.query('UPDATE sessions SET csrf_token = $1 WHERE id = $2', [csrfToken, sessionId]);
  return csrfToken;
}