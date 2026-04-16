import nodemailer from 'nodemailer';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'coincraft.edu@gmail.com';

function createTransporter() {
  // SMTP_* 또는 GMAIL_* 둘 다 지원
  const host = process.env.SMTP_HOST ?? 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER ?? process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS ?? process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  } as Parameters<typeof nodemailer.createTransport>[0]);
}

/**
 * 관리자에게 알림 이메일 발송
 * @param subject 이메일 제목
 * @param body    HTML 본문
 */
export async function sendAdminNotification(subject: string, body: string): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[Admin Notify stub] Subject: ${subject}`);
    return;
  }

  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:sans-serif;color:#e2e8f0;">
<div style="max-width:560px;margin:40px auto;background:#1e293b;border-radius:12px;padding:40px;border:1px solid rgba(255,255,255,0.08);">
  <div style="margin-bottom:24px;">
    <span style="font-size:18px;font-weight:800;color:#f59e0b;letter-spacing:-0.5px;">CoinCraft Admin</span>
  </div>
  <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#f1f5f9;">${subject}</h2>
  <div style="color:#cbd5e1;font-size:15px;line-height:1.7;">${body}</div>
  <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:32px 0 20px;">
  <p style="margin:0;font-size:12px;color:#64748b;">CoinCraft 관리자 알림 · 자동 발송</p>
</div>
</body></html>`;

  await transporter.sendMail({
    from: `"CoinCraft Admin" <${process.env.SMTP_USER}>`,
    to: ADMIN_EMAIL,
    subject: `[관리자 알림] ${subject}`,
    html,
  });
}
