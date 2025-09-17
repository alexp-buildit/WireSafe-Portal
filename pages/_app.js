import '../styles/globals.css'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
        if (!['/login', '/register'].includes(router.pathname)) {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
      if (!['/login', '/register'].includes(router.pathname)) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const login = (userData) => {
    setUser(userData)
    router.push('/dashboard')
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Component
      {...pageProps}
      user={user}
      login={login}
      logout={logout}
      checkAuth={checkAuth}
    />
  )
}

export default MyApp