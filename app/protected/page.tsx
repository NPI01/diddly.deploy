import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/logout-button'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Welcome to Diddly!
              </h1>
              <p className="text-gray-600 mt-2">Your writing assistant is ready to help</p>
            </div>
            <LogoutButton />
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Account</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">User ID:</span> {user.id}</p>
              <p><span className="font-medium">Account Created:</span> {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Get Started</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/write/new"
                className="block p-6 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <h4 className="font-semibold mb-2">Start Writing</h4>
                <p className="text-sm opacity-90">Create your first article with AI assistance</p>
              </a>
              
              <a
                href="/"
                className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
              >
                <h4 className="font-semibold mb-2 text-gray-900">View Dashboard</h4>
                <p className="text-sm text-gray-600">Manage your articles and projects</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}