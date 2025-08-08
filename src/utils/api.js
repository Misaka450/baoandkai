// API配置
const isDev = import.meta.env.DEV;
const API_BASE = '/api';

// 开发环境mock数据
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
          if (options.method === 'POST') {
            const body = JSON.parse(options.body);
            const newAlbum = {
              id: nextId.albums++,
              name: body.name,
              description: body.description,
              created_at: new Date().toISOString(),
              photos: body.photos || []
            };
            mockData.albums.push(newAlbum);
            return newAlbum;
          } else if (options.method === 'GET') {
            return mockData.albums;
          }
          return mockData.albums;
          
        case '/api/diaries':
          if (options.method === 'POST') {
            const body = JSON.parse(options.body);
            const newDiary = {
              id: nextId.diaries++,
              title: body.title,
              content: body.content,
              date: body.date,
              mood: body.mood,
              weather: body.weather,
              images: body.images || [],
              created_at: new Date().toISOString()
            };
            mockData.diaries.push(newDiary);
            return newDiary;
          } else if (options.method === 'GET') {
            return mockData.diaries;
          }
          return mockData.diaries;
          
        case '/api/timeline':
          if (options.method === 'POST') {
            const body = JSON.parse(options.body);
            const newTimeline = {
              id: nextId.timeline++,
              title: body.title,
              date: body.date,
              description: body.description,
              type: body.type || 'milestone',
              created_at: new Date().toISOString()
            };
            mockData.timeline.push(newTimeline);
            return newTimeline;
          } else if (options.method === 'GET') {
            return mockData.timeline;
          }
          return mockData.timeline;
          
        case '/api/food':
          if (options.method === 'POST') {
            const body = JSON.parse(options.body);
            const newFood = {
              id: nextId.food++,
              restaurant_name: body.restaurant_name,
              food_name: body.food_name,
              rating: body.rating,
              location: body.location,
              description: body.description,
              images: body.images || [],
              created_at: new Date().toISOString()
            };
            mockData.food.push(newFood);
            return newFood;
          } else if (options.method === 'GET') {
            return mockData.food;
          }
          return mockData.food;
          
        default:
          // 处理PUT请求
          if (endpoint.startsWith('/api/albums/') && options.method === 'PUT') {
            const id = parseInt(endpoint.split('/').pop());
            const body = JSON.parse(options.body);
            const index = mockData.albums.findIndex(item => item.id === id);
            if (index !== -1) {
              mockData.albums[index] = {
                ...mockData.albums[index],
                ...body,
                id: id
              };
              return mockData.albums[index];
            }
            throw new Error('相册不存在');
          }
          if (endpoint.startsWith('/api/diaries/') && options.method === 'PUT') {
            const id = parseInt(endpoint.split('/').pop());
            const body = JSON.parse(options.body);
            const index = mockData.diaries.findIndex(item => item.id === id);
            if (index !== -1) {
              mockData.diaries[index] = {
                ...mockData.diaries[index],
                ...body,
                id: id
              };
              return mockData.diaries[index];
            }
            throw new Error('日记不存在');
          }
          if (endpoint.startsWith('/api/timeline/') && options.method === 'PUT') {
            const id = parseInt(endpoint.split('/').pop());
            const body = JSON.parse(options.body);
            const index = mockData.timeline.findIndex(item => item.id === id);
            if (index !== -1) {
              mockData.timeline[index] = {
                ...mockData.timeline[index],
                ...body,
                id: id
              };
              return mockData.timeline[index];
            }
            throw new Error('时间轴记录不存在');
          }
          if (endpoint.startsWith('/api/food/') && options.method === 'PUT') {
            const id = parseInt(endpoint.split('/').pop());
            const body = JSON.parse(options.body);
            const index = mockData.food.findIndex(item => item.id === id);
            if (index !== -1) {
              mockData.food[index] = {
                ...mockData.food[index],
                ...body,
                id: id
              };
              return mockData.food[index];
            }
            throw new Error('美食打卡不存在');
          }
          
          // 处理DELETE请求
          if (endpoint.startsWith('/api/albums/') && options.method === 'DELETE') {
            const id = parseInt(endpoint.split('/').pop());
            mockData.albums = mockData.albums.filter(item => item.id !== id);
            return { success: true };
          }
          if (endpoint.startsWith('/api/diaries/') && options.method === 'DELETE') {
            const id = parseInt(endpoint.split('/').pop());
            mockData.diaries = mockData.diaries.filter(item => item.id !== id);
            return { success: true };
          }
          if (endpoint.startsWith('/api/timeline/') && options.method === 'DELETE') {
            const id = parseInt(endpoint.split('/').pop());
            mockData.timeline = mockData.timeline.filter(item => item.id !== id);
            return { success: true };
          }
          if (endpoint.startsWith('/api/food/') && options.method === 'DELETE') {
            const id = parseInt(endpoint.split('/').pop());
            mockData.food = mockData.food.filter(item => item.id !== id);
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