import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

interface PublishOptions {
  title: string
  content: string
  subtitle?: string
  tags?: string[]
  scheduledDate?: string
}

interface PublishResult {
  success: boolean
  url?: string
  error?: string
}

export async function publishToSubstack(options: PublishOptions): Promise<PublishResult> {
  const { title, content, subtitle, tags = [] } = options
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ],
  })

  const page = await browser.newPage()

  try {
    // Load saved cookies if they exist
    const cookiesPath = path.join(process.cwd(), 'cookies.json')
    if (fs.existsSync(cookiesPath)) {
      const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf-8'))
      await page.setCookie(...cookies)
    } else {
      throw new Error('No Substack session cookies found. Please run the cookie setup script first.')
    }

    // Navigate to the Substack editor
    await page.goto('https://substack.com/write', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    // Wait for the editor to load
    await page.waitForSelector('[data-testid="post-title-textbox"]', { timeout: 10000 })

    // Clear and input the title
    await page.click('[data-testid="post-title-textbox"]')
    await page.keyboard.selectAll()
    await page.keyboard.type(title, { delay: 50 })

    // Add subtitle if provided
    if (subtitle) {
      const subtitleSelector = '[data-testid="post-subtitle-textbox"]'
      await page.waitForSelector(subtitleSelector, { timeout: 5000 })
      await page.click(subtitleSelector)
      await page.keyboard.type(subtitle, { delay: 50 })
    }

    // Input the content
    const editorSelector = '[data-testid="post-body"]'
    await page.waitForSelector(editorSelector, { timeout: 10000 })
    await page.click(editorSelector)
    
    // Clear any existing content and paste new content
    await page.keyboard.selectAll()
    await page.keyboard.type(content, { delay: 10 })

    // Add tags if provided
    if (tags.length > 0) {
      try {
        const tagButton = await page.$('[aria-label="Add tags"]')
        if (tagButton) {
          await tagButton.click()
          await page.waitForTimeout(1000)
          
          for (const tag of tags) {
            await page.keyboard.type(tag)
            await page.keyboard.press('Enter')
            await page.waitForTimeout(500)
          }
        }
      } catch (error) {
        console.warn('Could not add tags:', error)
      }
    }

    // Click "Continue" to go to publish options
    const continueButton = await page.$x("//button[contains(text(), 'Continue')]")
    if (continueButton.length > 0) {
      await continueButton[0].click()
      await page.waitForTimeout(2000)
    }

    // Click "Publish now"
    const publishButton = await page.$x("//button[contains(text(), 'Publish now')]")
    if (publishButton.length === 0) {
      throw new Error('Publish button not found')
    }

    await publishButton[0].click()
    
    // Wait for the post to be published
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
    
    const finalUrl = page.url()
    
    await browser.close()
    
    return {
      success: true,
      url: finalUrl
    }

  } catch (error: any) {
    console.error('Substack publishing error:', error)
    await browser.close()
    
    return {
      success: false,
      error: error.message
    }
  }
}

// Helper function to save Substack session cookies
export async function saveSubstackCookies(): Promise<void> {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  
  console.log('Opening Substack login page...')
  await page.goto('https://substack.com/sign-in')
  
  console.log('Please log in manually and press ENTER when done...')
  
  return new Promise((resolve) => {
    process.stdin.once('data', async () => {
      try {
        const cookies = await page.cookies()
        const cookiesPath = path.join(process.cwd(), 'cookies.json')
        fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2))
        console.log('Cookies saved successfully!')
        await browser.close()
        resolve()
      } catch (error) {
        console.error('Error saving cookies:', error)
        await browser.close()
        resolve()
      }
    })
  })
}