import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SimpleAuthProvider } from '@/components/auth/SimpleAuthProvider'
import { FlavorProvider } from '@/components/flavors/FlavorProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Diddly - AI-Powered Writing Assistant',
  description: 'Create, edit, and publish amazing articles with AI-powered writing agents',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FlavorProvider>
          <SimpleAuthProvider>
            {children}
          </SimpleAuthProvider>
        </FlavorProvider>
      </body>
    </html>
  )
}