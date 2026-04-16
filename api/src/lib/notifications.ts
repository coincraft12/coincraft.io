import { sendAlimtalk } from './solapi';

// ─── 템플릿 코드 ─────────────────────────────────────────────────────────────

const TEMPLATES = {
  JOIN:        'KA01TP260413132405301c2z6CPmwdq6', // 회원가입 완료
  ENROLL:      'KA01TP260413133446910SurHgZTHEsB', // 수강신청 완료
  EXAM:        'KA01TP260415124239346m8LhqysOnyn', // 시험 접수 완료
  EXAM_RESULT: 'KA01TP260413133233410gkaKx8nBRPm', // 합격/불합격 통보
  CERT:        'KA01TP260413133146159R6CY4X0UrHW', // 인증서 발급
  COUPON:      'KA01TP260413133053995drYa51MAIzM', // 쿠폰 발급
  EBOOK:       'KA01TP260413132729677IgDhNkDR492', // 전자책 구매 완료
} as const;

// ─── 알림 함수 ────────────────────────────────────────────────────────────────

export function notifyJoin(phone: string, name: string) {
  return sendAlimtalk(phone, TEMPLATES.JOIN, {
    '#{이름}': name,
  });
}

export function notifyEnroll(phone: string, name: string, courseName: string) {
  return sendAlimtalk(phone, TEMPLATES.ENROLL, {
    '#{이름}': name,
    '#{강좌명}': courseName,
  });
}

export function notifyExamRegistration(
  phone: string,
  name: string,
  examTitle: string,
  examDateTime: string,
  registrationNumber: string,
  rulesUrl: string
) {
  return sendAlimtalk(phone, TEMPLATES.EXAM, {
    '#{이름}': name,
    '#{시험명}': examTitle,
    '#{시험일시}': examDateTime,
    '#{수험번호}': registrationNumber,
    '#{시험규정}': rulesUrl,
  });
}

export function notifyExamResult(
  phone: string,
  name: string,
  examTitle: string,
  result: '합격' | '불합격',
  score: number
) {
  return sendAlimtalk(phone, TEMPLATES.EXAM_RESULT, {
    '#{이름}': name,
    '#{시험명}': examTitle,
    '#{결과}': result,
    '#{점수}': String(score),
  });
}

export function notifyCertIssued(
  phone: string,
  name: string,
  certName: string,
  certNumber: string,
  issuedAt: Date
) {
  const dateStr = issuedAt.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  return sendAlimtalk(phone, TEMPLATES.CERT, {
    '#{이름}': name,
    '#{자격증명}': certName,
    '#{인증서번호}': certNumber,
    '#{발급일}': dateStr,
  });
}

export function notifyEbookPurchase(
  phone: string,
  name: string,
  ebookTitle: string,
  orderId: string
) {
  return sendAlimtalk(phone, TEMPLATES.EBOOK, {
    '#{이름}': name,
    '#{도서명}': ebookTitle,
    '#{주문번호}': orderId,
    '#{배송지}': '이메일 다운로드',
  });
}
