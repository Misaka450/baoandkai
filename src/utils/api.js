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
    enable_diary: false,
    enable_food: true
  },
  albums: [],
  // diaries: [],
  timeline: [],
  food: []
};

// 生成唯一ID
let nextId = {
  albums: 1,
  // diaries: 1,
  timeline: 1,
  food: 1
};

// 开发环境完全使用代理，不启用mock
// API请求工具函数（支持分页和认证）
export async function apiRequest(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    }
  };

  // 如果是需要认证的请求，添加token
  if (endpoint.includes('/admin') || options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE') {
    const token = localStorage.getItem('token'); // 修正token key与AuthContext一致
    if (token) {
      defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(endpoint, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      throw error;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}

// 分页API工具函数
export async function apiRequestPaginated(endpoint, page = 1, limit = 10) {
  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set('page', page.toString());
  url.searchParams.set('limit', limit.toString());
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const error = new Error(`HTTP error! status: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return data;
}