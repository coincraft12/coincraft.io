export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
} as const;
