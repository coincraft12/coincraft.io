import type { Metadata } from 'next'
import './globals.css'
import AppProviders from '@/providers/app-providers'

export const metadata: Metadata = {
  metadataBase: new URL('https://coincraft.io'),
  title: 'COINCRAFT — AI 시대의 Web3 신뢰를 설계하는 사람들',
  description: 'Web3 구조설계 교육·인증, 온체인 리서치, AI 에이전트 신뢰 설계를 통해 블록체인 산업의 미래를 만들어갑니다.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: { url: '/icon.png', sizes: '512x512' },
  },
  openGraph: {
    title: 'COINCRAFT — Architect of the WEB3 Era',
    description: 'Web3 구조설계 교육·인증, 온체인 리서치, AI 에이전트 신뢰 설계.',
    url: 'https://coincraft.io',
    siteName: 'COINCRAFT',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'COINCRAFT' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.jpg'],
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
