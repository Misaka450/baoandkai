import { API_BASE } from '../config/api'

/**
 * 统一的API服务
 * 提供统一的错误处理和请求封装
 */

class ApiService {
  constructor() {
    this.baseURL = API_BASE
  }

  /**
   * 通用请求方法
   * @param {string} endpoint - API端点
   * @param {Object} options - 请求选项
   * @returns {Promise} 响应数据
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`

    // 获取Token
    const token = localStorage.getItem('token');

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 只有需要认证的API才会重定向
        // 公开API（如/config、/notes等）不需要重定向
        const publicEndpoints = ['/config', '/notes', '/todos', '/albums', '/timeline', '/food'];
        const isPublicEndpoint = publicEndpoints.some(publicEndpoint => 
          endpoint.startsWith(publicEndpoint) && endpoint.split('/').length <= publicEndpoint.split('/').length + 1
        );
        
        if (!isPublicEndpoint && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return { data: null, error: 'Unauthorized' };
      }

      if (!response.ok) {
        // 对于非200响应，尝试获取错误信息，但不强制要求JSON格式
        let errorData = null;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          }
        } catch (e) {
          // 忽略JSON解析错误
        }
        const errorMessage = errorData?.error || errorData?.message || `HTTP error! status: ${response.status}`;
        return { data: null, error: errorMessage };
      }

      // 检查响应是否为JSON格式
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return { data: null, error: 'Response is not JSON format' };
      }

      // 尝试解析JSON，添加错误处理
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(`JSON解析失败: ${endpoint}`, jsonError);
        return { data: null, error: 'Failed to parse JSON response' };
      }

      return { data, error: null }
    } catch (error) {
      console.error(`API请求失败: ${endpoint}`, error)
      return { data: null, error: error.message }
    }
  }

  /**
   * GET请求
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' })
  }

  /**
   * POST请求
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * PUT请求
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * DELETE请求
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  /**
   * 上传文件
   */
  async upload(endpoint, formData) {
    const url = `${this.baseURL}${endpoint}`
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      })

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 上传API通常需要认证，所以直接重定向
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return { data: null, error: 'Unauthorized' };
      }

      if (!response.ok) {
        throw new Error(`Upload failed! status: ${response.status}`)
      }

      const data = await response.json()
      return { data, error: null }
    } catch (error) {
      console.error(`文件上传失败: ${endpoint}`, error)
      return { data: null, error: error.message }
    }
  }
}

// 创建单例实例
export const apiService = new ApiService()

// 专用API服务
export const notesService = {
  async getAll() {
    return apiService.get('/notes')
  },

  async create(note) {
    return apiService.post('/notes', note)
  },

  async update(id, note) {
    return apiService.put(`/notes/${id}`, note)
  },

  async delete(id) {
    return apiService.delete(`/notes/${id}`)
  }
}

export const todosService = {
  async getAll() {
    return apiService.get('/todos')
  },

  async create(todo) {
    return apiService.post('/todos', todo)
  },

  async update(id, todo) {
    return apiService.put(`/todos/${id}`, todo)
  },

  async delete(id) {
    return apiService.delete(`/todos/${id}`)
  }
}

export const albumsService = {
  async getAll() {
    return apiService.get('/albums')
  },

  async create(album) {
    return apiService.post('/albums', album)
  }
}