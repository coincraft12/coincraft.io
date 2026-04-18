import nodemailer from 'nodemailer';
import { env } from '../config/env';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

function createTransporter() {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587 as number,
    secure: false,
    family: 4 as number,
    auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
    tls: { rejectUnauthorized: false },
  } as Parameters<typeof nodemailer.createTransport>[0]);
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[Email stub] To: ${to} | Subject: ${subject}`);
    return;
  }
  await transporter.sendMail({
    from: `"CoinCraft" <${env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
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

export async function sendVbankEmail(
  to: string, name: string, courseName: string,
  bankName: string, bankAccount: string, bankHolder: string,
  amount: number, expiry: string
): Promise<void> {
  await sendEmail({
    to,
    subject: '[CoinCraft] 가상계좌가 발급되었습니다',
    html: wrap('가상계좌 발급 완료', `
      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">안녕하세요, <strong style="color:#f1f5f9;">${name}</strong>님.<br>
      <strong style="color:#f1f5f9;">${courseName}</strong> 결제를 위한 가상계좌가 발급되었습니다.</p>
      <table style="border-collapse:collapse;margin:20px 0;">
        ${row('은행', bankName)}
        ${row('계좌번호', bankAccount)}
        ${row('예금주', bankHolder)}
        ${row('입금 금액', `${amount.toLocaleString()}원`)}
        ${row('입금 기한', expiry)}
      </table>
      <div style="background:#0f172a;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.8;">
          · 입금 기한 내 미입금 시 주문이 자동 취소됩니다.<br>
          · 입금 확인 후 자동으로 수강이 시작됩니다.
        </p>
      </div>
    `),
  }).catch(() => {});
}

export async function sendBankTransferEmail(
  to: string, name: string, courseName: string, amount: number
): Promise<void> {
  await sendEmail({
    to,
    subject: '[CoinCraft] 무통장 입금 신청이 접수되었습니다',
    html: wrap('무통장 입금 안내', `
      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">안녕하세요, <strong style="color:#f1f5f9;">${name}</strong>님.<br>
      무통장 입금 신청이 접수되었습니다. 아래 계좌로 입금해 주세요.</p>
      <table style="border-collapse:collapse;margin:20px 0;">
        ${row('은행', '하나은행')}
        ${row('계좌번호', '398-910040-13304')}
        ${row('예금주', '(주)코인크래프트')}
        ${row('입금 금액', `${amount.toLocaleString()}원`)}
        ${row('강좌명', courseName)}
      </table>
      <div style="background:#0f172a;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#f59e0b;">■ 입금 안내</p>
        <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.8;">
          · 입금자명을 <strong style="color:#f1f5f9;">가입 시 이름(${name})</strong>과 동일하게 입력해 주세요.<br>
          · 확인은 영업일 기준 1~2일 내 처리됩니다.<br>
          · 입금 확인 후 수강 처리 완료 알림이 발송됩니다.
        </p>
      </div>
      <p style="color:#64748b;font-size:13px;">문의: <a href="mailto:coincraft.edu@gmail.com" style="color:#f59e0b;">coincraft.edu@gmail.com</a></p>
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

export async function sendAdminPaymentNotificationEmail(params: {
  userName: string;
  userEmail: string;
  productType: string;
  productName: string;
  amount: number;
  provider: string;
  adminUrl: string;
}): Promise<void> {
  const { userName, userEmail, productType, productName, amount, provider, adminUrl } = params;
  const productLabels: Record<string, string> = { course: '강좌', ebook: '전자책', exam: '검정', subscription: '구독' };
  const providerLabels: Record<string, string> = { portone: 'PortOne (카드/이체/가상계좌)', bank_transfer: '무통장 입금' };

  await sendEmail({
    to: 'coincraft.edu@gmail.com',
    subject: `[CoinCraft 관리자] 새 결제 내역 — ${productLabels[productType] ?? productType} · ${userName}`,
    html: wrap('새 결제 내역이 등록되었습니다', `
      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">새로운 결제 신청이 접수되었습니다.</p>
      <table style="border-collapse:collapse;margin:20px 0;">
        ${row('이름', userName)}
        ${row('이메일', userEmail)}
        ${row('상품 유형', productLabels[productType] ?? productType)}
        ${row('상품명', productName)}
        ${row('금액', `${amount.toLocaleString()}원`)}
        ${row('결제 수단', providerLabels[provider] ?? provider)}
      </table>
      ${provider === 'bank_transfer' ? `
      <div style="background:#0f172a;border-radius:8px;padding:14px;margin:16px 0;border-left:3px solid #f59e0b;">
        <p style="margin:0;font-size:13px;color:#f59e0b;font-weight:700;">⚠ 무통장 입금 — 관리자 수동 승인 필요</p>
      </div>` : ''}
      <a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#0f172a;font-weight:700;text-decoration:none;border-radius:8px;font-size:14px;">결제 관리 페이지 바로가기</a>
    `),
  }).catch(() => {});
}

export async function sendAdminBookOrderEmail(params: {
  userName: string;
  userEmail: string;
  bookTitle: string;
  quantity: number;
  totalAmount: number;
  shippingName: string;
  shippingPhone: string;
  postalCode: string;
  shippingAddress: string;
  shippingDetail: string | null;
}): Promise<void> {
  const { userName, userEmail, bookTitle, quantity, totalAmount, shippingName, shippingPhone, postalCode, shippingAddress, shippingDetail } = params;
  const adminUrl = `${env.FRONTEND_URL}/admin/book-orders`;

  await sendEmail({
    to: 'coincraft.edu@gmail.com',
    subject: `[CoinCraft] 📦 종이책 주문 — ${bookTitle} · ${shippingName}`,
    html: wrap('새 종이책 주문이 접수되었습니다', `
      <div style="background:#0f172a;border-radius:8px;padding:14px;margin:0 0 20px;border-left:3px solid #f59e0b;">
        <p style="margin:0;font-size:13px;color:#f59e0b;font-weight:700;">📦 지금 바로 발송 준비를 시작해주세요</p>
      </div>
      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 20px;">새 종이책 주문이 결제 완료되었습니다.</p>

      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#94a3b8;">■ 주문 정보</p>
      <table style="border-collapse:collapse;margin:0 0 20px;">
        ${row('도서', bookTitle)}
        ${row('수량', `${quantity}권`)}
        ${row('결제 금액', `${totalAmount.toLocaleString()}원`)}
        ${row('구매자', `${userName} (${userEmail})`)}
      </table>

      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#94a3b8;">■ 배송지</p>
      <table style="border-collapse:collapse;margin:0 0 24px;">
        ${row('수령인', shippingName)}
        ${row('연락처', shippingPhone)}
        ${row('우편번호', postalCode)}
        ${row('주소', shippingAddress)}
        ${shippingDetail ? row('상세주소', shippingDetail) : ''}
      </table>

      <a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#0f172a;font-weight:700;text-decoration:none;border-radius:8px;font-size:14px;">주문 관리 페이지 바로가기</a>
    `),
  }).catch(() => {});
}

export async function sendMigrationEmail(
  to: string,
  name: string,
  tempPassword: string,
  hasEnrollment: boolean
): Promise<void> {
  const loginUrl = `${env.FRONTEND_URL}/login`;
  const passwordChangeUrl = `${env.FRONTEND_URL}/my/settings`;

  await sendEmail({
    to,
    subject: '[CoinCraft] 새 플랫폼 전환 완료 — 임시 비밀번호 안내',
    html: wrap('플랫폼 전환 완료 안내', `
      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">안녕하세요, <strong style="color:#f1f5f9;">${name}</strong>님.<br>
      코인크래프트가 새로운 전용 학습 플랫폼(<strong style="color:#f59e0b;">coincraft.io</strong>)으로 전환되었습니다.</p>

      <div style="background:#0f172a;border-radius:8px;padding:20px;margin:20px 0;border-left:3px solid #f59e0b;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#f59e0b;">■ 로그인 임시 비밀번호</p>
        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;line-height:1.8;">
          기존 워드프레스 비밀번호는 보안 정책상 새 플랫폼으로 이관이 불가하여<br>
          아래 임시 비밀번호를 발급해드립니다.
        </p>
        <div style="background:#1e293b;border-radius:6px;padding:12px 16px;margin-top:12px;">
          <span style="font-size:18px;font-weight:800;color:#f1f5f9;letter-spacing:1px;">${tempPassword}</span>
        </div>
        <p style="margin:8px 0 0;font-size:12px;color:#64748b;">
          ⚠ 로그인 후 즉시 비밀번호를 변경해 주세요.
        </p>
      </div>

      ${hasEnrollment ? `
      <div style="background:#0f172a;border-radius:8px;padding:16px;margin:20px 0;border-left:3px solid #34d399;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#34d399;">■ 수강 정보 이관 완료</p>
        <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.8;">
          · 기존 수강 신청 강좌가 새 플랫폼에 그대로 이관되었습니다.<br>
          · 강좌별 학습 진도율도 함께 이관되었습니다.<br>
          · 로그인 후 [마이페이지 → 내 강좌]에서 확인하실 수 있습니다.
        </p>
      </div>
      ` : ''}

      <div style="background:#0f172a;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#f59e0b;">■ 새 플랫폼 주요 변경사항</p>
        <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.8;">
          · 모든 강좌·자료는 coincraft.io에서 이용 가능합니다.<br>
          · 기존 워드프레스 사이트는 순차적으로 종료될 예정입니다.<br>
          · 블록체인 기반 수료 인증서 발급 시스템이 도입됩니다.
        </p>
      </div>

      <div style="margin:28px 0 16px;display:flex;gap:12px;flex-direction:column;">
        <a href="${loginUrl}" style="display:block;text-align:center;padding:14px 24px;background:#f59e0b;color:#0f172a;font-weight:700;text-decoration:none;border-radius:8px;font-size:15px;">
          새 플랫폼 로그인하기
        </a>
        <a href="${passwordChangeUrl}" style="display:block;text-align:center;padding:12px 24px;background:transparent;color:#94a3b8;font-weight:600;text-decoration:none;border-radius:8px;font-size:14px;border:1px solid rgba(255,255,255,0.12);">
          비밀번호 변경하기
        </a>
      </div>

      <p style="color:#64748b;font-size:13px;line-height:1.7;margin-top:24px;">
        문의사항은 <a href="mailto:coincraft.edu@gmail.com" style="color:#f59e0b;text-decoration:none;">coincraft.edu@gmail.com</a>으로 연락주세요.
      </p>
    `),
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
