import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { callMultipleAgents, type AgentTask, type AgentResult } from '@/lib/llm/client'

interface MultiAgentRequest {
  articleId: string
  tasks: AgentTask[]
  options?: {
    provider?: 'vllm' | 'openai' | 'auto'
    model?: string
  }
}

interface MultiAgentResponse {
  success: boolean
  results?: AgentResult[]
  interactionIds?: string[]
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MultiAgentResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { articleId, tasks, options = {} }: MultiAgentRequest = req.body

    if (!articleId || !tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: articleId, tasks (non-empty array)' 
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
    const { data: articles, error: queryError } = await supabase
      .from('articles')
      .select('id, user_id, title')
      .eq('id', articleId)

    if (queryError || !articles || articles.length === 0) {
      return res.status(403).json({ 
        success: false, 
        error: 'Article not found' 
      })
    }

    const article = articles[0]
    if (article.user_id !== user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      })
    }

    // Execute all agents in parallel
    console.log(`Executing ${tasks.length} agents in parallel for article ${articleId}`)
    const startTime = Date.now()
    
    const results = await callMultipleAgents(tasks, {
      provider: options.provider || 'vllm',
      model: options.model
    })

    const endTime = Date.now()
    console.log(`Parallel agent execution completed in ${endTime - startTime}ms`)

    // Store all agent interactions in parallel
    const interactionPromises = results.map(async (result, index) => {
      if (!result.success) return null

      const task = tasks[index]
      const { data: interaction, error: interactionError } = await supabase
        .from('agent_interactions')
        .insert({
          article_id: articleId,
          agent_type: result.agentType,
          level: task.options?.level,
          input_content: task.content,
          output_content: result.content,
          prompt_used: `Multi-agent execution - ${result.agentType}`
        })
        .select()
        .single()

      if (interactionError) {
        console.error(`Failed to store ${result.agentType} interaction:`, interactionError)
        return null
      }

      return interaction?.id
    })

    const interactionIds = (await Promise.all(interactionPromises)).filter(Boolean) as string[]

    // Update article timestamp
    await supabase
      .from('articles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', articleId)

    return res.status(200).json({
      success: true,
      results,
      interactionIds
    })

  } catch (error: any) {
    console.error('Multi-agent error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}
