import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { buildPrompt } from '@/lib/agents/prompts'
import { callLLM } from '@/lib/llm/client'

interface DevelopRequest {
  articleId: string
  content: string
  focus?: string
}

interface DevelopResponse {
  success: boolean
  developedContent?: string
  interactionId?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DevelopResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { articleId, content, focus = 'general development' }: DevelopRequest = req.body

    if (!articleId || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: articleId, content' 
      })
    }

    // Get authenticated user and create client with auth context
    const authHeader = req.headers.authorization
    console.log('Develop API: Authorization header:', !!authHeader)
    
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'No authorization header' })
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('Develop API: Token extracted:', !!token)
    
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
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    console.log('Develop API: Auth result:', { user: !!user, authError })
    
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' })
    }

    const userId = user.id

    // Verify the user owns this article
    console.log('Debug: Checking article ownership for:', { articleId, userId })
    
    // First check if article exists and get all matching articles
    const { data: articles, error: queryError } = await supabase
      .from('articles')
      .select('id, user_id, title')
      .eq('id', articleId)

    console.log('Debug: Articles found:', articles)
    console.log('Debug: Query error:', queryError)
    
    // Also check all articles for this user to see what exists
    const { data: userArticles } = await supabase
      .from('articles')
      .select('id, user_id, title')
      .eq('user_id', userId)
      .limit(5)
    
    console.log('Debug: User articles:', userArticles)

    if (queryError) {
      return res.status(403).json({ 
        success: false, 
        error: `Database error: ${queryError.message}` 
      })
    }

    if (!articles || articles.length === 0) {
      return res.status(403).json({ 
        success: false, 
        error: 'Article not found' 
      })
    }

    if (articles.length > 1) {
      console.log('Debug: Multiple articles found with same ID!')
      return res.status(403).json({ 
        success: false, 
        error: 'Database integrity error: multiple articles with same ID' 
      })
    }

    const article = articles[0]

    if (article.user_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: `Access denied: Article belongs to ${article.user_id}, but user is ${userId}` 
      })
    }

    // Build the prompt for the writing agent
    const prompt = buildPrompt('writer', content, { focus })

    // Call the LLM with a higher token limit for content development
    const llmResponse = await callLLM(prompt, {
      temperature: 0.8,
      max_tokens: 6000,
      system_prompt: 'You are a professional writer and content developer. Expand and enhance the provided content while maintaining the author\'s voice and intent.'
    })

    const developedContent = llmResponse.content.trim()

    // Store the agent interaction
    const { data: interaction, error: interactionError } = await supabase
      .from('agent_interactions')
      .insert({
        article_id: articleId,
        agent_type: 'writer',
        input_content: content,
        output_content: developedContent,
        prompt_used: prompt
      })
      .select()
      .single()

    if (interactionError) {
      console.error('Failed to store interaction:', interactionError)
    }

    // Update the article's updated_at timestamp and word count
    const wordCount = developedContent.split(/\s+/).length
    await supabase
      .from('articles')
      .update({ 
        updated_at: new Date().toISOString(),
        word_count: wordCount
      })
      .eq('id', articleId)

    return res.status(200).json({
      success: true,
      developedContent,
      interactionId: interaction?.id
    })

  } catch (error: any) {
    console.error('Develop agent error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}