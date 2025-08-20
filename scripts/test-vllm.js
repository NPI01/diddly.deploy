#!/usr/bin/env node

/**
 * Test script for vLLM endpoint connectivity and parallel execution
 * Run with: node scripts/test-vllm.js
 */

require('dotenv').config()

async function testVLLMConnection() {
  const vllmUrl = process.env.NEXT_PUBLIC_LLM_API_URL || 'https://second-stud-free-jointly.ngrok-free.app'
  
  console.log('🧪 Testing vLLM Connection...')
  console.log(`📍 Endpoint: ${vllmUrl}`)
  console.log(`🤖 Model: cpatonn/Qwen3-Coder-30B-A3B-Instruct-GPTQ-4bit`)
  
  try {
    // Test single request
    console.log('\n1️⃣ Testing single request...')
    const singleStart = Date.now()
    
    const response = await fetch(`${vllmUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'cpatonn/Qwen3-Coder-30B-A3B-Instruct-GPTQ-4bit',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant.'
          },
          {
            role: 'user',
            content: 'Write a single sentence about the benefits of AI in writing.'
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const singleTime = Date.now() - singleStart
    
    console.log(`✅ Single request successful (${singleTime}ms)`)
    console.log(`📝 Response: ${data.choices[0]?.message?.content || 'No content'}`)
    
    // Test parallel requests
    console.log('\n🚀 Testing parallel requests...')
    const parallelStart = Date.now()
    
    const prompts = [
      'Write about the future of AI in content creation.',
      'Explain the benefits of automated writing assistance.',
      'Describe how AI can help with research and fact-checking.',
      'Discuss growth strategies for content creators.'
    ]
    
    const parallelPromises = prompts.map(async (prompt, index) => {
      const response = await fetch(`${vllmUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'cpatonn/Qwen3-Coder-30B-A3B-Instruct-GPTQ-4bit',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      })
      
      const data = await response.json()
      return {
        prompt: prompt.substring(0, 50) + '...',
        response: data.choices[0]?.message?.content?.substring(0, 100) + '...' || 'No content',
        index
      }
    })
    
    const parallelResults = await Promise.all(parallelPromises)
    const parallelTime = Date.now() - parallelStart
    
    console.log(`✅ Parallel requests successful (${parallelTime}ms)`)
    console.log(`⚡ Speed improvement: ${Math.round((singleTime * 4) / parallelTime * 100)}% faster than sequential`)
    
    parallelResults.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.prompt}`)
      console.log(`   Response: ${result.response}`)
    })
    
    console.log('\n🎉 vLLM integration test completed successfully!')
    console.log('\n💡 Your Qwen3-Coder-30B model is ready for parallel agent execution!')
    
  } catch (error) {
    console.error('❌ vLLM test failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Check that your ngrok tunnel is running')
    console.log('2. Verify the vLLM server is accessible')
    console.log('3. Ensure the model is loaded correctly')
    console.log(`4. Test manually: curl -X POST ${vllmUrl}/v1/models`)
  }
}

if (require.main === module) {
  testVLLMConnection()
}

module.exports = { testVLLMConnection }
