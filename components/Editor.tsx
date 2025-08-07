'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Article } from '@/lib/supabase'
import { AgentPanel } from './AgentPanel'
import { PublishPanel } from './PublishPanel'
import { Loader2, Save } from 'lucide-react'

interface EditorProps {
  article: Article
  onSave?: (article: Article) => void
}

export function Editor({ article, onSave }: EditorProps) {
  const [title, setTitle] = useState(article.title)
  const [content, setContent] = useState(article.content)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [wordCount, setWordCount] = useState(0)
  const [showAgentPanel, setShowAgentPanel] = useState(false)
  const [showPublishPanel, setShowPublishPanel] = useState(false)
  
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Auto-save functionality
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleAutoSave()
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [title, content])

  // Update word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0)
    setWordCount(words.length)
  }, [content])

  const handleAutoSave = async () => {
    if (title === article.title && content === article.content) {
      return // No changes to save
    }

    setIsSaving(true)
    
    try {
      const { data, error } = await supabase
        .from('articles')
        .update({
          title,
          content,
          word_count: wordCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', article.id)
        .select()
        .single()

      if (error) throw error

      setLastSaved(new Date())
      if (onSave && data) {
        onSave(data)
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleManualSave = async () => {
    await handleAutoSave()
  }

  const handleContentUpdate = (newContent: string) => {
    setContent(newContent)
    if (contentRef.current) {
      contentRef.current.value = newContent
    }
  }

  const formatLastSaved = () => {
    if (!lastSaved) return 'Not saved'
    const now = new Date()
    const diff = now.getTime() - lastSaved.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes === 0) return 'Saved just now'
    if (minutes === 1) return 'Saved 1 minute ago'
    return `Saved ${minutes} minutes ago`
  }

  return (
    <div className="min-h-screen bg-editor-bg">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Writing Assistant</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{formatLastSaved()}</span>
                <span>•</span>
                <span>{wordCount} words</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleManualSave}
                disabled={isSaving}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
              
              <button
                onClick={() => setShowAgentPanel(!showAgentPanel)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  showAgentPanel
                    ? 'bg-accent text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                AI Agents
              </button>
              
              <button
                onClick={() => setShowPublishPanel(!showPublishPanel)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  showPublishPanel
                    ? 'bg-green-600 text-white'
                    : 'text-white bg-green-600 hover:bg-green-700'
                }`}
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Input */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article title..."
                className="w-full text-3xl font-serif font-bold text-editor-text bg-transparent border-none outline-none placeholder-gray-400 resize-none"
                style={{ lineHeight: '1.2' }}
              />
            </div>

            {/* Content Editor */}
            <div className="min-h-[600px]">
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your article..."
                className="w-full h-full min-h-[600px] text-lg font-serif leading-relaxed text-editor-text bg-transparent border-none outline-none placeholder-gray-400 resize-none"
                style={{ lineHeight: '1.6' }}
              />
            </div>
          </div>

          {/* Side Panels */}
          <div className="space-y-6">
            {showAgentPanel && (
              <AgentPanel
                articleId={article.id}
                currentContent={content}
                currentTitle={title}
                onContentUpdate={handleContentUpdate}
                onClose={() => setShowAgentPanel(false)}
              />
            )}
            
            {showPublishPanel && (
              <PublishPanel
                articleId={article.id}
                title={title}
                content={content}
                onClose={() => setShowPublishPanel(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}