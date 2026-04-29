import { api } from './api'

export const uploadFile = async (file, folder = 'misc') => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post(`/uploads/${folder}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export const toAbsoluteUploadUrl = (url) => {
  if (!url || url === '#') return url
  if (/^https?:\/\//.test(url)) return url
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
  return `${apiBase.replace('/api', '')}${url}`
}
