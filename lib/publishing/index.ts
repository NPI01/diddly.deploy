import { publishToSubstack } from './substack'
import { publishToGhost } from './ghost'
import { publishToMedium } from './medium'

export type Platform = 'substack' | 'ghost' | 'medium'

export interface UnifiedPublishOptions {
  platform: Platform
  title: string
  content: string
  subtitle?: string
  excerpt?: string
  tags?: string[]
  publishStatus?: 'published' | 'draft' | 'public' | 'unlisted'
  scheduledDate?: string
  featured?: boolean
  notifyFollowers?: boolean
}

export interface PublishResult {
  success: boolean
  url?: string
  id?: string
  error?: string
  platform: Platform
}

export async function publishToPlatform(options: UnifiedPublishOptions): Promise<PublishResult> {
  const { platform, ...publishOptions } = options

  try {
    let result: Omit<PublishResult, 'platform'>

    switch (platform) {
      case 'substack':
        result = await publishToSubstack({
          title: publishOptions.title,
          content: publishOptions.content,
          subtitle: publishOptions.subtitle,
          tags: publishOptions.tags,
          scheduledDate: publishOptions.scheduledDate
        })
        break

      case 'ghost':
        result = await publishToGhost({
          title: publishOptions.title,
          content: publishOptions.content,
          excerpt: publishOptions.excerpt,
          tags: publishOptions.tags,
          featured: publishOptions.featured,
          publishedAt: publishOptions.scheduledDate,
          status: publishOptions.publishStatus === 'draft' ? 'draft' : 'published'
        })
        break

      case 'medium':
        result = await publishToMedium({
          title: publishOptions.title,
          content: publishOptions.content,
          tags: publishOptions.tags,
          publishStatus: publishOptions.publishStatus === 'draft' ? 'draft' : 'public',
          notifyFollowers: publishOptions.notifyFollowers
        })
        break

      default:
        result = {
          success: false,
          error: `Unsupported platform: ${platform}`
        }
    }

    return {
      ...result,
      platform
    }

  } catch (error: any) {
    console.error(`Publishing error for ${platform}:`, error)
    return {
      success: false,
      error: error.message || 'Unknown publishing error',
      platform
    }
  }
}

// Content formatting utilities for different platforms
export function formatContentForPlatform(content: string, platform: Platform): string {
  switch (platform) {
    case 'substack':
      return formatForSubstack(content)
    case 'ghost':
      return formatForGhost(content)
    case 'medium':
      return formatForMedium(content)
    default:
      return content
  }
}

function formatForSubstack(content: string): string {
  // Substack supports basic HTML and markdown
  // Ensure proper paragraph breaks and basic formatting
  return content
    .replace(/\n\n/g, '</p><p>')
    .replace(/^\s*/, '<p>')
    .replace(/\s*$/, '</p>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

function formatForGhost(content: string): string {
  // Ghost expects clean HTML
  // Remove any problematic tags and ensure proper structure
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/\n\n/g, '</p><p>')
}

function formatForMedium(content: string): string {
  // Medium supports a subset of HTML
  // Convert to Medium's preferred format
  return content
    .replace(/<h1>/g, '<h3>') // Medium doesn't support h1 in posts
    .replace(/<\/h1>/g, '</h3>')
    .replace(/<h2>/g, '<h3>')
    .replace(/<\/h2>/g, '</h3>')
}

// Platform-specific validation
export function validateContentForPlatform(content: string, platform: Platform): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  switch (platform) {
    case 'substack':
      if (content.length > 100000) {
        errors.push('Content is too long for Substack (max 100,000 characters)')
      }
      break

    case 'ghost':
      if (content.length > 2000000) {
        errors.push('Content is too long for Ghost (max 2,000,000 characters)')
      }
      break

    case 'medium':
      if (content.length > 100000) {
        errors.push('Content is too long for Medium (max 100,000 characters)')
      }
      break
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Get platform-specific publishing requirements
export function getPlatformRequirements(platform: Platform) {
  const requirements = {
    substack: {
      maxTitleLength: 300,
      maxContentLength: 100000,
      maxTags: 5,
      supportsScheduling: true,
      supportsSubtitle: true,
      requiresAuth: 'cookies'
    },
    ghost: {
      maxTitleLength: 255,
      maxContentLength: 2000000,
      maxTags: 10,
      supportsScheduling: true,
      supportsExcerpt: true,
      requiresAuth: 'api_key'
    },
    medium: {
      maxTitleLength: 100,
      maxContentLength: 100000,
      maxTags: 3,
      supportsScheduling: false,
      supportsPublications: true,
      requiresAuth: 'oauth_token'
    }
  }

  return requirements[platform]
}