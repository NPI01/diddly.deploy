import axios from 'axios'

interface PublishOptions {
  title: string
  content: string
  excerpt?: string
  tags?: string[]
  featured?: boolean
  publishedAt?: string
  status?: 'published' | 'draft'
}

interface PublishResult {
  success: boolean
  url?: string
  id?: string
  error?: string
}

export async function publishToGhost(options: PublishOptions): Promise<PublishResult> {
  const {
    title,
    content,
    excerpt,
    tags = [],
    featured = false,
    publishedAt,
    status = 'published'
  } = options

  const GHOST_API_URL = process.env.GHOST_API_URL
  const GHOST_ADMIN_KEY = process.env.GHOST_ADMIN_KEY

  if (!GHOST_API_URL || !GHOST_ADMIN_KEY) {
    return {
      success: false,
      error: 'Ghost API credentials not configured'
    }
  }

  const postPayload = {
    posts: [{
      title,
      html: content,
      excerpt,
      tags: tags.map(tag => ({ name: tag })),
      featured,
      status,
      published_at: publishedAt || new Date().toISOString()
    }]
  }

  try {
    const response = await axios.post(
      `${GHOST_API_URL}/ghost/api/admin/posts/?source=html`,
      postPayload,
      {
        headers: {
          Authorization: `Ghost ${GHOST_ADMIN_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const post = response.data.posts?.[0]
    
    if (!post) {
      throw new Error('No post data returned from Ghost API')
    }

    return {
      success: true,
      url: post.url,
      id: post.id
    }

  } catch (error: any) {
    console.error('Ghost publishing error:', error.response?.data || error.message)
    
    return {
      success: false,
      error: error.response?.data?.errors?.[0]?.message || error.message
    }
  }
}

export async function updateGhostPost(
  postId: string,
  options: Partial<PublishOptions>
): Promise<PublishResult> {
  const GHOST_API_URL = process.env.GHOST_API_URL
  const GHOST_ADMIN_KEY = process.env.GHOST_ADMIN_KEY

  if (!GHOST_API_URL || !GHOST_ADMIN_KEY) {
    return {
      success: false,
      error: 'Ghost API credentials not configured'
    }
  }

  const updatePayload = {
    posts: [{
      ...options,
      tags: options.tags?.map(tag => ({ name: tag }))
    }]
  }

  try {
    const response = await axios.put(
      `${GHOST_API_URL}/ghost/api/admin/posts/${postId}/`,
      updatePayload,
      {
        headers: {
          Authorization: `Ghost ${GHOST_ADMIN_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const post = response.data.posts?.[0]
    
    return {
      success: true,
      url: post.url,
      id: post.id
    }

  } catch (error: any) {
    console.error('Ghost update error:', error.response?.data || error.message)
    
    return {
      success: false,
      error: error.response?.data?.errors?.[0]?.message || error.message
    }
  }
}

export async function deleteGhostPost(postId: string): Promise<{ success: boolean; error?: string }> {
  const GHOST_API_URL = process.env.GHOST_API_URL
  const GHOST_ADMIN_KEY = process.env.GHOST_ADMIN_KEY

  if (!GHOST_API_URL || !GHOST_ADMIN_KEY) {
    return {
      success: false,
      error: 'Ghost API credentials not configured'
    }
  }

  try {
    await axios.delete(
      `${GHOST_API_URL}/ghost/api/admin/posts/${postId}/`,
      {
        headers: {
          Authorization: `Ghost ${GHOST_ADMIN_KEY}`
        }
      }
    )

    return { success: true }

  } catch (error: any) {
    console.error('Ghost delete error:', error.response?.data || error.message)
    
    return {
      success: false,
      error: error.response?.data?.errors?.[0]?.message || error.message
    }
  }
}