import type { NextApiRequest } from 'next'
import { supabase } from './supabase'

export async function getAuthenticatedUser(req: NextApiRequest) {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    throw new Error('No authorization header')
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    throw new Error('Invalid or expired token')
  }

  return user
}

export function createAuthHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}