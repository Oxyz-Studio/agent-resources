import type { Metadata } from 'next'
import { Fraunces, Archivo, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const display = Fraunces({ variable: '--ff-display', subsets: ['latin'] })
const sans = Archivo({ variable: '--ff-sans', subsets: ['latin'] })
const mono = JetBrains_Mono({ variable: '--ff-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Agent Resources',
  description: 'HR is for humans. Agent Resources is for agents — hire, manage, and fire the agents you put in production.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
