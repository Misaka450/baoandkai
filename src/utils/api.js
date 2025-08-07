// API配置
const isDev = import.meta.env.DEV;
const API_BASE = '/api';

// 开发环境mock数据
const mockData = {
  settings: {
    site_name: '宝宝和凯凯的故事',
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

// 开发环境API调用包装器
export async function apiRequest(endpoint, options = {}) {
  try {
    if (isDev) {
      // 开发环境使用mock数据
      await new Promise(resolve => setTimeout(resolve, 500)); // 模拟网络延迟
      
      switch (endpoint) {
        case '/api/settings':
          if (options.method === 'PUT') {
            const body = JSON.parse(options.body);
            mockData.settings = { ...mockData.settings, ...body };
            return mockData.settings;
          }
          return mockData.settings;
          
        case '/api/albums':
          return mockData.albums;
          
        case '/api/diaries':
          return mockData.diaries;
          
        case '/api/timeline':
          return mockData.timeline;
          
        case '/api/food':
          return mockData.food;
          
        default:
          if (endpoint.startsWith('/api/albums/') && options.method === 'DELETE') {
            const id = endpoint.split('/').pop();
            mockData.albums = mockData.albums.filter(item => item.id !== parseInt(id));
            return { success: true };
          }
          if (endpoint.startsWith('/api/diaries/') && options.method === 'DELETE') {
            const id = endpoint.split('/').pop();
            mockData.diaries = mockData.diaries.filter(item => item.id !== parseInt(id));
            return { success: true };
          }
          if (endpoint.startsWith('/api/timeline/') && options.method === 'DELETE') {
            const id = endpoint.split('/').pop();
            mockData.timeline = mockData.timeline.filter(item => item.id !== parseInt(id));
            return { success: true };
          }
          if (endpoint.startsWith('/api/food/') && options.method === 'DELETE') {
            const id = endpoint.split('/').pop();
            mockData.food = mockData.food.filter(item => item.id !== parseInt(id));
            return { success: true };
          }
          return [];
      }
    } else {
      // 生产环境使用真实API
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
    }
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}