#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local')
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found')
    console.error('Please make sure you have created .env.local with your Supabase credentials')
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

async function createAdminAccount() {
  console.log('🔧 Setting up admin account...\n')

  // Load environment variables from .env.local
  const envVars = loadEnvFile()
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables in .env.local:')
    if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseServiceKey) console.error('- SUPABASE_SERVICE_ROLE_KEY')
    console.error('\nPlease add these to your .env.local file:')
    console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here')
    console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here')
    process.exit(1)
  }

  console.log('✅ Environment variables loaded from .env.local')
  console.log(`🔗 Supabase URL: ${supabaseUrl.substring(0, 30)}...`)

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Create admin user
    console.log('👤 Creating admin user...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'nisaac01@gmail.com',
      password: '2025diddly!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User'
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('✅ Admin user already exists')
        
        // Get the existing user
        const { data: users, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) throw listError
        
        const adminUser = users.users.find(u => u.email === 'nisaac01@gmail.com')
        if (!adminUser) throw new Error('Could not find admin user')
        
        console.log(`📧 Admin user ID: ${adminUser.id}`)
        console.log(`📧 Admin email: ${adminUser.email}`)
      } else {
        throw authError
      }
    } else {
      console.log('✅ Admin user created successfully!')
      console.log(`📧 Admin user ID: ${authData.user.id}`)
      console.log(`📧 Admin email: ${authData.user.email}`)
    }

    console.log('\n🎉 Admin account setup complete!')
    console.log('\nYou can now sign in with:')
    console.log('📧 Email: nisaac01@gmail.com')
    console.log('🔑 Password: 2025diddly!')

  } catch (error) {
    console.error('❌ Error creating admin account:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  createAdminAccount()
}

module.exports = { createAdminAccount }