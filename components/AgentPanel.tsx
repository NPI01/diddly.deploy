'use client'

import { useState } from 'react'
import { Loader2, Edit3, PenTool, Search, TrendingUp, X, ThumbsUp, ThumbsDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AgentPanelProps {
  articleId: string
  currentContent: string
  currentTitle: string
  onContentUpdate: (content: string) => void
  onClose: () => void
}

type AgentType = 'editor' | 'writer' | 'researcher' | 'growth'

interface AgentResult {
  type: AgentType
  content: string
  interactionId?: string
}

export function AgentPanel({ articleId, currentContent, currentTitle, onContentUpdate, onClose }: AgentPanelProps) {
  const [loading, setLoading] = useState<AgentType | null>(null)
  const [results, setResults] = useState<AgentResult[]>([])
  const [selectedResult, setSelectedResult] = useState<AgentResult | null>(null)

  const callAgent = async (type: AgentType, options: any = {}) => {
    setLoading(type)
    
    try {
      // Get auth token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      let endpoint = ''
      let body: any = {
        articleId,
        content: currentContent
      }

      switch (type) {
        case 'editor':
          endpoint = '/api/agent/edit'
          body.level = options.level || 1
          break
        case 'writer':
          endpoint = '/api/agent/develop'
          body.focus = options.focus || 'general development'
          break
        case 'researcher':
          endpoint = '/api/agent/research'
          body.focus = options.focus || 'general research'
          break
        case 'growth':
          endpoint = '/api/agent/growth'
          body.title = currentTitle
          body.tags = options.tags || []
          body.platform = options.platform || 'substack'
          break
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        const result: AgentResult = {
          type,
          content: type === 'growth' ? JSON.stringify(data.analysis, null, 2) : data.editedContent || data.developedContent || data.researchedContent,
          interactionId: data.interactionId
        }
        
        setResults(prev => [result, ...prev])
        setSelectedResult(result)
      } else {
        alert(`Agent failed: ${data.error}`)
      }
    } catch (error) {
      console.error(`${type} agent error:`, error)
      alert(`Failed to call ${type} agent`)
    } finally {
      setLoading(null)
    }
  }

  const applyResult = (result: AgentResult) => {
    if (result.type === 'growth') {
      // Growth agent results are displayed, not applied to content
      return
    }
    
    onContentUpdate(result.content)
    setSelectedResult(null)
  }

  const rateResult = async (result: AgentResult, rating: number) => {
    try {
      await fetch('/api/agent/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionId: result.interactionId,
          rating
        })
      })
    } catch (error) {
      console.error('Failed to submit rating:', error)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">AI Writing Agents</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Agent Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => callAgent('editor', { level: 1 })}
            disabled={loading !== null}
            className="flex items-center space-x-2 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition"
          >
            {loading === 'editor' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
            <span className="text-sm font-medium">E&R Level 1</span>
          </button>

          <button
            onClick={() => callAgent('editor', { level: 2 })}
            disabled={loading !== null}
            className="flex items-center space-x-2 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition"
          >
            {loading === 'editor' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
            <span className="text-sm font-medium">E&R Level 2</span>
          </button>

          <button
            onClick={() => callAgent('editor', { level: 3 })}
            disabled={loading !== null}
            className="flex items-center space-x-2 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition"
          >
            {loading === 'editor' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
            <span className="text-sm font-medium">E&R Level 3</span>
          </button>

          <button
            onClick={() => callAgent('writer')}
            disabled={loading !== null}
            className="flex items-center space-x-2 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50 transition"
          >
            {loading === 'writer' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenTool className="h-4 w-4" />}
            <span className="text-sm font-medium">Develop More</span>
          </button>

          <button
            onClick={() => callAgent('researcher')}
            disabled={loading !== null}
            className="flex items-center space-x-2 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition"
          >
            {loading === 'researcher' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="text-sm font-medium">Research More</span>
          </button>

          <button
            onClick={() => callAgent('growth')}
            disabled={loading !== null}
            className="flex items-center space-x-2 p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 disabled:opacity-50 transition"
          >
            {loading === 'growth' ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            <span className="text-sm font-medium">Growth Insights</span>
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Recent Results</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 uppercase">
                      {result.type} Agent
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => rateResult(result, 1)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => rateResult(result, -1)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-700 mb-2 max-h-20 overflow-y-auto">
                    {result.type === 'growth' ? (
                      <pre className="whitespace-pre-wrap">{result.content}</pre>
                    ) : (
                      result.content.substring(0, 200) + (result.content.length > 200 ? '...' : '')
                    )}
                  </div>
                  
                  {result.type !== 'growth' && (
                    <button
                      onClick={() => applyResult(result)}
                      className="text-xs bg-accent text-white px-2 py-1 rounded hover:bg-accent-hover transition"
                    >
                      Apply to Article
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Result Preview */}
        {selectedResult && selectedResult.type !== 'growth' && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
            <div className="p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto text-sm text-gray-700">
              {selectedResult.content}
            </div>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => applyResult(selectedResult)}
                className="text-sm bg-accent text-white px-3 py-1 rounded hover:bg-accent-hover transition"
              >
                Apply Changes
              </button>
              <button
                onClick={() => setSelectedResult(null)}
                className="text-sm text-gray-600 px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}