import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export const metadata = {
  title: '개인정보처리방침 — COINCRAFT',
};

export default function PrivacyPage() {
  const lastUpdated = '2025년 1월 1일';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-3xl">
          <div className="mb-10">
            <p className="cc-label mb-2">LEGAL</p>
            <h1 className="text-3xl md:text-4xl font-bold text-cc-text">개인정보처리방침</h1>
            <p className="text-cc-muted mt-2 text-sm">최종 업데이트: {lastUpdated}</p>
          </div>

          <div className="space-y-8 text-cc-muted leading-relaxed">
            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">1. 수집하는 개인정보</h2>
              <p className="mb-3">COINCRAFT(이하 "회사")는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>필수 항목: 이메일 주소, 이름, 비밀번호(암호화 저장)</li>
                <li>선택 항목: 프로필 사진, 지갑 주소</li>
                <li>자동 수집: 서비스 이용 기록, 접속 로그, 쿠키</li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">2. 개인정보의 수집 및 이용 목적</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>회원 가입 및 서비스 제공</li>
                <li>강좌 수강, 전자책 구매, 자격증 발급</li>
                <li>결제 처리 및 환불 처리</li>
                <li>공지사항 및 서비스 안내</li>
                <li>서비스 개선 및 통계 분석</li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">3. 개인정보의 보유 및 이용 기간</h2>
              <p className="mb-3">회원 탈퇴 시까지 보유하며, 탈퇴 후 지체 없이 파기합니다. 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관합니다.</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>계약 또는 청약철회에 관한 기록: 5년 (전자상거래법)</li>
                <li>소비자 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래법)</li>
                <li>로그인 기록: 3개월 (통신비밀보호법)</li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">4. 개인정보의 제3자 제공</h2>
              <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 이용자의 동의가 있거나 법령에 의한 경우에는 예외로 합니다.</p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">5. 이용자 권리</h2>
              <p className="mb-3">이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>개인정보 열람 요구</li>
                <li>오류 등이 있을 경우 정정 요구</li>
                <li>삭제 요구</li>
                <li>처리 정지 요구</li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">6. 문의</h2>
              <p>개인정보 관련 문의는 아래로 연락주시기 바랍니다.</p>
              <p className="mt-2">이메일: <a href="mailto:privacy@coincraft.io" className="text-cc-accent hover:underline">privacy@coincraft.io</a></p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
