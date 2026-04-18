import type { Metadata } from 'next'
import './globals.css'
import AppProviders from '@/providers/app-providers'

export const metadata: Metadata = {
  title: 'COINCRAFT — 블록체인의 구조를 설계하는 사람들',
  description: 'Web3 아키텍처 교육, 온체인 분석, Custody 시스템 설계, 특허 전략을 통해 블록체인 산업의 전문가를 양성합니다.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: { url: '/icon.png', sizes: '512x512' },
  },
  openGraph: {
    title: 'COINCRAFT',
    description: 'Web3 · Blockchain · Education',
    url: 'https://coincraft.io',
    siteName: 'COINCRAFT',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
