import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  KAKAO_REST_API_KEY: z.string().optional(),
  KAKAO_CLIENT_SECRET: z.string().optional(),
  KAKAO_REDIRECT_URI: z.string().optional(),
  NAVER_CLIENT_ID: z.string().optional(),
  NAVER_CLIENT_SECRET: z.string().optional(),
  NAVER_REDIRECT_URI: z.string().optional(),
  PORTONE_IMP_KEY: z.string().optional(),
  PORTONE_IMP_SECRET: z.string().optional(),
  PORTONE_STORE_ID: z.string().optional(),
  PORTONE_WEBHOOK_SECRET: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().default('coincraft-media'),
  S3_ENDPOINT: z.string().default('https://hel1.your-objectstorage.com'),
  S3_REGION: z.string().default('eu-central-1'),
  S3_BUCKET: z.string().default('coincraft-uploads'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  SOLAPI_API_KEY: z.string().optional(),
  SOLAPI_API_SECRET: z.string().optional(),
  SOLAPI_SENDER_KEY: z.string().optional(),
  GMAIL_USER: z.string().email().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
  VIMEO_ACCESS_TOKEN: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
