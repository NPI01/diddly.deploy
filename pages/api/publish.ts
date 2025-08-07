import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { publishToPlatform, type Platform, type UnifiedPublishOptions } from '@/lib/publishing'

interface PublishRequest {
  articleId: string
  platform: Platform
  title: string
  content: string
  subtitle?: string
  excerpt?: string
  tags?: string[]
  publishStatus?: 'published' | 'draft' | 'public' | 'unlisted'
  scheduledDate?: string
  featured?: boolean
  notifyFollowers?: boolean
  userId: string
}

interface PublishResponse {
  success: boolean
  url?: string
  id?: string
  error?: string
  platform: Platform
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublishResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      platform: 'substack' as Platform
    })
  }

  try {
    const {
      articleId,
      platform,
      title,
      content,
      subtitle,
      excerpt,
      tags = [],
      publishStatus = 'published',
      scheduledDate,
      featured = false,
      notifyFollowers = false,
      userId
    }: PublishRequest = req.body

    if (!articleId || !platform || !title || !content || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: articleId, platform, title, content, userId',
        platform
      })
    }

    // Get authentication token and create client with auth context
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        error: 'No authorization header',
        platform
      })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create a Supabase client with the user's access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    // Verify the user owns this article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, user_id, title, status')
      .eq('id', articleId)
      .eq('user_id', userId)
      .single()

    if (articleError || !article) {
      return res.status(403).json({ 
        success: false, 
        error: 'Article not found or access denied',
        platform
      })
    }

    // Create publishing history record
    const { data: publishingRecord, error: publishingError } = await supabase
      .from('publishing_history')
      .insert({
        article_id: articleId,
        platform,
        status: 'pending'
      })
      .select()
      .single()

    if (publishingError) {
      console.error('Failed to create publishing record:', publishingError)
    }

    // Prepare publishing options
    const publishOptions: UnifiedPublishOptions = {
      platform,
      title,
      content,
      subtitle,
      excerpt,
      tags,
      publishStatus,
      scheduledDate,
      featured,
      notifyFollowers
    }

    // Attempt to publish
    const result = await publishToPlatform(publishOptions)

    // Update publishing history
    if (publishingRecord) {
      await supabase
        .from('publishing_history')
        .update({
          status: result.success ? 'success' : 'failed',
          published_url: result.url,
          error_message: result.error
        })
        .eq('id', publishingRecord.id)
    }

    if (result.success) {
      // Update article status and published_at timestamp
      await supabase
        .from('articles')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', articleId)

      // Create or update article metrics record
      await supabase
        .from('article_metrics')
        .upsert({
          user_id: userId,
          article_id: articleId,
          platform,
          published_url: result.url,
          comments_count: 0,
          likes_count: 0,
          shares_count: 0
        })
    }

    return res.status(result.success ? 200 : 500).json(result)

  } catch (error: any) {
    console.error('Publishing error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      platform: req.body.platform || 'substack'
    })
  }
}