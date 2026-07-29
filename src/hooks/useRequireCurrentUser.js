import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL

const getCurrentUserFromResponse = (data) => {
  return data?.user || data?.data?.user || data?.data || data?.currentUser || null
}

const isExpiredTokenError = (error) => {
  const message = error?.response?.data?.message || error?.message || ''
  return error?.response?.status === 401 || message.toLowerCase().includes('expired token') || message.toLowerCase().includes('invalid or expired token')
}

const clearCustomerAuth = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
}

export function useRequireCurrentUser() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    let isMounted = true

    const validateCurrentUser = async () => {
      const authToken = localStorage.getItem('authToken')
      const userString = localStorage.getItem('user')

      if (!authToken || !userString) {
        clearCustomerAuth()
        if (isMounted) {
          setIsAuthenticated(false)
          setCurrentUser(null)
        }
        router.replace('/sign-in')
        return
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/users/current-user`, {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        })

        const user = getCurrentUserFromResponse(response.data)

        if (user) {
          localStorage.setItem('user', JSON.stringify(user))
        }

        if (isMounted) {
          setCurrentUser(user)
          setIsAuthenticated(true)
        }
      } catch (error) {
        if (isExpiredTokenError(error)) {
          clearCustomerAuth()
          if (isMounted) {
            setCurrentUser(null)
            setIsAuthenticated(false)
          }
          router.replace('/sign-in')
          return
        }

        console.error('Unable to validate current user:', error.response?.data || error.message)
        if (isMounted) {
          setIsAuthenticated(true)
        }
      }
    }

    validateCurrentUser()

    return () => {
      isMounted = false
    }
  }, [router])

  return {
    isAuthenticated,
    currentUser,
    setCurrentUser
  }
}