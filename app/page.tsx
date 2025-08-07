'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/SimpleAuthProvider'
import { AuthModal } from '@/components/auth/AuthModal'
import { Dashboard } from '@/components/Dashboard'
import { LoadingScreen } from '@/components/LoadingScreen'

export default function Home() {
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50">
          {/* Hero Section */}
          <div className="container mx-auto px-4 py-16">
            <div className="text-center max-w-4xl mx-auto">
              <div className="animate-fade-in">
                <h1 className="text-7xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Diddly
                  </span>
                </h1>
                <p className="text-2xl text-gray-600 mb-4">
                  AI-Powered Writing Assistant
                </p>
                <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
                  Create, edit, and publish amazing articles with intelligent AI agents. 
                  Built for Substack writers and content creators who want to write better, faster.
                </p>
              </div>

              <div className="animate-slide-up space-y-4">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Start Writing
                </button>
                
                <div className="flex items-center justify-center space-x-8 mt-16 text-gray-400">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">AI</span>
                    </div>
                    <p className="text-sm">Smart Agents</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-r from-accent to-pink-400 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">✍️</span>
                    </div>
                    <p className="text-sm">Clean Editor</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-r from-pink-400 to-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">📤</span>
                    </div>
                    <p className="text-sm">Multi-Platform</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="bg-white/50 backdrop-blur-sm border-t border-gray-100 py-16">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="text-center animate-slide-up">
                  <div className="bg-gradient-to-r from-primary to-accent p-4 rounded-2xl w-fit mx-auto mb-4">
                    <span className="text-white text-2xl">🤖</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">AI Writing Agents</h3>
                  <p className="text-gray-600">Edit & Revise, Develop Ideas, Research & Expand with intelligent AI assistance</p>
                </div>
                
                <div className="text-center animate-slide-up animation-delay-200">
                  <div className="bg-gradient-to-r from-accent to-pink-400 p-4 rounded-2xl w-fit mx-auto mb-4">
                    <span className="text-white text-2xl">📈</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Growth Optimization</h3>
                  <p className="text-gray-600">Optimize headlines, CTAs, and social media snippets for maximum engagement</p>
                </div>
                
                <div className="text-center animate-slide-up animation-delay-400">
                  <div className="bg-gradient-to-r from-pink-400 to-primary p-4 rounded-2xl w-fit mx-auto mb-4">
                    <span className="text-white text-2xl">🚀</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">One-Click Publishing</h3>
                  <p className="text-gray-600">Publish to Substack, Ghost, and Medium simultaneously with perfect formatting</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      </>
    )
  }

  return <Dashboard />
}