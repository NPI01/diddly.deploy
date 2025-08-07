#!/usr/bin/env node

const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

async function setupSubstackCookies() {
  console.log('🚀 Setting up Substack authentication cookies...\n')
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  })
  
  const page = await browser.newPage()
  
  console.log('📖 Opening Substack login page...')
  await page.goto('https://substack.com/sign-in')
  
  console.log('\n📝 Instructions:')
  console.log('1. Log in to your Substack account manually in the browser')
  console.log('2. Once logged in and you see your dashboard, press ENTER in this terminal')
  console.log('3. Do NOT close the browser window until instructed\n')
  
  // Wait for user to press Enter
  await new Promise((resolve) => {
    process.stdin.once('data', resolve)
  })
  
  try {
    console.log('💾 Saving cookies...')
    const cookies = await page.cookies()
    const cookiesPath = path.join(process.cwd(), 'cookies.json')
    
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2))
    
    console.log('✅ Cookies saved successfully!')
    console.log(`📁 Saved to: ${cookiesPath}`)
    console.log('\n🔐 Important:')
    console.log('- Keep cookies.json secure and never commit it to version control')
    console.log('- Cookies will expire after ~2 weeks, then re-run this script')
    console.log('- You can now use the Substack publishing feature')
    
  } catch (error) {
    console.error('❌ Error saving cookies:', error.message)
  } finally {
    await browser.close()
    console.log('\n✨ Setup complete! You can now close this terminal.')
  }
}

if (require.main === module) {
  setupSubstackCookies().catch(console.error)
}

module.exports = { setupSubstackCookies }