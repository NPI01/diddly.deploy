import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

export interface AuthUser extends User {
  profile?: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
    subscription_status: string
  }
}

export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  })

  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // For client-side components, getSession is appropriate and faster
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session?.user) {
      return null
    }

    const user = session.user

    // Try to get user profile, but don't fail if it doesn't exist
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 means "no rows found" which is ok
        console.error('Profile fetch error:', profileError)
      }

      return {
        id: user.id,
        email: user.email!,
        full_name: profile?.full_name || '',
        subscription_status: profile?.subscription_status || 'free'
      }
    } catch (profileError) {
      // Profile fetch failed, return user without profile
      return {
        id: user.id,
        email: user.email!,
        full_name: '',
        subscription_status: 'free'
      }
    }
  } catch (error) {
    console.error('getCurrentUser error:', error)
    return null
  }
}

export async function updateProfile(updates: {
  full_name?: string
  avatar_url?: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Auth state listener
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    try {
      if (session?.user) {
        const authUser = await getCurrentUser()
        callback(authUser)
      } else {
        callback(null)
      }
    } catch (error) {
      console.error('Auth state change error:', error)
      callback(null)
    }
  })
}