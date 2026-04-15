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

// ─── 공통 HTML 래퍼 ─────────────────────────────────────────────────────────

function wrap(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:sans-serif;color:#e2e8f0;">
<div style="max-width:560px;margin:40px auto;background:#1e293b;border-radius:12px;padding:40px;border:1px solid rgba(255,255,255,0.08);">
  <div style="margin-bottom:24px;">
    <span style="font-size:18px;font-weight:800;color:#f59e0b;letter-spacing:-0.5px;">CoinCraft</span>
  </div>
  <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#f1f5f9;">${title}</h2>
  ${body}
  <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:32px 0 20px;">
  <p style="margin:0;font-size:12px;color:#64748b;">코인크래프트 · coincraft.edu@gmail.com</p>
</div>
</body></html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#94a3b8;font-size:14px;width:120px;">${label}</td>
    <td style="padding:6px 0;color:#f1f5f9;font-size:14px;font-weight:600;">${value}</td>
  </tr>`;
}

// ─── 알림 이메일 ─────────────────────────────────────────────────────────────

export async function sendJoinEmail(to: string, name: string): Promise<void> {
  await sendEmail({
    to,
    subject: '[CoinCraft] 회원가입을 환영합니다!',
    html: wrap('회원가입 완료', `
      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">안녕하세요, <strong style="color:#f1f5f9;">${name}</strong>님.<br>
      코인크래프트 회원가입이 완료되었습니다.</p>
      <p style="color:#94a3b8;font-size:13px;line-height:1.7;">블록체인 · WEB3 전문가로 성장하는 여정을 함께하겠습니다.</p>
    `),
  }).catch(() => {});
}

export async function sendEnrollEmail(to: string, name: string, courseName: string): Promise<void> {
  await sendEmail({
    to,
    subject: `[CoinCraft] 수강 신청 완료 — ${courseName}`,
    html: wrap('수강 신청 완료', `
      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">안녕하세요, <strong style="color:#f1f5f9;">${name}</strong>님.<br>
      아래 강좌 수강 신청이 완료되었습니다.</p>
      <table style="border-collapse:collapse;margin:20px 0;">
        ${row('강좌명', courseName)}
      </table>
      <p style="color:#94a3b8;font-size:13px;">지금 바로 학습을 시작해보세요.</p>
    `),
  }).catch(() => {});
}

export async function sendExamRegistrationEmail(
  to: string, name: string, examTitle: string,
  examDateTime: string, registrationNumber: string, rulesUrl: string
): Promise<void> {
  await sendEmail({
    to,
    subject: '[CoinCraft] 시험 접수 완료',
    html: wrap('시험 접수 완료', `
      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">안녕하세요, <strong style="color:#f1f5f9;">${name}</strong>님.<br>
      ${examTitle} 접수가 완료되었습니다.</p>
      <table style="border-collapse:collapse;margin:20px 0;">
        ${row('수험번호', registrationNumber)}
        ${row('시험 일시', examDateTime)}
        ${row('시험 방식', '온라인 (별도 시험장 없음)')}
      </table>
      <div style="background:#0f172a;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#f59e0b;">■ 시험 당일 안내</p>
        <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.8;">
          · 시험 1시간 전: 접속 환경 테스트 필수<br>
          · 시험 30분 전: 신분증 확인 시작<br>
          · 시험 시작: 일제 시작 / 60분<br><br>
          시험 당일 오전 9시, 이 이메일로 시험 링크가 발송됩니다.
        </p>
      </div>
      <a href="${rulesUrl}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#0f172a;font-weight:700;text-decoration:none;border-radius:8px;font-size:14px;">시험 규정 확인 (필독)</a>
    `),
  }).catch(() => {});
}

export async function sendExamResultEmail(
  to: string, name: string, examTitle: string,
  result: '합격' | '불합격', score: number
): Promise<void> {
  const passed = result === '합격';
  await sendEmail({
    to,
    subject: `[CoinCraft] ${examTitle} 시험 결과 — ${result}`,
    html: wrap('시험 결과 안내', `
      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">안녕하세요, <strong style="color:#f1f5f9;">${name}</strong>님.<br>
      ${examTitle} 결과가 나왔습니다.</p>
      <table style="border-collapse:collapse;margin:20px 0;">
        ${row('결과', `<span style="color:${passed ? '#34d399' : '#f87171'};font-weight:800;">${result}</span>`)}
        ${row('점수', `${score}점`)}
      </table>
      ${passed
        ? '<p style="color:#94a3b8;font-size:13px;">인증서는 별도 안내드립니다.</p>'
        : '<p style="color:#94a3b8;font-size:13px;">다음 기회에 다시 도전해 주세요.</p>'
      }
    `),
  }).catch(() => {});
}

export async function sendCertIssuedEmail(
  to: string, name: string, certName: string,
  certNumber: string, issuedAt: Date
): Promise<void> {
  const dateStr = issuedAt.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  await sendEmail({
    to,
    subject: '[CoinCraft] 자격 인증서가 발급되었습니다',
    html: wrap('인증서 발급 완료', `
      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">안녕하세요, <strong style="color:#f1f5f9;">${name}</strong>님.<br>
      ${certName} 인증서가 발급되었습니다.</p>
      <table style="border-collapse:collapse;margin:20px 0;">
        ${row('자격증명', certName)}
        ${row('인증서 번호', certNumber)}
        ${row('발급일', dateStr)}
      </table>
      <p style="color:#94a3b8;font-size:13px;">인증서는 향후 온체인 기록 기반 검증 시스템으로 확장됩니다.</p>
    `),
  }).catch(() => {});
}

export async function sendEbookPurchaseEmail(
  to: string, name: string, ebookTitle: string, orderId: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `[CoinCraft] 전자책 구매 완료 — ${ebookTitle}`,
    html: wrap('전자책 구매 완료', `
      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">안녕하세요, <strong style="color:#f1f5f9;">${name}</strong>님.<br>
      ${ebookTitle} 구매가 완료되었습니다.</p>
      <table style="border-collapse:collapse;margin:20px 0;">
        ${row('도서명', ebookTitle)}
        ${row('주문번호', orderId)}
        ${row('수령 방법', '이메일 다운로드')}
      </table>
    `),
  }).catch(() => {});
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
