import { useEffect, useState } from 'react'

export const useApi = (apiCall) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await apiCall()
        setData(response.data)
        setError(null)
      } catch (err) {
        setError(err.response?.data?.error || 'Ошибка при загрузке данных')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}

export const useMutation = (apiCall) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = async (...args) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiCall(...args)
      return response.data
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка операции'
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { execute, loading, error }
}
