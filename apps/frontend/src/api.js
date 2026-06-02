import axios from 'axios'
import { useAppStore } from './store'
import { API_BASE_URL } from './config'

export const api = axios.create({
  baseURL: API_BASE_URL
})

const isJwtExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''))
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

const getToken = () => {
  const direct = localStorage.getItem('accessToken')
  if (direct) return isJwtExpired(direct) ? null : direct
  try {
    const store = JSON.parse(localStorage.getItem('app-store') || '{}')
    const token = store?.state?.accessToken || null
    return token && !isJwtExpired(token) ? token : null
  } catch {
    return null
  }
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else if (localStorage.getItem('accessToken')) {
    useAppStore.getState().logout()
  }
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
