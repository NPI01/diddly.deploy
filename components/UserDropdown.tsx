'use client'

import { useState, useRef, useEffect } from 'react'
import { User, Settings, LogOut, ChevronDown, CreditCard, Shield, UserCircle } from 'lucide-react'
import { useAuth } from '@/components/auth/SimpleAuthProvider'
import { useFlavor } from '@/components/flavors/FlavorProvider'
import Link from 'next/link'

export function UserDropdown() {
  const { user, signOut } = useAuth()
  const { theme } = useFlavor()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (!user) return null

  const userDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-opacity-10 ${
          theme.id === 'purple-sherbert' 
            ? 'text-violet-200 hover:bg-violet-300' 
            : 'text-gray-600 hover:bg-gray-200'
        }`}
      >
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-full ${
            theme.id === 'purple-sherbert' 
              ? 'bg-gradient-to-r from-violet-500 to-orange-500' 
              : 'bg-gradient-to-r from-primary to-accent'
          }`}>
            <User className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium">{userDisplayName}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute right-0 mt-2 w-64 rounded-xl shadow-xl border backdrop-blur-sm z-50 ${
            theme.id === 'purple-sherbert'
              ? 'bg-white/90 border-violet-200'
              : 'bg-white/95 border-gray-200'
          }`}
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* User Info Header */}
          <div className={`px-4 py-3 border-b ${
            theme.id === 'purple-sherbert' ? 'border-violet-100' : 'border-gray-100'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                theme.id === 'purple-sherbert' 
                  ? 'bg-gradient-to-r from-violet-500 to-orange-500' 
                  : 'bg-gradient-to-r from-primary to-accent'
              }`}>
                <UserCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{userDisplayName}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/settings"
              className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                theme.id === 'purple-sherbert'
                  ? 'text-gray-700 hover:bg-violet-50 hover:text-violet-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-4 w-4" />
              <span>Account Settings</span>
            </Link>

            <Link
              href="/settings/security"
              className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                theme.id === 'purple-sherbert'
                  ? 'text-gray-700 hover:bg-violet-50 hover:text-violet-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </Link>

            <Link
              href="/settings/billing"
              className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                theme.id === 'purple-sherbert'
                  ? 'text-gray-700 hover:bg-violet-50 hover:text-violet-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <CreditCard className="h-4 w-4" />
              <span>Billing & Subscription</span>
            </Link>

            <div className={`border-t my-2 ${
              theme.id === 'purple-sherbert' ? 'border-violet-100' : 'border-gray-100'
            }`} />

            <button
              onClick={() => {
                setIsOpen(false)
                signOut()
              }}
              className={`flex items-center space-x-3 w-full px-4 py-3 text-sm transition-colors ${
                theme.id === 'purple-sherbert'
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
