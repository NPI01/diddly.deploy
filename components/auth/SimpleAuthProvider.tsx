'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Use the SSR-compatible client
const supabase = createClient()

export interface AuthUser {
  id: string
  email: string
  full_name: string
  subscription_status: 'free' | 'pro' | 'premium'
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    // Add a fallback timeout to prevent hanging
    const fallbackTimeout = setTimeout(() => {
      console.log('SimpleAuthProvider: Fallback timeout - setting loading to false')
      setLoading(false)
    }, 2000) // 2 second max wait

    // Check initial session with proper refresh handling
    const checkAuth = async () => {
      try {
        console.log('SimpleAuthProvider: Checking initial session...')
        
        // First try getUser() which validates the token and refreshes if needed
        let { data: { user }, error: userError } = await supabase.auth.getUser()
        
        console.log('SimpleAuthProvider: getUser result:', { user: !!user, error: userError })
        
        if (userError) {
          console.error('Auth user error:', userError)
          // If getUser fails, try getSession as fallback
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError || !session?.user) {
            console.log('SimpleAuthProvider: No valid session, user not authenticated')
            if (isMounted) {
              setUser(null)
              setLoading(false)
              clearTimeout(fallbackTimeout)
            }
            return
          }
          
          // Use session user if getUser failed but session exists
          user = session.user
        }

        if (user) {
          console.log('SimpleAuthProvider: Valid user found, setting auth state')
          // Try to get user profile
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()

            if (isMounted) {
              setUser({
                id: user.id,
                email: user.email!,
                full_name: profile?.full_name || '',
                subscription_status: profile?.subscription_status || 'free'
              })
              setLoading(false)
              clearTimeout(fallbackTimeout)
            }
          } catch (profileError) {
            console.error('Profile fetch error:', profileError)
            // Still set user even without profile
            if (isMounted) {
              setUser({
                id: user.id,
                email: user.email!,
                full_name: '',
                subscription_status: 'free'
              })
              setLoading(false)
              clearTimeout(fallbackTimeout)
            }
          }
        } else {
          console.log('SimpleAuthProvider: No user found')
          if (isMounted) {
            setUser(null)
            setLoading(false)
            clearTimeout(fallbackTimeout)
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
        if (isMounted) {
          setLoading(false)
          clearTimeout(fallbackTimeout)
        }
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, !!session, 'isMounted:', isMounted)
      
      if (session?.user) {
        console.log('SimpleAuthProvider: Processing user session, isMounted:', isMounted)
        
        // Set user immediately without waiting for profile
        console.log('SimpleAuthProvider: Setting user and clearing loading state (immediate)')
        setUser({
          id: session.user.id,
          email: session.user.email!,
          full_name: '',
          subscription_status: 'free'
        })
        setLoading(false) // Set loading to false immediately
        clearTimeout(fallbackTimeout)

        // Then fetch profile in background and update if successful
        setTimeout(async () => {
          try {
            console.log('SimpleAuthProvider: Fetching profile in background...')
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            console.log('SimpleAuthProvider: Profile fetch result:', { profile: !!profile, error: profileError })

            if (profile && !profileError) {
              console.log('SimpleAuthProvider: Updating user with profile data')
              setUser({
                id: session.user.id,
                email: session.user.email!,
                full_name: profile.full_name || '',
                subscription_status: profile.subscription_status || 'free'
              })
            }
          } catch (profileError) {
            console.error('Profile fetch error (catch):', profileError)
          }
        }, 0)
      } else {
        setUser(null)
        setLoading(false) // Set loading to false when no user
        clearTimeout(fallbackTimeout)
      }
    })

    return () => {
      isMounted = false
      clearTimeout(fallbackTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      window.location.href = '/login'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SimpleAuthProvider')
  }
  return context
}