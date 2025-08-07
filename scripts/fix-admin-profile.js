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

async function fixAdminProfile() {
  console.log('🔧 Fixing admin profile...\n')

  const envVars = loadEnvFile()
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Find the admin user
    console.log('👤 Looking for admin user...')
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    const adminUser = users.users.find(u => u.email === 'nisaac01@gmail.com')
    if (!adminUser) {
      console.error('❌ Admin user not found')
      process.exit(1)
    }

    console.log(`✅ Found admin user: ${adminUser.email}`)
    console.log(`📧 User ID: ${adminUser.id}`)

    // Check if profile already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single()

    if (existingProfile && !profileError) {
      console.log('✅ Profile already exists!')
      console.log('Profile data:', existingProfile)
      return
    }

    console.log('📝 Profile missing, creating...')

    // Create the profile record
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.user_metadata?.full_name || 'Admin User',
        subscription_status: 'free'
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating profile:', insertError)
      process.exit(1)
    }

    console.log('✅ Profile created successfully!')
    console.log('Profile data:', newProfile)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  fixAdminProfile()
}

module.exports = { fixAdminProfile }