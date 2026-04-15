import { createHmac, randomUUID } from 'crypto';
import { env } from '../config/env';

// ─── Solapi KakaoTalk 알림톡 ───────────────────────────────────────────────────

function makeAuthHeader(): string {
  const date = new Date().toISOString();
  const salt = randomUUID();
  const signature = createHmac('sha256', env.SOLAPI_API_SECRET!)
    .update(date + salt)
    .digest('hex');
  return `HMAC-SHA256 apiKey=${env.SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
}

export async function sendAlimtalk(
  to: string,
  templateId: string,
  variables: Record<string, string>
): Promise<void> {
  if (!env.SOLAPI_API_KEY || !env.SOLAPI_API_SECRET || !env.SOLAPI_SENDER_KEY) return;

  const phone = to.replace(/[^0-9]/g, '');
  if (!phone || phone.length < 10) return;

  try {
    await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': makeAuthHeader(),
      },
      body: JSON.stringify({
        message: {
          to: phone,
          kakaoOptions: {
            pfId: env.SOLAPI_SENDER_KEY,
            templateId,
            variables,
          },
        },
      }),
    });
  } catch {
    // 알림톡 실패는 결제/등록 흐름에 영향 없이 무시
  }
}
