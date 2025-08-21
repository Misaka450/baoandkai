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
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
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
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      })

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