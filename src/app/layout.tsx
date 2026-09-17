import './globals.css'

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ReactNode } from 'react'

import { NavigationProgressBar } from '@/components/layout'
import { ThemeProvider } from '@/components/theme'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Decknews / notas sobre tecnologia',
  description:
    'Notas, ideias e experiências sobre tecnologia, redes, infraestrutura e desenvolvimento.',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="pt-BR"
      className={cn(geistSans.variable, geistMono.variable)}
      suppressHydrationWarning
    >
      <body
        className="bg-background text-foreground selection:text-foreground min-h-screen font-sans antialiased selection:bg-[#879b8f]/20"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NavigationProgressBar />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
