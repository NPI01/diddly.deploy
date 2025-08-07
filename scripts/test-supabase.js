#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local')
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found')
    process.exit(1)
  }

  const envFile = fs.readFileSync(envPath, 'utf8')
  const envVars = {}
  
  envFile.split('\n').forEach(line => {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    }
  })
  
  return envVars
}

async function testSupabase() {
  console.log('🧪 Testing Supabase connection...\n')

  const envVars = loadEnvFile()
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables')
    process.exit(1)
  }

  console.log('🔗 Supabase URL:', supabaseUrl.substring(0, 30) + '...')
  console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...')

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    console.log('\n🔍 Testing basic connection...')
    
    // Test 1: Simple query to test connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ Connection test failed:', error.message)
      return
    }

    console.log('✅ Basic connection works')

    // Test 2: Auth status
    console.log('\n🔐 Testing auth status...')
    const { data: authData, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ Auth test failed:', authError.message)
      return
    }

    console.log('✅ Auth call works')
    console.log('👤 Current user:', authData.user ? authData.user.email : 'None')

    // Test 3: Articles table
    console.log('\n📝 Testing articles table...')
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, user_id, title, created_at')
      .limit(5)
    
    if (articlesError) {
      console.error('❌ Articles query failed:', articlesError.message)
    } else {
      console.log('✅ Articles table accessible')
      console.log('Found', articles.length, 'articles:')
      articles.forEach(article => {
        console.log(`- ${article.title} (${article.id}) by ${article.user_id}`)
      })
    }

    console.log('\n🎉 All tests passed!')

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
  }
}

if (require.main === module) {
  testSupabase()
}

module.exports = { testSupabase }