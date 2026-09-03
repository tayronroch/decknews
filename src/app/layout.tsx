import './globals.css'

import type { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Decknews - MiniBlog',
  description:
    'Plataforma MiniBlog desenvolvida com Next.js, React e TypeScript',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-900 font-sans text-slate-50 antialiased">
        {children}
      </body>
    </html>
  )
}
