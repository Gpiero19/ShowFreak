import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface User {
  id: string
  email: string
  username: string
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ContentItem {
  id: number
  title: string
  name?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  release_date?: string
  first_air_date?: string
  media_type?: 'movie' | 'tv'
}

export interface LibraryItem {
  id: string
  externalId: string
  contentType: string
  status: 'watched' | 'favorite' | 'wishlist'
  personalRating?: number
  notes?: string
  watchedAt?: string
  createdAt: string
  contentCache?: ContentItem
}

export interface UserPreference {
  id: string
  externalId: string
  contentType: string
  dislikeReason?: string
  createdAt: string
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: async (email: string, password: string, username: string) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
      email,
      password,
      username,
    })
    return response.data
  },

  login: async (email: string, password: string) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    })
    return response.data
  },

  me: async () => {
    const response = await api.get<ApiResponse<User>>('/auth/me')
    return response.data
  },
}

export const contentApi = {
  search: async (query: string, type: string = 'movie', page: number = 1) => {
    const response = await api.get<ApiResponse<any>>('/content/search', {
      params: { q: query, type, page },
    })
    return response.data
  },

  getDetails: async (id: string, type: string = 'movie') => {
    const response = await api.get<ApiResponse<any>>(`/content/${id}`, {
      params: { type },
    })
    return response.data
  },

  getSimilar: async (id: string, type: string = 'movie') => {
    const response = await api.get<ApiResponse<any>>(`/content/${id}/similar`, {
      params: { type },
    })
    return response.data
  },
}

export const libraryApi = {
  getAll: async (params?: {
    status?: string
    type?: string
    q?: string
    sort?: string
    order?: string
    page?: number
    limit?: number
  }) => {
    const response = await api.get<ApiResponse<LibraryItem[]>>('/library', { params })
    return response.data
  },

  create: async (data: {
    externalId: string
    contentType: string
    status: string
    personalRating?: number
    notes?: string
  }) => {
    const response = await api.post<ApiResponse<LibraryItem>>('/library', data)
    return response.data
  },

  update: async (id: string, data: Partial<LibraryItem>) => {
    const response = await api.patch<ApiResponse<LibraryItem>>(`/library/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await api.delete(`/library/${id}`)
    return response.data
  },
}

export const preferencesApi = {
  getAll: async () => {
    const response = await api.get<ApiResponse<UserPreference[]>>('/preferences')
    return response.data
  },

  create: async (data: { externalId: string; contentType: string; dislikeReason?: string }) => {
    const response = await api.post<ApiResponse<UserPreference>>('/preferences', data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await api.delete(`/preferences/${id}`)
    return response.data
  },
}

export const recommendationsApi = {
  getAll: async (page: number = 1, limit: number = 20) => {
    const response = await api.get<ApiResponse<ContentItem[]>>('/recommendations', {
      params: { page, limit },
    })
    return response.data
  },

  getSimilar: async (id: string, type: string = 'movie') => {
    const response = await api.get<ApiResponse<ContentItem[]>>(`/recommendations/${id}/similar`, {
      params: { type },
    })
    return response.data
  },
}

export default api
