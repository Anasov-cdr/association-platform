import axios from 'axios'
import { useAppStore } from './store'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
})

const getToken = () => {
  const direct = localStorage.getItem('accessToken')
  if (direct) return direct
  try {
    const store = JSON.parse(localStorage.getItem('app-store') || '{}')
    return store?.state?.accessToken || null
  } catch {
    return null
  }
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      useAppStore.getState().logout()
    }
    return Promise.reject(error)
  }
)
