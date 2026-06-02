import axios from 'axios'
import { useAppStore } from './store'
import { API_BASE_URL } from './config'

export const api = axios.create({
  baseURL: API_BASE_URL
})

let refreshPromise = null

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
  if (direct) return direct
  try {
    const store = JSON.parse(localStorage.getItem('app-store') || '{}')
    const token = store?.state?.accessToken || null
    return token || null
  } catch {
    return null
  }
}

const getRefreshToken = () => {
  const direct = localStorage.getItem('refreshToken')
  if (direct) return direct
  try {
    const store = JSON.parse(localStorage.getItem('app-store') || '{}')
    return store?.state?.refreshToken || null
  } catch {
    return null
  }
}

const isAuthEndpoint = (url = '') =>
  url.includes('/auth/login') ||
  url.includes('/auth/register') ||
  url.includes('/auth/refresh') ||
  url.includes('/auth/forgot-password') ||
  url.includes('/auth/reset-password')

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken()
  if (!refreshToken || isJwtExpired(refreshToken)) {
    throw new Error('Refresh token is missing or expired')
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
      .then(({ data }) => {
        useAppStore.getState().setAuth({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken
        })
        return data.accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else if (localStorage.getItem('accessToken') || localStorage.getItem('refreshToken')) {
    useAppStore.getState().logout()
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {}

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url || '')
    ) {
      originalRequest._retry = true
      try {
        const accessToken = await refreshAccessToken()
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch {
        useAppStore.getState().logout()
      }
    } else if (error.response?.status === 401 && getToken() && !isAuthEndpoint(originalRequest.url || '')) {
      useAppStore.getState().logout()
    }

    return Promise.reject(error)
  }
)
