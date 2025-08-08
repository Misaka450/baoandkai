// API配置
const isDev = import.meta.env.DEV;
const API_BASE = '/api';

// 开发环境使用代理到Cloudflare Workers
// 生产环境直接使用Cloudflare Pages Functions

// 开发环境mock数据（仅用于完全离线开发）
const mockData = {
  settings: {
    site_name: '包包和恺恺的故事',
    site_description: '记录我们的点点滴滴',
    theme: 'light',
    enable_comments: true,
    enable_share: true,
    enable_timeline: true,
    enable_albums: true,
    enable_diary: true,
    enable_food: true
  },
  albums: [],
  diaries: [],
  timeline: [],
  food: []
};

// 生成唯一ID
let nextId = {
  albums: 1,
  diaries: 1,
  timeline: 1,
  food: 1
};

// 开发环境完全使用代理，不启用mock
export async function apiRequest(endpoint, options = {}) {
  try {
    // 始终使用真实的API调用，开发环境通过vite代理转发到Cloudflare
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}