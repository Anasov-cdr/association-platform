import axios from 'axios'
import { API_BASE_URL } from '../config'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add authorization token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refreshToken')

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
          localStorage.setItem('accessToken', response.data.accessToken)
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`
          return apiClient(originalRequest)
        } catch (refreshError) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (data) => apiClient.post('/auth/register', data),
  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken })
}

// Alumni API
export const alumniAPI = {
  getAll: (filters) => apiClient.get('/alumni', { params: filters }),
  getById: (id) => apiClient.get(`/alumni/${id}`),
  updateProfile: (data) => apiClient.put('/alumni/profile/me', data),
  getPendingProfiles: () => apiClient.get('/alumni/admin/pending'),
  approveProfile: (id) => apiClient.post(`/alumni/admin/${id}/approve`),
  rejectProfile: (id) => apiClient.post(`/alumni/admin/${id}/reject`)
}

// News API
export const newsAPI = {
  getAll: () => apiClient.get('/news'),
  getById: (id) => apiClient.get(`/news/${id}`),
  create: (data) => apiClient.post('/news', data),
  update: (id, data) => apiClient.put(`/news/${id}`, data),
  delete: (id) => apiClient.delete(`/news/${id}`)
}

// Events API
export const eventsAPI = {
  getAll: () => apiClient.get('/events'),
  getById: (id) => apiClient.get(`/events/${id}`),
  create: (data) => apiClient.post('/events', data),
  register: (eventId) => apiClient.post(`/events/${eventId}/register`),
  unregister: (eventId) => apiClient.delete(`/events/${eventId}/register`),
  update: (id, data) => apiClient.put(`/events/${id}`, data),
  delete: (id) => apiClient.delete(`/events/${id}`)
}

// Jobs API
export const jobsAPI = {
  getAll: (filters) => apiClient.get('/jobs', { params: filters }),
  getById: (id) => apiClient.get(`/jobs/${id}`),
  create: (data) => apiClient.post('/jobs', data),
  apply: (jobId, data) => apiClient.post(`/jobs/${jobId}/apply`, data),
  approve: (id) => apiClient.post(`/jobs/${id}/approve`),
  reject: (id) => apiClient.post(`/jobs/${id}/reject`)
}

// Donations API
export const donationsAPI = {
  getCampaigns: () => apiClient.get('/donations/campaigns'),
  getCampaignById: (id) => apiClient.get(`/donations/campaigns/${id}`),
  createCampaign: (data) => apiClient.post('/donations/campaigns', data),
  donate: (data) => apiClient.post('/donations/donate', data),
  updateCampaign: (id, data) => apiClient.put(`/donations/campaigns/${id}`, data)
}

export default apiClient
