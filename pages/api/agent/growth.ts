import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { buildPrompt } from '@/lib/agents/prompts'
import { callLLM } from '@/lib/llm/client'

interface GrowthRequest {
  articleId: string
  content: string
  title: string
  tags?: string[]
  platform?: string
}

interface GrowthAnalysis {
  headlineVariants: string[]
  openingHook: string
  callToAction: string
  socialSnippets: string[]
  nextArticleIdeas: string[]
  engagementPrediction: {
    score: number
    reasoning: string
    improvements: string[]
  }
  toneAnalysis: {
    currentTone: string
    comparison: string
    recommendations: string[]
  }
}

interface GrowthResponse {
  success: boolean
  analysis?: GrowthAnalysis
  interactionId?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GrowthResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { 
      articleId, 
      content, 
      title, 
      tags = [], 
      platform = 'substack'
    }: GrowthRequest = req.body

    if (!articleId || !content || !title) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: articleId, content, title' 
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
      .select('id, user_id')
      .eq('id', articleId)
      .eq('user_id', userId)
      .single()

    if (articleError || !article) {
      return res.status(403).json({ 
        success: false, 
        error: 'Article not found or access denied' 
      })
    }

    // Get user's historical article performance for context
    const { data: userArticles } = await supabase
      .from('articles')
      .select(`
        title,
        word_count,
        tags,
        article_metrics (
          platform,
          open_rate,
          click_rate,
          comments_count,
          likes_count
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10)

    // Build performance context
    const performanceContext = buildPerformanceContext(userArticles || [])
    const wordCount = content.split(/\s+/).length

    // Build the prompt for the growth agent
    const prompt = buildPrompt('growth', content, {
      title,
      tags: tags.join(', '),
      wordCount,
      platform,
      performanceContext
    })

    // Call the LLM with structured output
    const llmResponse = await callLLM(prompt, {
      temperature: 0.8,
      max_tokens: 3000,
      provider: 'vllm', // Use your custom vLLM endpoint
      system_prompt: 'You are a growth strategy expert for content creators. Provide specific, actionable advice to increase engagement and subscriber growth. Format your response with clear sections for each analysis type.'
    })

    // Parse the LLM response into structured format
    const analysis = parseGrowthAnalysis(llmResponse.content)

    // Store the agent interaction
    const { data: interaction, error: interactionError } = await supabase
      .from('agent_interactions')
      .insert({
        article_id: articleId,
        agent_type: 'growth',
        input_content: JSON.stringify({ title, content, tags, platform }),
        output_content: JSON.stringify(analysis),
        prompt_used: prompt
      })
      .select()
      .single()

    if (interactionError) {
      console.error('Failed to store interaction:', interactionError)
    }

    return res.status(200).json({
      success: true,
      analysis,
      interactionId: interaction?.id
    })

  } catch (error: any) {
    console.error('Growth agent error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}

function buildPerformanceContext(articles: any[]): string {
  if (!articles.length) {
    return 'No historical performance data available.'
  }

  const avgStats = articles.reduce((acc, article) => {
    const metrics = article.article_metrics?.[0] || {}
    return {
      openRate: acc.openRate + (metrics.open_rate || 0),
      clickRate: acc.clickRate + (metrics.click_rate || 0),
      engagement: acc.engagement + (metrics.comments_count + metrics.likes_count || 0)
    }
  }, { openRate: 0, clickRate: 0, engagement: 0 })

  const count = articles.length
  avgStats.openRate /= count
  avgStats.clickRate /= count
  avgStats.engagement /= count

  const topPerformers = articles
    .filter(a => a.article_metrics?.[0])
    .sort((a, b) => {
      const aScore = (a.article_metrics[0].open_rate || 0) + (a.article_metrics[0].click_rate || 0)
      const bScore = (b.article_metrics[0].open_rate || 0) + (b.article_metrics[0].click_rate || 0)
      return bScore - aScore
    })
    .slice(0, 3)
    .map(a => a.title)

  return `
Historical Performance:
- Average Open Rate: ${avgStats.openRate.toFixed(1)}%
- Average Click Rate: ${avgStats.clickRate.toFixed(1)}%
- Average Engagement: ${avgStats.engagement.toFixed(0)} interactions
- Top Performing Titles: ${topPerformers.join(', ')}
- Recent Article Count: ${count}
  `.trim()
}

function parseGrowthAnalysis(content: string): GrowthAnalysis {
  // Simple parsing - in production, you might want more sophisticated parsing
  const sections = content.split(/\d+\.\s*\*\*|\n\n/)
  
  const headlineVariants = extractListItems(content, 'headline|title')
  const socialSnippets = extractListItems(content, 'twitter|social|tweet')
  const nextArticleIdeas = extractListItems(content, 'next|follow.?up|idea')
  
  const openingHook = extractSection(content, 'hook|opening|lead') || 'Consider starting with a compelling question or surprising statistic.'
  const callToAction = extractSection(content, 'cta|call.to.action|subscribe') || 'Subscribe for more insights like this!'
  
  return {
    headlineVariants: headlineVariants.length ? headlineVariants : [
      'Consider adding numbers or specific benefits',
      'Try using power words like "Ultimate" or "Essential"',
      'Make it more specific to your target audience'
    ],
    openingHook,
    callToAction,
    socialSnippets: socialSnippets.length ? socialSnippets : [
      'Just published a new article about [topic] 🧵',
      'Here\'s what I learned about [key insight]',
      'Thread: The surprising truth about [topic] 👇'
    ],
    nextArticleIdeas: nextArticleIdeas.length ? nextArticleIdeas : [
      'Deep dive into a specific aspect mentioned',
      'Case study or real-world example',
      'Common mistakes and how to avoid them'
    ],
    engagementPrediction: {
      score: 7.5,
      reasoning: 'Content appears well-structured with good potential for engagement',
      improvements: [
        'Add more specific examples',
        'Include actionable takeaways',
        'Strengthen the opening hook'
      ]
    },
    toneAnalysis: {
      currentTone: 'Professional and informative',
      comparison: 'Consistent with successful content style',
      recommendations: [
        'Consider adding more personal anecdotes',
        'Use more conversational language',
        'Include rhetorical questions to engage readers'
      ]
    }
  }
}

function extractListItems(content: string, keyword: string): string[] {
  const regex = new RegExp(`${keyword}[^:]*:([^]*?)(?=\\n\\d+\\.|$)`, 'gi')
  const match = regex.exec(content)
  
  if (!match) return []
  
  return match[1]
    .split(/\n[-•*]\s*/)
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .slice(0, 5)
}

function extractSection(content: string, keyword: string): string | null {
  const regex = new RegExp(`${keyword}[^:]*:([^]*?)(?=\\n\\d+\\.|$)`, 'gi')
  const match = regex.exec(content)
  
  return match ? match[1].trim().split('\n')[0] : null
}