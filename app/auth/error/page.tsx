import { Suspense } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

function ErrorContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="mb-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
            <p className="text-gray-600">
              There was an issue with your authentication. Please try again.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/auth/login"
              className="block w-full bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Back to Login
            </Link>
            
            <Link
              href="/auth/sign-up"
              className="block w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Create New Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}