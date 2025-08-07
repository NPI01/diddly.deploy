import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { buildPrompt } from '@/lib/agents/prompts'
import { callLLM } from '@/lib/llm/client'

interface ResearchRequest {
  articleId: string
  content: string
  focus?: string
}

interface ResearchResponse {
  success: boolean
  researchedContent?: string
  interactionId?: string
  error?: string
}

// Simple web search function using Brave Search API
async function searchWeb(query: string, limit: number = 5): Promise<string[]> {
  const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY
  
  if (!BRAVE_API_KEY) {
    console.warn('Brave Search API key not configured')
    return []
  }

  try {
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${limit}`, {
      headers: {
        'X-Subscription-Token': BRAVE_API_KEY,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.statusText}`)
    }

    const data = await response.json()
    const results = data.web?.results || []
    
    return results.map((result: any) => 
      `${result.title}\n${result.description}\nSource: ${result.url}\n`
    )
  } catch (error) {
    console.error('Web search error:', error)
    return []
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResearchResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { articleId, content, focus = 'general research' }: ResearchRequest = req.body

    if (!articleId || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: articleId, content' 
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

    const userId = user.id

    // Verify the user owns this article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, user_id, title')
      .eq('id', articleId)
      .eq('user_id', userId)
      .single()

    if (articleError || !article) {
      return res.status(403).json({ 
        success: false, 
        error: 'Article not found or access denied' 
      })
    }

    // Extract key topics from the content for search
    const searchQueries = extractSearchQueries(content, focus)
    
    // Perform web searches
    const searchResults: string[] = []
    for (const query of searchQueries.slice(0, 3)) { // Limit to 3 searches
      const results = await searchWeb(query, 3)
      searchResults.push(...results)
    }

    // Build the prompt for the research agent
    const researchContext = searchResults.length > 0 
      ? `\n\nRELEVANT RESEARCH FINDINGS:\n${searchResults.join('\n---\n')}`
      : '\n\nNote: Limited research data available. Use your knowledge to enhance the content.'

    const prompt = buildPrompt('researcher', content + researchContext, { focus })

    // Call the LLM
    const llmResponse = await callLLM(prompt, {
      temperature: 0.7,
      max_tokens: 6000,
      system_prompt: 'You are a research assistant. Enhance the content with credible information, statistics, and examples while maintaining accuracy and the author\'s voice.'
    })

    const researchedContent = llmResponse.content.trim()

    // Store the agent interaction
    const { data: interaction, error: interactionError } = await supabase
      .from('agent_interactions')
      .insert({
        article_id: articleId,
        agent_type: 'researcher',
        input_content: content,
        output_content: researchedContent,
        prompt_used: prompt
      })
      .select()
      .single()

    if (interactionError) {
      console.error('Failed to store interaction:', interactionError)
    }

    // Update the article's updated_at timestamp
    await supabase
      .from('articles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', articleId)

    return res.status(200).json({
      success: true,
      researchedContent,
      interactionId: interaction?.id
    })

  } catch (error: any) {
    console.error('Research agent error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}

function extractSearchQueries(content: string, focus: string): string[] {
  const queries: string[] = []
  
  // Add the focus as a primary query
  if (focus && focus !== 'general research') {
    queries.push(focus)
  }

  // Extract potential topics from content
  const sentences = content.split(/[.!?]+/)
  const topics = sentences
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 20 && sentence.length < 100)
    .slice(0, 2) // Take first 2 sentences as potential topics

  queries.push(...topics)

  // Extract key phrases (simple approach)
  const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
  const wordFreq = words.reduce((acc: Record<string, number>, word) => {
    acc[word] = (acc[word] || 0) + 1
    return acc
  }, {})

  const keyWords = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([word]) => word)

  if (keyWords.length > 0) {
    queries.push(keyWords.join(' '))
  }

  return queries.filter(q => q.length > 0).slice(0, 5)
}