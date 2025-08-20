'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/SimpleAuthProvider'
import { useFlavor } from '@/components/flavors/FlavorProvider'
import { Settings, User, Shield, CreditCard, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ProfileSettings } from '@/components/settings/ProfileSettings'
import { SecuritySettings } from '@/components/settings/SecuritySettings'
import { BillingSettings } from '@/components/settings/BillingSettings'

type SettingsTab = 'profile' | 'security' | 'billing'

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme } = useFlavor()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to access settings.</p>
          <Link href="/" className="text-primary hover:text-primary-hover">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'billing' as const, label: 'Billing', icon: CreditCard },
  ]

  return (
    <div className={`min-h-screen transition-colors duration-700 ${
      theme.id === 'purple-sherbert' 
        ? 'bg-gradient-to-br from-violet-50 via-white to-orange-50' 
        : 'bg-gradient-to-br from-gray-50 via-white to-pink-50'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              href="/"
              className={`flex items-center space-x-2 text-sm transition-colors ${
                theme.id === 'purple-sherbert'
                  ? 'text-violet-600 hover:text-violet-700'
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${
              theme.id === 'purple-sherbert' 
                ? 'bg-gradient-to-r from-violet-500 to-orange-500' 
                : 'bg-gradient-to-r from-primary to-accent'
            }`}>
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${
                theme.id === 'purple-sherbert'
                  ? 'bg-gradient-to-r from-violet-600 to-orange-600 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'
              }`}>
                Account Settings
              </h1>
              <p className="text-gray-600 mt-1">Manage your account preferences and security</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Settings</h3>
              </div>
              <nav className="p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? theme.id === 'purple-sherbert'
                            ? 'bg-gradient-to-r from-violet-100 to-orange-100 text-violet-700 border border-violet-200'
                            : 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'security' && <SecuritySettings />}
              {activeTab === 'billing' && <BillingSettings />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
