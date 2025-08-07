'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export default function TestLoginPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const testLogin = async () => {
    setLoading(true)
    setMessage('Attempting login...')

    try {
      console.log('Starting login test...')
      console.log('Supabase client:', supabase)
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      
      setMessage('Calling signInWithPassword...')
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Login request timed out after 10 seconds')), 10000)
      })
      
      const loginPromise = supabase.auth.signInWithPassword({
        email: 'nisaac01@gmail.com',
        password: '2025diddly!'
      })
      
      console.log('Waiting for auth response...')
      const { data, error } = await Promise.race([loginPromise, timeoutPromise])
      
      console.log('Login result:', { data, error })
      setMessage(`Login result: ${error ? error.message : 'Success'}`)

      if (error) {
        setMessage(`Login error: ${error.message}`)
        return
      }

      if (data.user) {
        setMessage('Login successful! Redirecting...')
        setTimeout(() => {
          router.push('/')
        }, 1000)
      } else {
        setMessage('Login failed: No user returned')
      }
    } catch (error: any) {
      console.error('Login exception:', error)
      setMessage(`Exception: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      console.log('Current session:', { data, error })
      setMessage(`Session: ${data.session ? 'Active' : 'None'}`)
    } catch (error: any) {
      console.error('Session error:', error)
      setMessage(`Session error: ${error.message}`)
    }
  }

  const testDirectClient = async () => {
    setLoading(true)
    setMessage('Testing direct Supabase client...')

    try {
      // Create a direct client to bypass our wrapper
      const directClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      console.log('Direct client URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Direct client created:', directClient)
      
      setMessage('Calling direct client login...')
      
      const { data, error } = await directClient.auth.signInWithPassword({
        email: 'nisaac01@gmail.com',
        password: '2025diddly!'
      })

      console.log('Direct client result:', { data, error })
      
      if (error) {
        setMessage(`Direct client error: ${error.message}`)
      } else if (data.user) {
        setMessage('Direct client login successful! Redirecting...')
        // Force a page refresh to update the auth state
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      } else {
        setMessage('Direct client: No user returned')
      }
    } catch (error: any) {
      console.error('Direct client exception:', error)
      setMessage(`Direct client exception: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Auth Test</h1>
        
        <div className="space-y-4">
          <button
            onClick={testLogin}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Login (Custom Client)'}
          </button>

          <button
            onClick={testDirectClient}
            disabled={loading}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Direct Client'}
          </button>

          <button
            onClick={testSession}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
          >
            Check Session
          </button>

          <button
            onClick={() => router.push('/login')}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
          >
            Go to Main Login
          </button>
        </div>

        {message && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}