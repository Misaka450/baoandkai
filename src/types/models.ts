/**
 * 核心实体类型定义
 */

export interface User {
    id: number | string;
    username: string;
    email?: string;
    role?: string;
    token_expires?: string;
}

export interface Note {
    id?: number | string;
    content: string;
    color?: string;
    created_at?: string;
}

export interface Todo {
    id: number | string;
    title: string;
    description?: string;
    priority: number | string;
    status: 'pending' | 'completed' | string;
    due_date?: string;
    created_at: string;
    updated_at?: string;
    category?: string;
    images?: string[];
    completion_photos?: string[] | string;
    completion_notes?: string;
}

export interface TimelineEvent {
    id: number | string;
    title: string;
    description: string;
    date: string;
    category: string;
    location?: string;
    images?: string[];
}

export interface Photo {
    id: string;
    url: string;
    caption?: string;
    created_at?: string;
}

export interface Album {
    id: string;
    name: string;
    description?: string;
    photos?: Photo[];
    photo_count?: number;
    created_at?: string;
}
