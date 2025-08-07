// OpenAI client - only initialize if API key is provided
let openai: any = null
if (process.env.OPENAI_API_KEY) {
  try {
    const OpenAI = require('openai')
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  } catch (error) {
    console.warn('OpenAI package not installed, using local LLM only')
  }
}

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
  } = {}
): Promise<LLMResponse> {
  const {
    model = 'cpatonn/Qwen3-Coder-30B-A3B-Instruct-GPTQ-4bit',
    temperature = 0.7,
    max_tokens = 4000,
    system_prompt = 'You are a helpful AI assistant focused on writing and content creation.'
  } = options

  // Use local LLM by default
  if (process.env.NEXT_PUBLIC_LLM_API_URL) {
    return callLocalLLM(`${system_prompt}\n\nUser: ${prompt}`, options)
  }

  // Fallback to OpenAI if available
  if (!openai) {
    throw new Error('No LLM provider available. Please configure NEXT_PUBLIC_LLM_API_URL or install OpenAI package.')
  }

  try {
    const completion = await openai.chat.completions.create({
      model,
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

// Concurrent request helper for vLLM
export async function callLLMBatch(
  prompts: string[],
  options: {
    model?: string
    temperature?: number
    max_tokens?: number
    system_prompt?: string
  } = {}
): Promise<LLMResponse[]> {
  const {
    model = 'cpatonn/Qwen3-Coder-30B-A3B-Instruct-GPTQ-4bit',
    temperature = 0.7,
    max_tokens = 4000,
    system_prompt = 'You are a helpful AI assistant focused on writing and content creation.'
  } = options

  // Use local LLM by default for batch requests
  if (process.env.NEXT_PUBLIC_LLM_API_URL) {
    const batchPrompts = prompts.map(prompt => `${system_prompt}\n\nUser: ${prompt}`)
    
    // Execute all requests concurrently (vLLM handles this efficiently)
    const promises = batchPrompts.map(prompt => 
      callLocalLLM(prompt, { ...options, model, temperature, max_tokens })
    )
    
    return Promise.all(promises)
  }

  // Fallback to sequential requests if no local LLM
  const results: LLMResponse[] = []
  for (const prompt of prompts) {
    const result = await callLLM(prompt, options)
    results.push(result)
  }
  
  return results
}