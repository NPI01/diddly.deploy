'use client'

import { useState } from 'react'
import { Loader2, X, ExternalLink, CheckCircle2 } from 'lucide-react'
import type { Platform } from '@/lib/publishing'

interface PublishPanelProps {
  articleId: string
  title: string
  content: string
  onClose: () => void
}

interface PublishResult {
  platform: Platform
  success: boolean
  url?: string
  error?: string
}

export function PublishPanel({ articleId, title, content, onClose }: PublishPanelProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['substack'])
  const [publishing, setPublishing] = useState(false)
  const [results, setResults] = useState<PublishResult[]>([])
  const [tags, setTags] = useState<string>('')

  const platforms: { value: Platform; label: string; description: string; color: string }[] = [
    { value: 'substack', label: 'Substack', description: 'Newsletter platform', color: 'bg-orange-500' },
    { value: 'ghost', label: 'Ghost', description: 'Professional blog', color: 'bg-gray-800' },
    { value: 'medium', label: 'Medium', description: 'Social writing platform', color: 'bg-green-600' }
  ]

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform')
      return
    }

    setPublishing(true)
    setResults([])

    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)

    try {
      const publishPromises = selectedPlatforms.map(async (platform) => {
        try {
          const response = await fetch('/api/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              articleId,
              platform,
              title,
              content,
              tags: tagArray,
              publishStatus: 'published',
              userId: 'current-user' // This should come from auth context
            })
          })

          const data = await response.json()
          
          return {
            platform,
            success: data.success,
            url: data.url,
            error: data.error
          }
        } catch (error) {
          return {
            platform,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })

      const publishResults = await Promise.all(publishPromises)
      setResults(publishResults)

    } catch (error) {
      console.error('Publishing error:', error)
    } finally {
      setPublishing(false)
    }
  }

  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length
  const estimatedReadTime = Math.ceil(wordCount / 200) // 200 words per minute

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Publish Article</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Article Preview */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Article Preview</h4>
          <div className="p-3 bg-gray-50 rounded-lg">
            <h5 className="font-semibold text-gray-900 mb-1">{title || 'Untitled Article'}</h5>
            <div className="text-xs text-gray-500 mb-2">
              {wordCount} words • {estimatedReadTime} min read
            </div>
            <p className="text-sm text-gray-700 line-clamp-3">
              {content.substring(0, 150)}...
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="writing, productivity, tips (comma-separated)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>

        {/* Platform Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Select Platforms</label>
          <div className="space-y-2">
            {platforms.map((platform) => (
              <label
                key={platform.value}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(platform.value)}
                  onChange={() => togglePlatform(platform.value)}
                  className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                />
                <div className={`w-3 h-3 rounded-full ${platform.color}`}></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{platform.label}</div>
                  <div className="text-xs text-gray-500">{platform.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Publish Button */}
        <button
          onClick={handlePublish}
          disabled={publishing || selectedPlatforms.length === 0}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
        >
          {publishing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Publishing...</span>
            </>
          ) : (
            <span>Publish to {selectedPlatforms.length} Platform{selectedPlatforms.length > 1 ? 's' : ''}</span>
          )}
        </button>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900">Publishing Results</h4>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium capitalize">
                        {result.platform}
                      </span>
                    </div>
                    
                    {result.success && result.url && (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
                      >
                        <span>View</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  
                  {result.error && (
                    <p className="text-xs text-red-600 mt-1">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}