import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'cc-primary':    '#0A0A0F',
        'cc-secondary':  '#1A1A2E',
        'cc-accent':     '#F5A623',
        'cc-accent-dark':'#D4891A',
        'cc-text':       '#E8E8E8',
        'cc-muted':      '#9CA3AF',
      },
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans KR', 'sans-serif'],
      },
      borderRadius: {
        cc: '12px',
        'cc-lg': '20px',
      },
      maxWidth: {
        cc: '1200px',
      },
    },
  },
  plugins: [],
}

export default config
