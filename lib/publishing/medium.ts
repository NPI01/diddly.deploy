import axios from 'axios'

interface PublishOptions {
  title: string
  content: string
  contentFormat?: 'html' | 'markdown'
  tags?: string[]
  publishStatus?: 'public' | 'draft' | 'unlisted'
  license?: 'all-rights-reserved' | 'cc-40-by' | 'cc-40-by-sa' | 'cc-40-by-nd' | 'cc-40-by-nc' | 'cc-40-by-nc-nd' | 'cc-40-by-nc-sa' | 'cc-40-zero' | 'public-domain'
  notifyFollowers?: boolean
}

interface PublishResult {
  success: boolean
  url?: string
  id?: string
  error?: string
}

interface MediumUser {
  id: string
  username: string
  name: string
  url: string
  imageUrl: string
}

export async function publishToMedium(options: PublishOptions): Promise<PublishResult> {
  const {
    title,
    content,
    contentFormat = 'html',
    tags = [],
    publishStatus = 'public',
    license = 'all-rights-reserved',
    notifyFollowers = false
  } = options

  const MEDIUM_ACCESS_TOKEN = process.env.MEDIUM_ACCESS_TOKEN

  if (!MEDIUM_ACCESS_TOKEN) {
    return {
      success: false,
      error: 'Medium access token not configured'
    }
  }

  try {
    // First, get the user ID
    const userResponse = await axios.get('https://api.medium.com/v1/me', {
      headers: {
        Authorization: `Bearer ${MEDIUM_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8'
      }
    })

    const user: MediumUser = userResponse.data.data

    // Create the post
    const postResponse = await axios.post(
      `https://api.medium.com/v1/users/${user.id}/posts`,
      {
        title,
        contentFormat,
        content,
        tags: tags.slice(0, 3), // Medium allows max 3 tags
        publishStatus,
        license,
        notifyFollowers
      },
      {
        headers: {
          Authorization: `Bearer ${MEDIUM_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Charset': 'utf-8'
        }
      }
    )

    const post = postResponse.data.data

    return {
      success: true,
      url: post.url,
      id: post.id
    }

  } catch (error: any) {
    console.error('Medium publishing error:', error.response?.data || error.message)
    
    let errorMessage = 'Unknown error occurred'
    
    if (error.response?.data?.errors) {
      errorMessage = error.response.data.errors.map((err: any) => err.message).join(', ')
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage
    }
  }
}

export async function getMediumUser(): Promise<{ success: boolean; user?: MediumUser; error?: string }> {
  const MEDIUM_ACCESS_TOKEN = process.env.MEDIUM_ACCESS_TOKEN

  if (!MEDIUM_ACCESS_TOKEN) {
    return {
      success: false,
      error: 'Medium access token not configured'
    }
  }

  try {
    const response = await axios.get('https://api.medium.com/v1/me', {
      headers: {
        Authorization: `Bearer ${MEDIUM_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8'
      }
    })

    return {
      success: true,
      user: response.data.data
    }

  } catch (error: any) {
    console.error('Medium user fetch error:', error.response?.data || error.message)
    
    return {
      success: false,
      error: error.response?.data?.message || error.message
    }
  }
}

export async function getMediumPublications(userId: string): Promise<{ success: boolean; publications?: any[]; error?: string }> {
  const MEDIUM_ACCESS_TOKEN = process.env.MEDIUM_ACCESS_TOKEN

  if (!MEDIUM_ACCESS_TOKEN) {
    return {
      success: false,
      error: 'Medium access token not configured'
    }
  }

  try {
    const response = await axios.get(`https://api.medium.com/v1/users/${userId}/publications`, {
      headers: {
        Authorization: `Bearer ${MEDIUM_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8'
      }
    })

    return {
      success: true,
      publications: response.data.data
    }

  } catch (error: any) {
    console.error('Medium publications fetch error:', error.response?.data || error.message)
    
    return {
      success: false,
      error: error.response?.data?.message || error.message
    }
  }
}