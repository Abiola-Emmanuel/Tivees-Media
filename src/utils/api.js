import axios from 'axios'

const API_BASE_URL = 'https://tivess-be-89v3.onrender.com'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

// Add request interceptor to include token in headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear localStorage and redirect to sign-in
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      window.location.href = '/sign-in'
    }
    return Promise.reject(error)
  }
)

export default apiClient
