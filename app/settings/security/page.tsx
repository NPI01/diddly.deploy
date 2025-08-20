'use client'

import { useAuth } from '@/components/auth/SimpleAuthProvider'
import { useFlavor } from '@/components/flavors/FlavorProvider'
import { SecuritySettings } from '@/components/settings/SecuritySettings'
import { Settings, ArrowLeft, Shield } from 'lucide-react'
import Link from 'next/link'

export default function SecurityPage() {
  const { user } = useAuth()
  const { theme } = useFlavor()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to access security settings.</p>
          <Link href="/" className="text-primary hover:text-primary-hover">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-700 ${
      theme.id === 'purple-sherbert' 
        ? 'bg-gradient-to-br from-violet-50 via-white to-orange-50' 
        : 'bg-gradient-to-br from-gray-50 via-white to-pink-50'
    }`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              href="/settings"
              className={`flex items-center space-x-2 text-sm transition-colors ${
                theme.id === 'purple-sherbert'
                  ? 'text-violet-600 hover:text-violet-700'
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Settings</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${
              theme.id === 'purple-sherbert' 
                ? 'bg-gradient-to-r from-violet-500 to-orange-500' 
                : 'bg-gradient-to-r from-primary to-accent'
            }`}>
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${
                theme.id === 'purple-sherbert'
                  ? 'bg-gradient-to-r from-violet-600 to-orange-600 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'
              }`}>
                Security Settings
              </h1>
              <p className="text-gray-600 mt-1">Manage your account security and password</p>
            </div>
          </div>
        </div>

        {/* Security Settings Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <SecuritySettings />
        </div>
      </div>
    </div>
  )
}
