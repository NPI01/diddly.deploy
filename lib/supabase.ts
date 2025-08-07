import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  subscription_status: 'free' | 'pro' | 'premium'
  created_at: string
  updated_at: string
}

export interface Article {
  id: string
  user_id: string
  title: string
  content: string
  status: 'draft' | 'published' | 'archived'
  word_count: number
  created_at: string
  updated_at: string
  published_at?: string
  tags: string[]
  metadata: Record<string, any>
}

export interface AgentInteraction {
  id: string
  article_id: string
  agent_type: 'editor' | 'writer' | 'researcher' | 'growth'
  level?: number
  input_content: string
  output_content: string
  prompt_used?: string
  user_rating?: number
  user_feedback?: string
  created_at: string
}

export interface ArticleMetrics {
  id: string
  user_id: string
  article_id: string
  platform: string
  published_url?: string
  open_rate?: number
  click_rate?: number
  comments_count: number
  likes_count: number
  shares_count: number
  read_time_avg?: number
  created_at: string
  updated_at: string
}

export interface PublishingHistory {
  id: string
  article_id: string
  platform: string
  published_url?: string
  status: 'pending' | 'success' | 'failed'
  error_message?: string
  published_at: string
}

export interface PromptTemplate {
  id: string
  user_id: string
  agent_type: string
  name: string
  template: string
  is_default: boolean
  created_at: string
  updated_at: string
}