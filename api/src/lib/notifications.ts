import { sendAlimtalk } from './solapi';

// ─── 템플릿 코드 ─────────────────────────────────────────────────────────────

const TEMPLATES = {
  JOIN:          'KA01TP260413132405301c2z6CPmwdq6', // 회원가입 완료
  ENROLL:        'KA01TP260413133446910SurHgZTHEsB', // 수강신청 완료
  EXAM:          'KA01TP260415124239346m8LhqysOnyn', // 시험 접수 완료
  EXAM_RESULT:   'KA01TP260413133233410gkaKx8nBRPm', // 합격/불합격 통보
  CERT:          'KA01TP260413133146159R6CY4X0UrHW', // 인증서 발급
  COUPON:        'KA01PF2604131308326646KKlOv6D1pw', // 쿠폰 발급
  EBOOK:         'KA01TP260413132729677IgDhNkDR492', // 전자책 구매 완료
  VBANK:         'KA01TP260417182930001ExxopnuI8D3', // 가상계좌 발급
  BANK_TRANSFER: 'KA01TP260417183147855jQBjcScmVjD', // 무통장 입금 안내
  BOOK_ORDER:    'KA01TP260413132647277oXVt6BuPEl1', // 종이책 주문 확인
  BOOK_SHIPPED:  'KA01TP260413132547112K2E2GluwzaK', // 종이책 배송 출발
  BOOK_DELIVERED:'KA01TP260413132821831iHE2GeUfhJ1', // 종이책 배송 완료
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

export function notifyVbank(
  phone: string,
  name: string,
  courseName: string,
  bankName: string,
  bankAccount: string,
  amount: number,
  expiry: string
) {
  if (!TEMPLATES.VBANK) return Promise.resolve();
  return sendAlimtalk(phone, TEMPLATES.VBANK, {
    '#{이름}': name,
    '#{강좌명}': courseName,
    '#{은행명}': bankName,
    '#{계좌번호}': bankAccount,
    '#{금액}': amount.toLocaleString(),
    '#{입금기한}': expiry,
  });
}

export function notifyBookOrder(
  phone: string,
  name: string,
  bookTitle: string,
  quantity: number,
  totalAmount: number,
  shippingAddress: string
) {
  if (!TEMPLATES.BOOK_ORDER) return Promise.resolve();
  return sendAlimtalk(phone, TEMPLATES.BOOK_ORDER, {
    '#{이름}': name,
    '#{도서명}': bookTitle,
    '#{수량}': String(quantity),
    '#{금액}': totalAmount.toLocaleString(),
    '#{배송지}': shippingAddress,
  });
}

export function notifyBookShipped(
  phone: string,
  name: string,
  bookTitle: string,
  trackingNumber: string
) {
  if (!TEMPLATES.BOOK_SHIPPED) return Promise.resolve();
  return sendAlimtalk(phone, TEMPLATES.BOOK_SHIPPED, {
    '#{이름}': name,
    '#{도서명}': bookTitle,
    '#{운송장번호}': trackingNumber,
  });
}

export function notifyBookDelivered(
  phone: string,
  name: string,
  bookTitle: string
) {
  if (!TEMPLATES.BOOK_DELIVERED) return Promise.resolve();
  return sendAlimtalk(phone, TEMPLATES.BOOK_DELIVERED, {
    '#{이름}': name,
    '#{도서명}': bookTitle,
  });
}

export function notifyBankTransfer(
  phone: string,
  name: string,
  courseName: string,
  amount: number
) {
  if (!TEMPLATES.BANK_TRANSFER) return Promise.resolve();
  return sendAlimtalk(phone, TEMPLATES.BANK_TRANSFER, {
    '#{이름}': name,
    '#{강좌명}': courseName,
    '#{금액}': amount.toLocaleString(),
  });
}
