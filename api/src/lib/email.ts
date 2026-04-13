import { env } from '../config/env';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  if (!env.SENDGRID_API_KEY) {
    console.log(`[Email stub] To: ${to} | Subject: ${subject}`);
    return;
  }
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: env.SENDGRID_FROM_EMAIL },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SendGrid error ${res.status}: ${text}`);
  }
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const url = `${env.FRONTEND_URL}/auth/verify-email?token=${token}`;
  await sendEmail({
    to,
    subject: '[CoinCraft] 이메일 주소를 인증해 주세요',
    html: `
      <h2>CoinCraft 이메일 인증</h2>
      <p>아래 링크를 클릭하여 이메일 주소를 인증해 주세요. (유효시간 24시간)</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#F59E0B;color:#fff;text-decoration:none;border-radius:6px;">이메일 인증하기</a>
      <p>링크가 작동하지 않으면 아래 URL을 브라우저에 붙여넣으세요:</p>
      <p>${url}</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const url = `${env.FRONTEND_URL}/auth/reset-password?token=${token}`;
  await sendEmail({
    to,
    subject: '[CoinCraft] 비밀번호 재설정',
    html: `
      <h2>CoinCraft 비밀번호 재설정</h2>
      <p>아래 링크를 클릭하여 비밀번호를 재설정해 주세요. (유효시간 15분)</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#F59E0B;color:#fff;text-decoration:none;border-radius:6px;">비밀번호 재설정</a>
      <p>본인이 요청하지 않았다면 이 이메일을 무시해 주세요.</p>
    `,
  });
}
