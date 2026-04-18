import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export const metadata = {
  title: '이용약관 — COINCRAFT',
};

export default function TermsPage() {
  const lastUpdated = '2025년 1월 1일';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-3xl">
          <div className="mb-10">
            <p className="cc-label mb-2">LEGAL</p>
            <h1 className="text-3xl md:text-4xl font-bold text-cc-text">이용약관</h1>
            <p className="text-cc-muted mt-2 text-sm">최종 업데이트: {lastUpdated}</p>
          </div>

          <div className="space-y-8 text-cc-muted leading-relaxed">
            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제1조 (목적)</h2>
              <p>
                이 약관은 COINCRAFT(이하 "회사")가 제공하는 교육 플랫폼 서비스(이하 "서비스")의
                이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제2조 (용어의 정의)</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>"서비스"란 회사가 제공하는 온라인 교육, 자격증, 전자책, 분석 콘텐츠 등을 의미합니다.</li>
                <li>"회원"이란 회사와 서비스 이용 계약을 체결한 자를 의미합니다.</li>
                <li>"콘텐츠"란 서비스 내에서 제공되는 강의, 자료, 텍스트, 이미지 등을 의미합니다.</li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제3조 (서비스 이용 계약)</h2>
              <p className="mb-3">서비스 이용 계약은 회원이 되고자 하는 자가 약관 내용에 동의하고 회원 가입을 신청하면 회사가 이를 승낙함으로써 성립합니다.</p>
              <p>회사는 다음 각 호에 해당하는 신청에 대해 승낙을 거절할 수 있습니다.</p>
              <ul className="space-y-2 list-disc list-inside mt-3">
                <li>실명이 아니거나 타인의 명의를 사용한 경우</li>
                <li>허위 정보를 기재한 경우</li>
                <li>기타 회사가 정한 이용 신청 요건을 충족하지 못한 경우</li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제4조 (콘텐츠 이용 및 저작권)</h2>
              <p className="mb-3">회사가 제공하는 모든 콘텐츠의 저작권은 회사 또는 해당 강사에게 있습니다.</p>
              <p>회원은 서비스 내 콘텐츠를 개인 학습 목적으로만 이용할 수 있으며, 다음 행위는 금지됩니다.</p>
              <ul className="space-y-2 list-disc list-inside mt-3">
                <li>콘텐츠의 무단 복제, 배포, 전송</li>
                <li>콘텐츠를 이용한 상업적 목적의 2차 창작물 제작</li>
                <li>기타 저작권법에 위반되는 행위</li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제5조 (환불 정책)</h2>
              <p className="mb-3">
                강좌 구매 후 7일 이내이며 수강 진도가 20% 미만인 경우 전액 환불이 가능합니다.
                이후에는 환불이 불가합니다.
              </p>
              <p>전자책 및 디지털 콘텐츠는 다운로드 또는 열람 시작 후 환불이 불가합니다.</p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제6조 (면책 조항)</h2>
              <p>
                회사는 천재지변, 불가항력적 사유, 회원의 귀책사유로 인한 서비스 장애에 대해
                책임을 지지 않습니다. 또한 회원이 서비스를 통해 얻은 정보의 정확성, 신뢰성에
                대해서는 보증하지 않습니다.
              </p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제7조 (준거법 및 관할)</h2>
              <p>이 약관은 대한민국 법령에 따르며, 서비스와 관련한 분쟁은 대한민국 법원을 전속 관할로 합니다.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
