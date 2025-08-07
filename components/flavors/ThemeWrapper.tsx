'use client'

import { ReactNode } from 'react'
import { useFlavorTheme } from './FlavorProvider'

interface ThemeWrapperProps {
  children: ReactNode
  className?: string
}

export function ThemeWrapper({ children, className = '' }: ThemeWrapperProps) {
  const { theme } = useFlavorTheme()

  return (
    <div 
      className={`
        min-h-screen transition-all duration-700 ease-in-out
        ${theme.id === 'purple-sherbert' 
          ? `bg-gradient-to-br ${theme.colors.background} text-gray-100` 
          : `bg-gradient-to-br ${theme.colors.background} text-gray-900`
        }
        ${className}
      `}
      style={{
        '--theme-primary': theme.colors.primary,
        '--theme-secondary': theme.colors.secondary,
        '--theme-accent': theme.colors.accent,
        '--theme-glow': theme.colors.glow,
      } as React.CSSProperties}
    >
      {children}
      
      {/* Purple Sherbert ambient effects */}
      {theme.id === 'purple-sherbert' && (
        <>
          {/* Floating particles */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`
                  absolute w-1 h-1 bg-violet-400/30 rounded-full
                  animate-float
                `}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.8}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
          
          {/* Ambient glow */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}} />
          </div>
        </>
      )}
    </div>
  )
}