import cron from 'node-cron';
import { and, isNotNull, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import { certificates, users } from '../db/schema';
import { sendEmail } from '../lib/email';

/**
 * 자격증 만료 30일 전 이메일 알림 스케줄러
 * 매일 09:00 KST (UTC 00:00) 실행
 * expiresAt이 오늘 ~ 30일 후인 자격증 보유자에게 만료 안내 이메일 발송
 */
async function notifyCertExpiry(): Promise<void> {
  const now = new Date();
  console.log(`[CertExpiry] 실행: ${now.toISOString()}`);

  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  // expiresAt BETWEEN now AND now + 30 days
  const expiringCerts = await db
    .select({
      id: certificates.id,
      certNumber: certificates.certNumber,
      level: certificates.level,
      expiresAt: certificates.expiresAt,
      userId: certificates.userId,
      userName: users.name,
      userEmail: users.email,
      userPhone: users.phone,
    })
    .from(certificates)
    .innerJoin(users, sql`${certificates.userId} = ${users.id}`)
    .where(
      and(
        isNotNull(certificates.expiresAt),
        gte(certificates.expiresAt, now),
        lte(certificates.expiresAt, thirtyDaysLater)
      )
    );

  if (expiringCerts.length === 0) {
    console.log('[CertExpiry] 만료 예정 자격증 없음.');
    return;
  }

  console.log(`[CertExpiry] 만료 예정 자격증 ${expiringCerts.length}건 발송 시작`);

  for (const cert of expiringCerts) {
    try {
      if (!cert.userEmail) continue;

      const expiresAt = cert.expiresAt!;
      const diffMs = expiresAt.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const expireDateStr = expiresAt.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      const levelLabel: Record<string, string> = {
        basic: 'Basic',
        associate: 'Associate',
        professional: 'Professional',
      };
      const certName = `CoinCraft WEB3 ${levelLabel[cert.level] ?? cert.level} 자격증`;

      await sendEmail({
        to: cert.userEmail,
        subject: `[CoinCraft] 자격증 만료 ${daysLeft}일 전 안내 — ${certName}`,
        html: `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:sans-serif;color:#e2e8f0;">
<div style="max-width:560px;margin:40px auto;background:#1e293b;border-radius:12px;padding:40px;border:1px solid rgba(255,255,255,0.08);">
  <div style="margin-bottom:24px;">
    <span style="font-size:18px;font-weight:800;color:#f59e0b;letter-spacing:-0.5px;">CoinCraft</span>
  </div>
  <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#f1f5f9;">자격증 만료 안내</h2>
  <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">
    안녕하세요, <strong style="color:#f1f5f9;">${cert.userName ?? '회원'}</strong>님.<br>
    보유하신 자격증이 <strong style="color:#f59e0b;">${daysLeft}일 후</strong> 만료될 예정입니다.
  </p>
  <table style="border-collapse:collapse;margin:20px 0;">
    <tr>
      <td style="padding:6px 0;color:#94a3b8;font-size:14px;width:120px;">자격증명</td>
      <td style="padding:6px 0;color:#f1f5f9;font-size:14px;font-weight:600;">${certName}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#94a3b8;font-size:14px;">인증서 번호</td>
      <td style="padding:6px 0;color:#f1f5f9;font-size:14px;font-weight:600;">${cert.certNumber}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#94a3b8;font-size:14px;">만료 일자</td>
      <td style="padding:6px 0;color:#f87171;font-size:14px;font-weight:600;">${expireDateStr} (${daysLeft}일 후)</td>
    </tr>
  </table>
  <p style="color:#94a3b8;font-size:13px;line-height:1.7;">
    자격증 갱신을 원하시면 CoinCraft 홈페이지에서 재시험 접수를 진행해 주세요.
  </p>
  <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:32px 0 20px;">
  <p style="margin:0;font-size:12px;color:#64748b;">코인크래프트 · coincraft.edu@gmail.com</p>
</div>
</body></html>`,
      });

      console.log(`[CertExpiry] 발송 완료: ${cert.userEmail} — ${cert.certNumber} (${daysLeft}일 후 만료)`);
    } catch (err) {
      console.error(`[CertExpiry] 발송 실패: ${cert.id}`, err);
    }
  }
}

/**
 * 스케줄러 등록 — 매일 09:00 KST (UTC 00:00) 실행
 */
export function registerCertExpiryNotifierJob(): void {
  // '0 0 * * *' = UTC 00:00 = KST 09:00
  cron.schedule('0 0 * * *', async () => {
    try {
      await notifyCertExpiry();
    } catch (err) {
      console.error('[CertExpiry] 스케줄러 오류:', err);
    }
  });

  console.log('[CertExpiry] 스케줄러 등록 완료 (매일 09:00 KST)');
}
