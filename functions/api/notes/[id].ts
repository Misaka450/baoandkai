import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
    DB: D1Database;
}

interface Note {
    id: number;
    content: string;
    color?: string;
    user_id: number;
}

/**
 * 获取单个碎碎念详情
 */
export async function onRequestGet(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').filter(Boolean).pop();
        const noteId = parseInt(id || '');

        if (isNaN(noteId)) {
            return errorResponse('无效的ID', 400);
        }

        const note = await env.DB.prepare(`SELECT * FROM notes WHERE id = ?`).bind(noteId).first<Note>();

        if (!note) {
            return errorResponse('笔记不存在', 404);
        }

        return jsonResponse(note);
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

/**
 * 更新碎碎念
 */
export async function onRequestPut(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').filter(Boolean).pop();
        const noteId = parseInt(id || '');

        if (isNaN(noteId)) {
            return errorResponse('无效的ID', 400);
        }

        const body: any = await request.json();
        const { content, color } = body;

        const currentNote = await env.DB.prepare(`SELECT * FROM notes WHERE id = ?`).bind(noteId).first<Note>();
        if (!currentNote) {
            return errorResponse('笔记不存在', 404);
        }

        await env.DB.prepare(`
      UPDATE notes SET 
        content = ?, 
        color = ?, 
        updated_at = datetime('now') 
      WHERE id = ?
    `).bind(
            content !== undefined ? content : currentNote.content,
            color !== undefined ? color : currentNote.color,
            noteId
        ).run();

        const updatedNote = await env.DB.prepare(`SELECT * FROM notes WHERE id = ?`).bind(noteId).first<Note>();

        return jsonResponse(updatedNote);
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

/**
 * 删除碎碎念
 */
export async function onRequestDelete(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').filter(Boolean).pop();
        const noteId = parseInt(id || '');

        if (isNaN(noteId)) {
            return errorResponse('无效的ID', 400);
        }

        await env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(noteId).run();

        return jsonResponse({ success: true, message: '笔记已删除' });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}
