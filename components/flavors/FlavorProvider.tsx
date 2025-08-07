'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type FlavorType = 'vanilla-bean' | 'purple-sherbert'

interface FlavorTheme {
  id: FlavorType
  name: string
  icon: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    glow?: string
  }
  animations: {
    glow: boolean
    floating: boolean
    gradient: boolean
  }
}

export const FLAVORS: Record<FlavorType, FlavorTheme> = {
  'vanilla-bean': {
    id: 'vanilla-bean',
    name: 'Vanilla Bean',
    icon: '🤍',
    colors: {
      primary: '#000000',
      secondary: '#1f1f1f',
      accent: '#ec4899',
      background: 'from-gray-50 to-pink-50',
      surface: 'white',
      text: '#1a1a1a',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      glow: '#ec4899'
    },
    animations: {
      glow: false,
      floating: false,
      gradient: true
    }
  },
  'purple-sherbert': {
    id: 'purple-sherbert',
    name: 'Purple Sherbert',
    icon: '🟣',
    colors: {
      primary: '#8b5cf6',
      secondary: '#a855f7',
      accent: '#f97316',
      background: 'from-violet-950 via-purple-900 to-orange-900',
      surface: 'rgba(139, 92, 246, 0.1)',
      text: '#e5e7eb',
      textSecondary: '#a1a1aa',
      border: 'rgba(139, 92, 246, 0.3)',
      glow: '#8b5cf6'
    },
    animations: {
      glow: true,
      floating: true,
      gradient: true
    }
  }
}

interface FlavorContextType {
  currentFlavor: FlavorType
  theme: FlavorTheme
  setFlavor: (flavor: FlavorType) => void
  availableFlavors: FlavorTheme[]
}

const FlavorContext = createContext<FlavorContextType | undefined>(undefined)

export function useFlavorTheme() {
  const context = useContext(FlavorContext)
  if (context === undefined) {
    throw new Error('useFlavorTheme must be used within a FlavorProvider')
  }
  return context
}

interface FlavorProviderProps {
  children: ReactNode
}

export function FlavorProvider({ children }: FlavorProviderProps) {
  const [currentFlavor, setCurrentFlavor] = useState<FlavorType>('vanilla-bean')

  // Load saved flavor from localStorage
  useEffect(() => {
    const savedFlavor = localStorage.getItem('diddly-flavor') as FlavorType
    if (savedFlavor && FLAVORS[savedFlavor]) {
      setCurrentFlavor(savedFlavor)
    }
  }, [])

  // Save flavor to localStorage
  const setFlavor = (flavor: FlavorType) => {
    setCurrentFlavor(flavor)
    localStorage.setItem('diddly-flavor', flavor)
  }

  const theme = FLAVORS[currentFlavor]
  const availableFlavors = Object.values(FLAVORS)

  return (
    <FlavorContext.Provider value={{ currentFlavor, theme, setFlavor, availableFlavors }}>
      {children}
    </FlavorContext.Provider>
  )
}