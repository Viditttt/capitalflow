import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/layout/providers'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants'

export const metadata: Metadata = {
  title: `${APP_NAME} — Blockchain-Enabled SME Invoice Financing`,
  description: APP_DESCRIPTION,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg-base text-text-primary min-h-screen antialiased selection:bg-accent-primary/20 selection:text-accent-primary">
        <Providers>
          <div className="min-h-screen flex bg-bg-base">
            <Sidebar />
            <div className="flex-1 flex flex-col pl-[240px] transition-all duration-300 min-w-0">
              <Header />
              <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
