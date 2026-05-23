import { Hono } from 'hono';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { transformImageArray, serializeImages } from '../utils/url.js';
import { validate, validateRequired, validateLength, hasXSS, sanitizeObject } from '../utils/validation.js';
import { buildPaginatedResponse, parsePagination } from '../utils/pagination.js';
import { pool } from '../lib/db.js';

const todos = new Hono();

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

interface CreateTodoBody {
  title: string;
  description?: string;
  status?: string;
  priority?: number;
  category?: string;
  due_date?: string;
  completion_notes?: string;
  completion_photos?: string[];
  images?: string[];
}

/**
 * GET /api/todos
 * 获取待办事项列表（支持分页，并返回已完成数量）
 */
todos.get('/', async (c) => {
  try {
    const url = new URL(c.req.url);
    const pagination = parsePagination(url, 10);

    // 获取总记录数
    const { rows: countRows } = await pool.query('SELECT COUNT(*) as total FROM todos');
    const total = parseInt(countRows[0]?.total || '0', 10);

    // 获取已完成记录数
    const { rows: completedRows } = await pool.query("SELECT COUNT(*) as total FROM todos WHERE status = 'completed'");
    const completedCount = parseInt(completedRows[0]?.total || '0', 10);

    // 获取分页待办事项
    const { rows } = await pool.query(
      `SELECT * FROM todos 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [pagination.pageSize, pagination.offset]
    );

    const formattedTodos = (rows as Todo[]).map((todo) => ({
      ...todo,
      images: transformImageArray(todo.images),
      completion_photos: transformImageArray(todo.completion_photos),
    }));

    return jsonResponse({
      ...buildPaginatedResponse(formattedTodos, total, pagination),
      completedCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('获取待办列表失败:', message);
    return errorResponse(message, 500);
  }
});

/**
 * POST /api/todos
 * 新增待办事项
 */
todos.post('/', async (c) => {
  try {
    const body = (await c.req.json()) as CreateTodoBody;
    const {
      title,
      description,
      status,
      priority,
      category,
      due_date,
      completion_notes,
      completion_photos,
      images,
    } = body;

    const validationError = validate([
      validateRequired(title, '待办标题'),
      validateLength(title, '待办标题', 1, 100),
    ]);
    if (validationError) return errorResponse(validationError, 400);

    if (hasXSS(title) || (description && hasXSS(description))) {
      return errorResponse('输入内容包含不安全字符', 400);
    }

    const sanitized = sanitizeObject({ title, description, category, completion_notes }, [
      'images',
      'completion_photos',
    ]);

    // 插入并返回新生成的记录
    const { rows } = await pool.query(
      `INSERT INTO todos (
         title, description, status, priority, category, due_date, 
         completion_notes, completion_photos, images, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        sanitized.title,
        sanitized.description || '',
        status || 'pending',
        priority || 2,
        sanitized.category || 'general',
        due_date || null,
        sanitized.completion_notes || null,
        completion_photos ? serializeImages(completion_photos) : null,
        images ? serializeImages(images) : null,
      ]
    );

    const newTodo = rows[0] as Todo;
    if (!newTodo) {
      return errorResponse('创建失败', 500);
    }

    return jsonResponse({
      ...newTodo,
      images: transformImageArray(newTodo.images),
      completion_photos: transformImageArray(newTodo.completion_photos),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('创建待办失败:', message);
    return errorResponse(message, 500);
  }
});

/**
 * GET /api/todos/:id
 * 获取单个待办事项详情
 */
todos.get('/:id', async (c) => {
  try {
    const todoId = parseInt(c.req.param('id') || '');
    if (isNaN(todoId)) {
      return errorResponse('无效的ID', 400);
    }

    const { rows } = await pool.query('SELECT * FROM todos WHERE id = $1', [todoId]);
    const todo = rows[0] as Todo;

    if (!todo) {
      return errorResponse('任务不存在', 404);
    }

    return jsonResponse({
      ...todo,
      images: transformImageArray(todo.images),
      completion_photos: transformImageArray(todo.completion_photos),
    });
  } catch (error: any) {
    console.error('获取任务详情失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * PUT /api/todos/:id
 * 更新待办事项
 */
todos.put('/:id', async (c) => {
  try {
    const todoId = parseInt(c.req.param('id') || '');
    if (isNaN(todoId)) {
      return errorResponse('无效的ID', 400);
    }

    const body: any = await c.req.json();
    const {
      title,
      description,
      status,
      priority,
      category,
      due_date,
      completion_notes,
      completion_photos,
      images,
    } = body;

    // 检查待办是否存在
    const { rows: checkRows } = await pool.query('SELECT * FROM todos WHERE id = $1', [todoId]);
    const currentTodo = checkRows[0] as Todo;
    if (!currentTodo) {
      return errorResponse('任务不存在', 404);
    }

    // 验证规则（仅验证传入字段）
    const rules: (string | null)[] = [];
    if (title !== undefined) {
      rules.push(validateRequired(title, '待办标题'));
      rules.push(validateLength(title, '待办标题', 1, 100));
    }
    const validationError = validate(rules);
    if (validationError) return errorResponse(validationError, 400);

    if ((title && hasXSS(title)) || (description && hasXSS(description))) {
      return errorResponse('输入内容包含不安全字符', 400);
    }

    const sanitized = sanitizeObject({ title, description, category, completion_notes }, [
      'images',
      'completion_photos',
    ]);

    await pool.query(
      `UPDATE todos SET 
         title = $1, 
         description = $2, 
         status = $3, 
         priority = $4, 
         category = $5, 
         due_date = $6, 
         completion_notes = $7, 
         completion_photos = $8, 
         images = $9, 
         updated_at = NOW() 
       WHERE id = $10`,
      [
        title !== undefined ? sanitized.title : currentTodo.title,
        description !== undefined ? sanitized.description : currentTodo.description,
        status !== undefined ? status : currentTodo.status,
        priority !== undefined ? priority : currentTodo.priority,
        category !== undefined ? sanitized.category : currentTodo.category,
        due_date !== undefined ? due_date : currentTodo.due_date,
        completion_notes !== undefined ? sanitized.completion_notes : currentTodo.completion_notes,
        completion_photos !== undefined ? serializeImages(completion_photos) : currentTodo.completion_photos,
        images !== undefined ? serializeImages(images) : currentTodo.images,
        todoId,
      ]
    );

    const { rows: updatedRows } = await pool.query('SELECT * FROM todos WHERE id = $1', [todoId]);
    const updatedTodo = updatedRows[0] as Todo;

    return jsonResponse({
      ...updatedTodo,
      images: transformImageArray(updatedTodo.images),
      completion_photos: transformImageArray(updatedTodo.completion_photos),
    });
  } catch (error: any) {
    console.error('更新任务失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * DELETE /api/todos/:id
 * 删除待办事项
 */
todos.delete('/:id', async (c) => {
  try {
    const todoId = parseInt(c.req.param('id') || '');
    if (isNaN(todoId)) {
      return errorResponse('无效的ID', 400);
    }

    const { rowCount } = await pool.query('DELETE FROM todos WHERE id = $1', [todoId]);
    if (rowCount === 0) {
      return errorResponse('任务不存在', 404);
    }

    return jsonResponse({ success: true, message: '任务已删除' });
  } catch (error: any) {
    console.error('删除任务失败:', error);
    return errorResponse(error.message, 500);
  }
});

export default todos;
