'use strict';
/**
 * 워드프레스 → 새 플랫폼 마이그레이션 이메일 일괄 발송 스크립트 (JS 버전)
 * node send-migration-emails.js (운영 서버 /opt/coincraft-api/ 에서 실행)
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

const TEMP_PASSWORD = 'coincraft12!@';
const SALT_ROUNDS = 12;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://coincraft.io';
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function createTransporter() {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    family: 4,
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    tls: { rejectUnauthorized: false },
  });
}

function wrap(title, body) {
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

async function sendMigrationEmail(to, name, hasEnrollment) {
  const loginUrl = `${FRONTEND_URL}/login`;
  const passwordChangeUrl = `${FRONTEND_URL}/my/settings`;

  const enrollmentBlock = hasEnrollment ? `
    <div style="background:#0f172a;border-radius:8px;padding:16px;margin:20px 0;border-left:3px solid #34d399;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#34d399;">■ 수강 정보 이관 완료</p>
      <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.8;">
        · 기존 수강 신청 강좌가 새 플랫폼에 그대로 이관되었습니다.<br>
        · 강좌별 학습 진도율도 함께 이관되었습니다.<br>
        · [마이페이지 → 내 강좌]에서 바로 이어서 학습하실 수 있습니다.
      </p>
    </div>
  ` : '';

  const html = wrap('플랫폼 전환 완료 안내', `
    <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">안녕하세요, <strong style="color:#f1f5f9;">${name}</strong>님.<br>
    코인크래프트가 새로운 전용 학습 플랫폼 <strong style="color:#f59e0b;">coincraft.io</strong>로 전환되었습니다.</p>

    <div style="background:#0f172a;border-radius:8px;padding:20px;margin:20px 0;border-left:3px solid #f59e0b;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#f59e0b;">■ 임시 비밀번호 안내</p>
      <p style="margin:0 0 12px;font-size:13px;color:#94a3b8;line-height:1.8;">
        기존 워드프레스 비밀번호는 보안 정책상 새 플랫폼으로 이관이 불가합니다.<br>
        아래 임시 비밀번호로 로그인 후 즉시 변경해 주세요.
      </p>
      <div style="background:#1e293b;border-radius:6px;padding:12px 16px;">
        <span style="font-size:20px;font-weight:800;color:#f1f5f9;letter-spacing:2px;">${TEMP_PASSWORD}</span>
      </div>
      <p style="margin:10px 0 0;font-size:12px;color:#64748b;">⚠ 로그인 후 반드시 비밀번호를 변경해 주세요.</p>
    </div>

    ${enrollmentBlock}

    <div style="background:#0f172a;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#f59e0b;">■ 새 플랫폼 주요 변경사항</p>
      <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.8;">
        · 모든 강좌·자료는 <strong style="color:#f1f5f9;">coincraft.io</strong>에서 이용하실 수 있습니다.<br>
        · 기존 워드프레스 사이트는 순차적으로 종료될 예정입니다.<br>
        · 블록체인 기반 수료 인증서 발급 시스템이 도입됩니다.<br>
        · 새로운 검색·추천 기능으로 더 편리하게 학습하실 수 있습니다.
      </p>
    </div>

    <div style="margin:28px 0 16px;">
      <a href="${loginUrl}" style="display:block;text-align:center;padding:14px 24px;background:#f59e0b;color:#0f172a;font-weight:700;text-decoration:none;border-radius:8px;font-size:15px;margin-bottom:10px;">
        새 플랫폼 로그인하기 →
      </a>
      <a href="${passwordChangeUrl}" style="display:block;text-align:center;padding:12px 24px;background:transparent;color:#94a3b8;font-weight:600;text-decoration:none;border-radius:8px;font-size:14px;border:1px solid rgba(255,255,255,0.12);">
        비밀번호 변경하기
      </a>
    </div>

    <p style="color:#64748b;font-size:13px;line-height:1.7;margin-top:24px;">
      문의사항은 <a href="mailto:coincraft.edu@gmail.com" style="color:#f59e0b;text-decoration:none;">coincraft.edu@gmail.com</a>으로 연락해 주세요.
    </p>
  `);

  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[stub] ${to} — 이메일 발송 스킵`);
    return;
  }

  await transporter.sendMail({
    from: `"CoinCraft" <${GMAIL_USER}>`,
    to,
    bcc: 'coincraft.edu@gmail.com',
    subject: '[CoinCraft] 새 플랫폼 전환 완료 — 임시 비밀번호 안내',
    html,
  });
}

async function main() {
  console.log('=== CoinCraft 마이그레이션 이메일 일괄 발송 ===');
  console.log(`임시 비밀번호: ${TEMP_PASSWORD}`);
  console.log('');

  const result = await pool.query(`
    SELECT u.id, u.email, u.name,
      EXISTS(SELECT 1 FROM enrollments e WHERE e.user_id = u.id AND e.status = 'active') AS has_enrollment
    FROM users u
    WHERE u.email NOT LIKE 'kakao_%'
      AND u.email NOT LIKE 'wallet_%'
    ORDER BY u.created_at
  `);

  const users = result.rows;
  console.log(`대상 사용자 수: ${users.length}명`);
  users.forEach(u => console.log(`  - ${u.email} (${u.name}) 수강이력:${u.has_enrollment}`));
  console.log('');

  const hashedPassword = await bcrypt.hash(TEMP_PASSWORD, SALT_ROUNDS);
  console.log('bcrypt 해시 생성 완료');

  await pool.query(
    `UPDATE users SET password_hash = $1 WHERE email NOT LIKE 'kakao_%' AND email NOT LIKE 'wallet_%'`,
    [hashedPassword]
  );
  console.log(`✓ ${users.length}명 비밀번호 초기화 완료`);
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (const user of users) {
    try {
      process.stdout.write(`  발송 중: ${user.email} ... `);
      await sendMigrationEmail(user.email, user.name, user.has_enrollment === true);
      console.log('✓');
      successCount++;
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.log(`✗ 실패: ${err.message}`);
      failCount++;
    }
  }

  console.log('');
  console.log(`=== 완료 === 성공: ${successCount}명 / 실패: ${failCount}명`);

  await pool.end();
}

main().catch((err) => {
  console.error('오류:', err);
  process.exit(1);
});
