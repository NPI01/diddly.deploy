import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { buildPrompt } from '@/lib/agents/prompts'
import { callLLM } from '@/lib/llm/client'

interface EditRequest {
  articleId: string
  content: string
  level: 1 | 2 | 3
}

interface EditResponse {
  success: boolean
  editedContent?: string
  interactionId?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EditResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { articleId, content, level }: EditRequest = req.body

    if (!articleId || !content || !level) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: articleId, content, level' 
      })
    }

    if (![1, 2, 3].includes(level)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Level must be 1, 2, or 3' 
      })
    }

    // Get authenticated user and create client with auth context
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'No authorization header' })
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
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' })
    }

    // Verify the user owns this article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, user_id')
      .eq('id', articleId)
      .eq('user_id', user.id)
      .single()

    if (articleError || !article) {
      return res.status(403).json({ 
        success: false, 
        error: 'Article not found or access denied' 
      })
    }

    // Build the prompt for the editor agent
    const prompt = buildPrompt('editor', content, { level })

    // Call the LLM
    const llmResponse = await callLLM(prompt, {
      temperature: 0.7,
      max_tokens: 4000,
      provider: 'vllm', // Use your custom vLLM endpoint
      system_prompt: 'You are a professional editor. Return only the edited content without any additional commentary.'
    })

    const editedContent = llmResponse.content.trim()

    // Store the agent interaction
    const { data: interaction, error: interactionError } = await supabase
      .from('agent_interactions')
      .insert({
        article_id: articleId,
        agent_type: 'editor',
        level: level,
        input_content: content,
        output_content: editedContent,
        prompt_used: prompt
      })
      .select()
      .single()

    if (interactionError) {
      console.error('Failed to store interaction:', interactionError)
      // Don't fail the request, just log the error
    }

    // Update the article's updated_at timestamp
    await supabase
      .from('articles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', articleId)

    return res.status(200).json({
      success: true,
      editedContent,
      interactionId: interaction?.id
    })

  } catch (error: any) {
    console.error('Edit agent error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}