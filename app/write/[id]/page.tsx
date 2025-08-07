'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Article } from '@/lib/supabase'
import { Editor } from '@/components/Editor'
import { Loader2 } from 'lucide-react'

export default function WritePage() {
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      loadArticle(params.id as string)
    }
  }, [params.id])

  const loadArticle = async (id: string) => {
    try {
      const supabase = createClient()
      console.log('WritePage: Loading article:', id)
      
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single()

      console.log('WritePage: Article query result:', { data: !!data, error })

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Article not found')
        } else {
          throw error
        }
        return
      }

      setArticle(data)
    } catch (error) {
      console.error('Failed to load article:', error)
      setError('Failed to load article')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = (updatedArticle: Article) => {
    setArticle(updatedArticle)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-editor-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-editor-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Article not found'}
          </h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <Editor article={article} onSave={handleSave} />
}