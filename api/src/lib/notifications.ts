import { sendAlimtalk } from './solapi';

// ─── 템플릿 코드 ─────────────────────────────────────────────────────────────

const TEMPLATES = {
  JOIN:       'KA01TP260413132405301c2z6CPmwdq6', // 회원가입 완료
  ENROLL:     'KA01TP260413133446910SurHgZTHEsB', // 수강신청 완료
  EXAM:       'KA01TP260413133351273AgZjZMgnlMj', // 시험 접수 완료
  EXAM_RESULT:'KA01TP260413133233410gkaKx8nBRPm', // 합격/불합격 통보
  CERT:       'KA01TP260413133146159R6CY4X0UrHW', // 인증서 발급
  COUPON:     'KA01TP260413133053995drYa51MAIzM', // 쿠폰 발급
  EBOOK:      'KA01TP260413132729677IgDhNkDR492', // 전자책 구매 완료
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
  examDate: string,
  fee: string
) {
  return sendAlimtalk(phone, TEMPLATES.EXAM, {
    '#{이름}': name,
    '#{시험명}': examTitle,
    '#{시험일}': examDate,
    '#{응시료}': fee,
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
  certNumber: string
) {
  return sendAlimtalk(phone, TEMPLATES.CERT, {
    '#{이름}': name,
    '#{자격명}': certName,
    '#{인증번호}': certNumber,
  });
}

export function notifyEbookPurchase(phone: string, name: string, ebookTitle: string) {
  return sendAlimtalk(phone, TEMPLATES.EBOOK, {
    '#{이름}': name,
    '#{전자책명}': ebookTitle,
  });
}
