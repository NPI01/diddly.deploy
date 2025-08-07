'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { AuthUser, getCurrentUser, onAuthStateChange } from '@/lib/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    // Set a fallback timeout to ensure loading never hangs indefinitely
    const fallbackTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('AuthProvider: Fallback timeout - setting loading to false')
        setLoading(false)
      }
    }, 1500) // 1.5 second max wait

    // Get initial user
    getCurrentUser()
      .then((user) => {
        if (isMounted) {
          setUser(user)
          setLoading(false)
          clearTimeout(fallbackTimeout)
        }
      })
      .catch((error) => {
        console.error('AuthProvider: getCurrentUser error:', error)
        if (isMounted) {
          setLoading(false)
          clearTimeout(fallbackTimeout)
        }
      })

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      if (isMounted) {
        setUser(user)
      }
    })

    return () => {
      isMounted = false
      clearTimeout(fallbackTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    const { signOut } = await import('@/lib/auth')
    await signOut()
    setUser(null)
  }

  const value = {
    user,
    loading,
    signOut: handleSignOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}