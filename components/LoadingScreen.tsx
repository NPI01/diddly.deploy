'use client'

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Diddly
          </h1>
          <p className="text-gray-600 mt-2 text-lg">AI-Powered Writing Assistant</p>
        </div>

        {/* Animated Loading Indicator */}
        <div className="relative">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-pink-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 animate-pulse">Loading your writing workspace...</p>
        </div>

        {/* Floating Elements Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-accent rounded-full animate-pulse opacity-20"></div>
          <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-primary rounded-full animate-pulse opacity-10 animation-delay-1000"></div>
          <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-accent rounded-full animate-pulse opacity-30 animation-delay-2000"></div>
        </div>
      </div>
    </div>
  )
}