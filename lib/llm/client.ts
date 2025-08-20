import OpenAI from 'openai'

// OpenAI client - only initialize if API key is provided
let openai: OpenAI | null = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

// vLLM client configured to use your ngrok endpoint
const vllmClient = new OpenAI({
  apiKey: 'not-needed', // vLLM doesn't require API key
  baseURL: 'https://second-stud-free-jointly.ngrok-free.app/v1'
})

export interface LLMResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function callLLM(
  prompt: string,
  options: {
    model?: string
    temperature?: number
    max_tokens?: number
    system_prompt?: string
    provider?: 'vllm' | 'openai' | 'auto'
  } = {}
): Promise<LLMResponse> {
  const {
    model = 'cpatonn/Qwen3-Coder-30B-A3B-Instruct-GPTQ-4bit',
    temperature = 0.7,
    max_tokens = 4000,
    system_prompt = 'You are a helpful AI assistant focused on writing and content creation.',
    provider = 'auto'
  } = options

  // Determine which client to use
  let client: OpenAI
  let actualModel = model

  if (provider === 'vllm' || (provider === 'auto' && process.env.NEXT_PUBLIC_LLM_API_URL)) {
    client = vllmClient
    actualModel = 'cpatonn/Qwen3-Coder-30B-A3B-Instruct-GPTQ-4bit'
  } else if (provider === 'openai' || (provider === 'auto' && openai)) {
    client = openai!
    actualModel = model.includes('gpt') ? model : 'gpt-4o-mini' // Default to GPT-4 mini for OpenAI
  } else {
    throw new Error('No LLM provider available. Please configure vLLM endpoint or OpenAI API key.')
  }

  try {
    const completion = await client.chat.completions.create({
      model: actualModel,
      temperature,
      max_tokens,
      messages: [
        {
          role: 'system',
          content: system_prompt
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = completion.choices[0]?.message?.content || ''
    
    return {
      content,
      usage: completion.usage ? {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens
      } : undefined
    }
  } catch (error) {
    console.error('LLM API Error:', error)
    throw new Error('Failed to generate content. Please try again.')
  }
}

// Alternative: Anthropic Claude client
export async function callClaude(
  prompt: string,
  options: {
    model?: string
    temperature?: number
    max_tokens?: number
  } = {}
): Promise<LLMResponse> {
  const {
    model = 'claude-3-sonnet-20240229',
    temperature = 0.7,
    max_tokens = 4000
  } = options

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens,
        temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.content[0]?.text || ''

    return {
      content,
      usage: data.usage ? {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.input_tokens + data.usage.output_tokens
      } : undefined
    }
  } catch (error) {
    console.error('Claude API Error:', error)
    throw new Error('Failed to generate content. Please try again.')
  }
}

// Local LLM client (for LM Studio, Ollama, etc.)
export async function callLocalLLM(
  prompt: string,
  options: {
    endpoint?: string
    model?: string
    temperature?: number
    max_tokens?: number
  } = {}
): Promise<LLMResponse> {
  const {
    endpoint = process.env.NEXT_PUBLIC_LLM_API_URL + '/v1/chat/completions',
    model = 'cpatonn/Qwen3-Coder-30B-A3B-Instruct-GPTQ-4bit',
    temperature = 0.7,
    max_tokens = 4000
  } = options

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens,
        stream: false,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        // vLLM specific optimizations
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`Local LLM error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    return {
      content,
      usage: data.usage
    }
  } catch (error) {
    console.error('Local LLM Error:', error)
    throw new Error('Failed to connect to local LLM. Please check your setup.')
  }
}

// Parallel agent execution with vLLM
export async function callLLMBatch(
  prompts: string[],
  options: {
    model?: string
    temperature?: number
    max_tokens?: number
    system_prompt?: string
    provider?: 'vllm' | 'openai' | 'auto'
  } = {}
): Promise<LLMResponse[]> {
  const {
    model = 'cpatonn/Qwen3-Coder-30B-A3B-Instruct-GPTQ-4bit',
    temperature = 0.7,
    max_tokens = 4000,
    system_prompt = 'You are a helpful AI assistant focused on writing and content creation.',
    provider = 'auto'
  } = options

  // Determine which client to use
  let client: OpenAI
  let actualModel = model

  if (provider === 'vllm' || (provider === 'auto' && process.env.NEXT_PUBLIC_LLM_API_URL)) {
    client = vllmClient
    actualModel = 'cpatonn/Qwen3-Coder-30B-A3B-Instruct-GPTQ-4bit'
  } else if (provider === 'openai' || (provider === 'auto' && openai)) {
    client = openai!
    actualModel = model.includes('gpt') ? model : 'gpt-4o-mini'
  } else {
    throw new Error('No LLM provider available. Please configure vLLM endpoint or OpenAI API key.')
  }

  // Execute all requests concurrently using OpenAI SDK
  const promises = prompts.map(async (prompt) => {
    try {
      const completion = await client.chat.completions.create({
        model: actualModel,
        temperature,
        max_tokens,
        messages: [
          {
            role: 'system',
            content: system_prompt
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const content = completion.choices[0]?.message?.content || ''
      
      return {
        content,
        usage: completion.usage ? {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens
        } : undefined
      }
    } catch (error) {
      console.error('Batch LLM API Error:', error)
      return {
        content: 'Error: Failed to generate content for this request.',
        usage: undefined
      }
    }
  })
  
  return Promise.all(promises)
}

// Multi-agent parallel execution for complex tasks
export interface AgentTask {
  agentType: 'editor' | 'writer' | 'researcher' | 'growth'
  content: string
  options?: Record<string, any>
}

export interface AgentResult extends LLMResponse {
  agentType: string
  success: boolean
  error?: string
}

export async function callMultipleAgents(
  tasks: AgentTask[],
  globalOptions: {
    model?: string
    temperature?: number
    max_tokens?: number
    provider?: 'vllm' | 'openai' | 'auto'
  } = {}
): Promise<AgentResult[]> {
  const { buildPrompt } = await import('@/lib/agents/prompts')
  
  const promises = tasks.map(async (task): Promise<AgentResult> => {
    try {
      const prompt = buildPrompt(task.agentType, task.content, task.options || {})
      
      const response = await callLLM(prompt, {
        ...globalOptions,
        system_prompt: getSystemPromptForAgent(task.agentType),
        temperature: getTemperatureForAgent(task.agentType),
        max_tokens: getMaxTokensForAgent(task.agentType)
      })

      return {
        ...response,
        agentType: task.agentType,
        success: true
      }
    } catch (error) {
      console.error(`Agent ${task.agentType} error:`, error)
      return {
        content: '',
        agentType: task.agentType,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  return Promise.all(promises)
}

// Agent-specific configurations
function getSystemPromptForAgent(agentType: string): string {
  switch (agentType) {
    case 'editor':
      return 'You are a professional article editor. Focus on improving clarity, structure, and grammar while preserving the author\'s voice.'
    case 'writer':
      return 'You are a professional writer and content developer. Expand and enhance content while maintaining the author\'s voice and intent.'
    case 'researcher':
      return 'You are a research assistant. Enhance articles with credible supporting evidence, statistics, and contextual information.'
    case 'growth':
      return 'You are a growth strategy assistant. Analyze content and provide actionable feedback to increase reach and engagement.'
    default:
      return 'You are a helpful AI assistant focused on writing and content creation.'
  }
}

function getTemperatureForAgent(agentType: string): number {
  switch (agentType) {
    case 'editor':
      return 0.3 // More conservative for editing
    case 'writer':
      return 0.8 // More creative for writing
    case 'researcher':
      return 0.4 // Balanced for research
    case 'growth':
      return 0.6 // Moderate creativity for strategy
    default:
      return 0.7
  }
}

function getMaxTokensForAgent(agentType: string): number {
  switch (agentType) {
    case 'editor':
      return 4000 // Moderate length for edits
    case 'writer':
      return 6000 // Longer for content development
    case 'researcher':
      return 5000 // Longer for research additions
    case 'growth':
      return 3000 // Shorter for strategy insights
    default:
      return 4000
  }
}