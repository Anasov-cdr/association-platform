import { api } from './api'
import { getApiOrigin } from './config'

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
  return `${getApiOrigin()}${url}`
}
