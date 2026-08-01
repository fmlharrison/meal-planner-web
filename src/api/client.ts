import axios from 'axios'
import { createApiClient } from '../types/api.zod'
import { clearToken, getToken } from '../lib/token'

const baseUrl = import.meta.env.VITE_API_URL ?? '/api'

const axiosInstance = axios.create({
  baseURL: baseUrl,
  headers: { Accept: 'application/json' },
})

axiosInstance.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearToken()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export const api = createApiClient(baseUrl, { axiosInstance })

export function apiErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { errors?: string[]; error?: string }
      | undefined
    if (data?.errors?.length) return data.errors.join(', ')
    if (data?.error) return data.error
    if (error.message) return error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}
