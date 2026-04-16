import cron from 'node-cron';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { certExams, examRegistrations, users } from '../db/schema';
import { sendEmail } from '../lib/email';

/**
 * PDF 자동 발송 스케줄러
 * 매일 09:00 실행
 * cert_exams.pdf_delivery_date가 오늘인 접수자 중 pdf_sent=false인 대상에게 발송
 */
async function deliverPdfs(): Promise<void> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  console.log(`[PDF Delivery] 실행: ${today}`);

  // 오늘 pdf 발송일인 활성 시험 조회
  const examsToday = await db
    .select({
      id: certExams.id,
      title: certExams.title,
      pdfFileUrl: certExams.pdfFileUrl,
      pdfDeliveryDate: certExams.pdfDeliveryDate,
    })
    .from(certExams)
    .where(
      and(
        eq(certExams.pdfDeliveryDate, today),
        eq(certExams.isActive, true)
      )
    );

  if (examsToday.length === 0) {
    console.log('[PDF Delivery] 오늘 발송 예정 시험 없음.');
    return;
  }

  for (const exam of examsToday) {
    if (!exam.pdfFileUrl) {
      console.warn(`[PDF Delivery] 시험 ${exam.id} (${exam.title}) — pdf_file_url 없음, 건너뜀`);
      continue;
    }

    // 해당 시험의 pdf_sent=false 접수자 조회
    const registrations = await db
      .select({
        id: examRegistrations.id,
        userId: examRegistrations.userId,
        applicantName: examRegistrations.applicantName,
        registrationNumber: examRegistrations.registrationNumber,
      })
      .from(examRegistrations)
      .where(
        and(
          eq(examRegistrations.examId, exam.id),
          eq(examRegistrations.pdfSent, false)
        )
      );

    console.log(`[PDF Delivery] 시험: ${exam.title} — 발송 대상 ${registrations.length}명`);

    for (const reg of registrations) {
      try {
        // 사용자 이메일 조회
        const [user] = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, reg.userId))
          .limit(1);

        if (!user?.email) continue;

        await sendEmail({
          to: user.email,
          subject: `[CoinCraft] ${exam.title} 시험 자료 발송`,
          html: `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:sans-serif;color:#e2e8f0;">
<div style="max-width:560px;margin:40px auto;background:#1e293b;border-radius:12px;padding:40px;border:1px solid rgba(255,255,255,0.08);">
  <div style="margin-bottom:24px;">
    <span style="font-size:18px;font-weight:800;color:#f59e0b;letter-spacing:-0.5px;">CoinCraft</span>
  </div>
  <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#f1f5f9;">시험 자료 발송</h2>
  <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">
    안녕하세요, <strong style="color:#f1f5f9;">${reg.applicantName ?? user.name}</strong>님.<br>
    ${exam.title} 시험 자료를 발송합니다.
  </p>
  <table style="border-collapse:collapse;margin:20px 0;">
    <tr>
      <td style="padding:6px 0;color:#94a3b8;font-size:14px;width:120px;">수험번호</td>
      <td style="padding:6px 0;color:#f1f5f9;font-size:14px;font-weight:600;">${reg.registrationNumber}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#94a3b8;font-size:14px;">시험명</td>
      <td style="padding:6px 0;color:#f1f5f9;font-size:14px;font-weight:600;">${exam.title}</td>
    </tr>
  </table>
  <a href="${exam.pdfFileUrl}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#0f172a;font-weight:700;text-decoration:none;border-radius:8px;font-size:14px;">시험 자료 다운로드</a>
  <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:32px 0 20px;">
  <p style="margin:0;font-size:12px;color:#64748b;">코인크래프트 · coincraft.edu@gmail.com</p>
</div>
</body></html>`,
        });

        // pdf_sent = true 업데이트
        await db
          .update(examRegistrations)
          .set({ pdfSent: true })
          .where(eq(examRegistrations.id, reg.id));

        console.log(`[PDF Delivery] 발송 완료: ${user.email} (${reg.registrationNumber})`);
      } catch (err) {
        console.error(`[PDF Delivery] 발송 실패: ${reg.id}`, err);
      }
    }
  }
}

/**
 * 스케줄러 등록 — 매일 09:00 실행
 */
export function registerPdfDeliveryJob(): void {
  cron.schedule('0 9 * * *', async () => {
    try {
      await deliverPdfs();
    } catch (err) {
      console.error('[PDF Delivery] 스케줄러 오류:', err);
    }
  }, {
    timezone: 'Asia/Seoul',
  });

  console.log('[PDF Delivery] 스케줄러 등록 완료 (매일 09:00 KST)');
}
