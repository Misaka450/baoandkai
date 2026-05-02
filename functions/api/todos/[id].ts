import { jsonResponse, errorResponse } from '../../utils/response';
import { serializeImages } from '../../utils/url';
import { validate, validateRequired, validateLength, hasXSS, sanitizeObject } from '../../utils/validation';

export interface Env {
    DB: D1Database;
}

interface Todo {
    id: number;
    title: string;
    description?: string;
    status: string;
    priority: number;
    category?: string;
    due_date?: string;
    completion_notes?: string;
    completion_photos?: string;
    images?: string;
    created_at: string;
    updated_at?: string;
}

/**
 * 获取单个待办事项详情
 */
export async function onRequestGet(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').filter(Boolean).pop();
        const todoId = parseInt(id || '');

        if (isNaN(todoId)) {
            return errorResponse('无效的ID', 400);
        }

        const todo = await env.DB.prepare(`SELECT * FROM todos WHERE id = ?`).bind(todoId).first<Todo>();

        if (!todo) {
            return errorResponse('任务不存在', 404);
        }

        return jsonResponse({
            ...todo,
            images: todo.images ? JSON.parse(todo.images) : [],
            completion_photos: todo.completion_photos ? JSON.parse(todo.completion_photos) : []
        });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

/**
 * 更新待办事项
 */
export async function onRequestPut(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').filter(Boolean).pop();
        const todoId = parseInt(id || '');

        if (isNaN(todoId)) {
            return errorResponse('无效的ID', 400);
        }

        const body: any = await request.json();
        const { title, description, status, priority, category, due_date, completion_notes, completion_photos, images } = body;

        const currentTodo = await env.DB.prepare(`SELECT * FROM todos WHERE id = ?`).bind(todoId).first<Todo>();
        if (!currentTodo) {
            return errorResponse('任务不存在', 404);
        }

        // 输入验证（仅验证用户实际传入的字段）
        const rules: (string | null)[] = []
        if (title !== undefined) {
            rules.push(validateRequired(title, '待办标题'))
            rules.push(validateLength(title, '待办标题', 1, 100))
        }
        const validationError = validate(rules)
        if (validationError) return errorResponse(validationError, 400)

        if ((title && hasXSS(title)) || (description && hasXSS(description))) {
            return errorResponse('输入内容包含不安全字符', 400)
        }

        const sanitized = sanitizeObject({ title, description, category, completion_notes }, ['images', 'completion_photos'])

        const result = await env.DB.prepare(`
      UPDATE todos SET 
        title = ?, 
        description = ?, 
        status = ?, 
        priority = ?, 
        category = ?, 
        due_date = ?, 
        completion_notes = ?, 
        completion_photos = ?, 
        images = ?, 
        updated_at = datetime('now') 
      WHERE id = ?
    `).bind(
            title !== undefined ? sanitized.title : currentTodo.title,
            description !== undefined ? sanitized.description : currentTodo.description,
            status !== undefined ? status : currentTodo.status,
            priority !== undefined ? priority : currentTodo.priority,
            category !== undefined ? sanitized.category : currentTodo.category,
            due_date !== undefined ? due_date : currentTodo.due_date,
            completion_notes !== undefined ? sanitized.completion_notes : currentTodo.completion_notes,
            completion_photos !== undefined ? serializeImages(completion_photos) : currentTodo.completion_photos,
            images !== undefined ? serializeImages(images) : currentTodo.images,
            todoId
        ).run();

        const updatedTodo = await env.DB.prepare(`SELECT * FROM todos WHERE id = ?`).bind(todoId).first<Todo>();

        return jsonResponse({
            ...updatedTodo,
            images: updatedTodo?.images ? JSON.parse(updatedTodo.images) : [],
            completion_photos: updatedTodo?.completion_photos ? JSON.parse(updatedTodo.completion_photos) : []
        });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

/**
 * 删除待办事项
 */
export async function onRequestDelete(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').filter(Boolean).pop();
        const todoId = parseInt(id || '');

        if (isNaN(todoId)) {
            return errorResponse('无效的ID', 400);
        }

        await env.DB.prepare('DELETE FROM todos WHERE id = ?').bind(todoId).run();

        return jsonResponse({ success: true, message: '任务已删除' });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}
