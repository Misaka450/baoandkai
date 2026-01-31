import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
    DB: D1Database;
}

export async function onRequestGet(context: { env: Env }) {
    const { env } = context;

    try {
        const notes = await env.DB.prepare('SELECT * FROM notes LIMIT 5').all();
        const albums = await env.DB.prepare('SELECT * FROM albums LIMIT 5').all();
        const photos = await env.DB.prepare('SELECT * FROM photos LIMIT 5').all();
        const config = await env.DB.prepare('SELECT * FROM users WHERE id = 1').first();

        return jsonResponse({
            notes: notes.results,
            albums: albums.results,
            photos: photos.results,
            config
        });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}
