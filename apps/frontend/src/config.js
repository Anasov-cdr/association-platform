export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:4000/api'

export const getSocketUrl = () => {
  try {
    const url = new URL(API_BASE_URL)
    if (url.pathname.endsWith('/api')) {
      url.pathname = url.pathname.slice(0, -4) || '/'
    }
    url.search = ''
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return API_BASE_URL.replace(/\/api\/?$/, '')
  }
}
