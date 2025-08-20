'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Article } from '@/lib/supabase'
import { useAuth } from '@/components/auth/SimpleAuthProvider'
import { useFlavorTheme } from '@/components/flavors/FlavorProvider'
import { FlavorSelector } from '@/components/flavors/FlavorSelector'
import { ThemeWrapper } from '@/components/flavors/ThemeWrapper'
import { Plus, FileText, Calendar, TrendingUp, Search, Filter } from 'lucide-react'
import { UserDropdown } from '@/components/UserDropdown'

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { theme } = useFlavorTheme()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user?.id) {
      loadArticles()
    }
  }, [filter, user?.id])

  const loadArticles = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      let query = supabase
        .from('articles')
        .select('*')
        .eq('user_id', user?.id) // Only load user's articles
        .order('updated_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      console.log('Dashboard: Loaded articles:', data)
      setArticles(data || [])
    } catch (error) {
      console.error('Failed to load articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewArticle = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      console.log('Dashboard: Creating article for user:', user.id)

      const { data, error } = await supabase
        .from('articles')
        .insert({
          title: 'Untitled Article',
          content: '',
          status: 'draft',
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Dashboard: Article creation error:', error)
        throw error
      }
      
      console.log('Dashboard: Article created:', data)
      
      // Navigate to the new article
      window.location.href = `/write/${data.id}`
    } catch (error) {
      console.error('Failed to create article:', error)
      alert('Failed to create new article')
    }
  }

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    
    return date.toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ThemeWrapper>
      {/* Header */}
      <div className={`backdrop-blur-sm border-b sticky top-0 z-10 transition-all duration-700 ${
        theme.id === 'purple-sherbert' 
          ? 'bg-violet-900/40 border-violet-500/30' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="animate-fade-in">
                <h1 className={`text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent transition-all duration-700 ${
                  theme.id === 'purple-sherbert' 
                    ? 'from-violet-300 to-orange-400' 
                    : 'from-primary to-accent'
                } ${theme.animations.glow ? 'animate-glow-pulse' : ''}`}>
                  Diddly
                </h1>
                <p className={`mt-1 transition-colors duration-700 ${
                  theme.id === 'purple-sherbert' ? 'text-violet-200' : 'text-gray-600'
                }`}>
                  Create, edit, and publish your articles with AI assistance
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <FlavorSelector />
                <UserDropdown />
                
                <button
                  onClick={createNewArticle}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl animate-slide-up ${
                    theme.id === 'purple-sherbert'
                      ? 'bg-gradient-to-r from-violet-500 to-orange-500 hover:from-violet-400 hover:to-orange-400 text-white shadow-violet-500/30 hover:shadow-orange-500/40'
                      : 'bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover text-white'
                  } ${theme.animations.glow && theme.id === 'purple-sherbert' ? 'animate-glow-pulse' : ''}`}
                >
                  <Plus className="h-5 w-5" />
                  <span>New Article</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-accent focus:border-accent"
              >
                <option value="all">All Articles</option>
                <option value="draft">Drafts</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent"
            />
          </div>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading articles...</p>
            </div>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? 'Try a different search term' : 'Get started by creating your first article'}
            </p>
            {!searchQuery && (
              <button
                onClick={createNewArticle}
                className="flex items-center space-x-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition mx-auto"
              >
                <Plus className="h-5 w-5" />
                <span>Create First Article</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                href={`/write/${article.id}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(article.status)}`}>
                      {article.status}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(article.updated_at)}</span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {article.title || 'Untitled Article'}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {article.content || 'No content yet...'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>{article.word_count} words</span>
                      {article.tags?.length > 0 && (
                        <span>{article.tags.length} tags</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(article.created_at)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {!loading && articles.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">
                    {articles.length}
                  </p>
                  <p className="text-gray-600">Total Articles</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">
                    {articles.filter(a => a.status === 'published').length}
                  </p>
                  <p className="text-gray-600">Published</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">
                    {articles.reduce((sum, article) => sum + article.word_count, 0).toLocaleString()}
                  </p>
                  <p className="text-gray-600">Total Words</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ThemeWrapper>
  )
}