import { jsonResponse, errorResponse } from '../../utils/response';
import { transformImageUrl } from '../../utils/url';
import { hasXSS, sanitizeObject } from '../../utils/validation';

export interface Env {
    DB: D1Database;
}

interface SiteConfig {
    coupleName1?: string;
    coupleName2?: string;
    anniversaryDate?: string;
    homeTitle?: string;
    homeSubtitle?: string;
    avatar1?: string;
    avatar2?: string;
    customAvatar1?: string;
    customAvatar2?: string;
}

const ALLOWED_CONFIG_FIELDS = [
    'coupleName1', 'coupleName2', 'anniversaryDate',
    'homeTitle', 'homeSubtitle', 'avatar1', 'avatar2',
    'customAvatar1', 'customAvatar2'
];

const TEXT_FIELDS = ['coupleName1', 'coupleName2', 'homeTitle', 'homeSubtitle'];

/**
 * 获取系统配置
 */
export async function onRequestGet(context: { env: Env }) {
    const { env } = context;

    try {
        // 1. 优先从 settings 表获取完整配置
        const configRow = await env.DB.prepare('SELECT value FROM settings WHERE key = ?')
            .bind('site_config')
            .first<{ value: string }>();

        if (configRow) {
            try {
                const config = JSON.parse(configRow.value);
                return jsonResponse({
                    ...config,
                    avatar1: transformImageUrl(config.avatar1),
                    avatar2: transformImageUrl(config.avatar2),
                    customAvatar1: transformImageUrl(config.customAvatar1),
                    customAvatar2: transformImageUrl(config.customAvatar2)
                });
            } catch (e) {
                console.error('解析 settings 失败:', e);
            }
        }

        // 2. 备选方案：从 users 表获取核心信息
        const user = await env.DB.prepare(`
            SELECT couple_name1, couple_name2, anniversary_date,
                   home_title, home_subtitle, avatar1, avatar2
            FROM users WHERE id = 1
        `).first<{
            couple_name1: string; couple_name2: string; anniversary_date: string;
            home_title: string; home_subtitle: string; avatar1: string; avatar2: string;
        }>();

        const avatar1 = transformImageUrl(user?.avatar1);
        const avatar2 = transformImageUrl(user?.avatar2);

        return jsonResponse({
            coupleName1: user?.couple_name1 || '包包',
            coupleName2: user?.couple_name2 || '恺恺',
            anniversaryDate: user?.anniversary_date || '2023-10-08',
            homeTitle: user?.home_title || '包包和恺恺的小窝',
            homeSubtitle: user?.home_subtitle || '遇见你，是银河赠予我的糖。',
            avatar1,
            avatar2,
            customAvatar1: avatar1 && !avatar1.startsWith('http') && avatar1.startsWith('/api/images/') ? avatar1 : '',
            customAvatar2: avatar2 && !avatar2.startsWith('http') && avatar2.startsWith('/api/images/') ? avatar2 : ''
        });
    } catch (error: unknown) {
        console.error('获取配置失败:', error);
        return errorResponse('获取配置失败', 500);
    }
}

/**
 * 更新系统配置
 */
export async function onRequestPut(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        const rawConfig = await request.json() as Record<string, unknown>;

        // 字段白名单过滤，只保留允许的字段
        const config: Record<string, unknown> = {};
        for (const field of ALLOWED_CONFIG_FIELDS) {
            if (field in rawConfig) {
                config[field] = rawConfig[field];
            }
        }

        // XSS检测文本字段
        for (const field of TEXT_FIELDS) {
            const value = config[field];
            if (typeof value === 'string' && hasXSS(value)) {
                return errorResponse(`字段 ${field} 包含不安全字符`, 400);
            }
        }

        // 消毒文本字段
        const sanitized = sanitizeObject(config, ['avatar1', 'avatar2', 'customAvatar1', 'customAvatar2']);

        // 1. 更新 settings 表（持久化所有配置）
        await env.DB.prepare(`
            INSERT OR REPLACE INTO settings (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
        `).bind('site_config', JSON.stringify(sanitized)).run();

        // 2. 同步更新 users 表中的核心字段
        await env.DB.prepare(`
            UPDATE users SET 
                couple_name1 = ?, 
                couple_name2 = ?, 
                anniversary_date = ?,
                home_title = ?,
                home_subtitle = ?,
                avatar1 = ?,
                avatar2 = ?,
                updated_at = datetime('now')
            WHERE id = 1
        `).bind(
            sanitized.coupleName1,
            sanitized.coupleName2,
            sanitized.anniversaryDate,
            sanitized.homeTitle,
            sanitized.homeSubtitle,
            sanitized.avatar1,
            sanitized.avatar2
        ).run();

        return jsonResponse({ success: true, message: '配置已更新' });
    } catch (error: unknown) {
        console.error('更新配置失败:', error);
        return errorResponse('更新配置失败', 500);
    }
}
