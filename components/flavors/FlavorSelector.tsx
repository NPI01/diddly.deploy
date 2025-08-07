'use client'

import { useState, useRef, useEffect } from 'react'
import { useFlavorTheme } from './FlavorProvider'
import { ChevronDown, Palette } from 'lucide-react'

export function FlavorSelector() {
  const { currentFlavor, theme, setFlavor, availableFlavors } = useFlavorTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentTheme = availableFlavors.find(f => f.id === currentFlavor)!

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 
          ${theme.id === 'purple-sherbert' 
            ? 'bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-100 shadow-lg shadow-violet-500/20' 
            : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 shadow-md'
          }
          ${theme.animations.glow ? 'hover:shadow-violet-500/40' : 'hover:shadow-lg'}
          transform hover:scale-105
        `}
      >
        <Palette className="w-4 h-4" />
        <span className="text-sm font-medium">FLAVOR</span>
        <span className="text-lg">{currentTheme.icon}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`
            absolute top-full mt-2 right-0 w-64 rounded-2xl shadow-2xl border backdrop-blur-sm z-50
            ${theme.id === 'purple-sherbert'
              ? 'bg-violet-900/90 border-violet-500/30 shadow-violet-500/20'
              : 'bg-white/95 border-gray-200 shadow-gray-200/50'
            }
            animate-slide-down
          `}
        >
          <div className="p-4">
            <div className="text-xs font-semibold tracking-wider mb-3 opacity-60">
              CHOOSE YOUR FLAVOR
            </div>
            
            <div className="space-y-2">
              {availableFlavors.map((flavor) => {
                const isSelected = flavor.id === currentFlavor
                
                return (
                  <button
                    key={flavor.id}
                    onClick={() => {
                      setFlavor(flavor.id)
                      setIsOpen(false)
                    }}
                    className={`
                      w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300
                      ${isSelected
                        ? theme.id === 'purple-sherbert'
                          ? 'bg-violet-500/30 border border-violet-400/50 shadow-lg shadow-violet-500/20'
                          : 'bg-pink-50 border border-pink-200 shadow-md'
                        : theme.id === 'purple-sherbert'
                          ? 'hover:bg-violet-500/20 border border-transparent hover:border-violet-500/30'
                          : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                      }
                      ${flavor.animations.glow && theme.id === 'purple-sherbert' ? 'hover:shadow-violet-500/30' : ''}
                      transform hover:scale-105
                    `}
                  >
                    <span className="text-2xl">{flavor.icon}</span>
                    <div className="flex-1 text-left">
                      <div className={`font-semibold ${isSelected ? 'opacity-100' : 'opacity-80'}`}>
                        {flavor.name}
                      </div>
                      <div className="text-xs opacity-60">
                        {flavor.id === 'vanilla-bean' 
                          ? 'Classic minimal design'
                          : 'Futuristic glowing interface'
                        }
                      </div>
                    </div>
                    {isSelected && (
                      <div className={`
                        w-2 h-2 rounded-full 
                        ${theme.id === 'purple-sherbert' ? 'bg-orange-400' : 'bg-pink-500'}
                        ${flavor.animations.glow ? 'shadow-lg shadow-orange-400/50 animate-pulse' : ''}
                      `} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}