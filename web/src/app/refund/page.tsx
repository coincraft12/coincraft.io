import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export const metadata = {
  title: '환불정책 — COINCRAFT',
};

export default function RefundPage() {
  const lastUpdated = '2026년 1월 19일';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-3xl">
          <div className="mb-10">
            <p className="cc-label mb-2">LEGAL</p>
            <h1 className="text-3xl md:text-4xl font-bold text-cc-text">환불정책</h1>
            <p className="text-cc-muted mt-2 text-sm">최종 업데이트: {lastUpdated}</p>
          </div>

          <div className="space-y-6 text-cc-muted leading-relaxed">

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">1. 목적 및 적용범위</h2>
              <p>
                본 정책은 <strong className="text-cc-text">주식회사 코인크래프트(이하 "회사")</strong>가{' '}
                <strong className="text-cc-text">coincraft.io</strong>에서 제공·판매하는{' '}
                <strong className="text-cc-text">온라인 강의(동영상/텍스트/과제/커뮤니티 등) 및 디지털 자료/프로그램(파일, 템플릿, 소프트웨어, 다운로드/열람형 콘텐츠 등)</strong>에 대한{' '}
                <strong className="text-cc-text">청약철회(구매취소) 및 환불 기준</strong>을 규정합니다.<br /><br />
                단, 인프런/유데미 등 <strong className="text-cc-text">외부 마켓플레이스에서 결제한 상품</strong>은 해당 플랫폼의 환불정책이 우선 적용될 수 있습니다.
              </p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">2. 용어 정의</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong className="text-cc-text">강의</strong>: VOD/라이브/텍스트 강의, 과제·퀴즈·수료 등 학습지원 기능을 포함한 온라인 교육 콘텐츠</li>
                <li><strong className="text-cc-text">수강(이용)</strong>: 강의 재생 또는 학습진도가 기록되는 이용(미리보기 포함)</li>
                <li><strong className="text-cc-text">프로그램/자료</strong>: 다운로드 또는 열람 가능한 디지털 파일, 템플릿, 실행파일, 제공자료 일체</li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">3. 법정 청약철회(원칙)</h2>
              <p>
                통신판매(온라인 결제)로 구매한 경우, 원칙적으로{' '}
                <strong className="text-cc-text">계약내용에 관한 서면(결제/구매확인 등)을 받은 날부터 7일 이내</strong>{' '}
                청약철회가 가능합니다.<br /><br />
                다만, <strong className="text-cc-text">디지털콘텐츠/용역 제공이 이미 개시된 경우</strong>에는 법령이 정한 범위에서 청약철회가 제한될 수 있습니다. 회사는 청약철회 관련 법령상 고지·표시 의무를 준수합니다.
              </p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">4. 강의 환불규정</h2>
              <p className="mb-4">회사는 디지털콘텐츠 특성을 고려하여, 법령상 제한이 가능한 경우에도 아래 기준으로 환불을 운영합니다.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 pr-4 text-cc-text font-bold">조건</th>
                      <th className="text-left py-2 text-cc-text font-bold">환불 금액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="py-3 pr-4">결제일 기준 3일 이내 + 2강 이하 수강 시</td>
                      <td className="py-3 font-bold text-cc-accent">수강료 전액 환불</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4">결제일 기준 7일 이내 + 4강 미만 수강 시</td>
                      <td className="py-3 font-bold text-cc-text">수강료의 50% 환불</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4">결제일 기준 8일 초과 또는 5강 이상 수강 시</td>
                      <td className="py-3 font-bold text-cc-text">수강료의 25% 환불</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4">결제일 기준 30일 초과 또는 진도율 50% 이상 수강 시</td>
                      <td className="py-3 font-bold text-cc-muted">환불 불가</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <ul className="mt-4 space-y-1 list-disc list-inside text-sm">
                <li>위 기준의 "2강"에는 미리보기로 공개된 강의도 포함됩니다.</li>
                <li>"강 수"와 "진도율"은 플레이/열람 기록, 진도 저장, 학습 로그 등 시스템 기록을 기준으로 산정합니다.</li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">5. 프로그램/자료 환불규정 (다운로드/열람형 디지털콘텐츠)</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong className="text-cc-text">파일 열람 또는 다운로드가 시작된 시점부터</strong> 해당 디지털콘텐츠의 제공이 개시된 것으로 보며, <strong className="text-cc-text">원칙적으로 환불이 제한</strong>될 수 있습니다.</li>
                <li>청약철회 등이 인정되는 경우, 다운로드형 온라인콘텐츠는 <strong className="text-cc-text">삭제(반환에 준하는 조치)</strong>가 전제될 수 있습니다.</li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">6. 환불 처리 방식 및 소요기간</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>환불은 원칙적으로 <strong className="text-cc-text">원 결제수단으로 환급</strong>됩니다.</li>
                <li>환불 승인 후 회사는 법령에 따라 <strong className="text-cc-text">3영업일 이내 환급</strong>을 원칙으로 처리합니다.</li>
                <li>결제수단(카드사/PG사) 사정에 따라 실제 승인취소/입금 시점은 추가로 소요될 수 있습니다.</li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">7. 환불 제한/거절 사유</h2>
              <p className="mb-3">다음의 경우 회사는 환불을 제한하거나 거절할 수 있습니다.</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>부정한 방법(계정 공유/양도/재판매/다운로드 공유 등)으로 콘텐츠를 이용한 경우</li>
                <li>강의/자료의 무단 복제·배포 등 약관 위반이 확인된 경우</li>
                <li>이벤트성 상품, 별도 고지된 특가 상품 등 <strong className="text-cc-text">사전에 환불조건이 별도로 안내된 경우</strong></li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">8. 환불 신청 방법 및 문의</h2>
              <p className="mb-4">환불을 원하실 경우 아래 채널로 신청해 주세요.</p>
              <ul className="space-y-2 list-disc list-inside mb-4">
                <li>고객센터: <a href="mailto:contact@coincraft.io" className="text-cc-accent hover:underline">contact@coincraft.io</a></li>
                <li>카카오톡 채널: <strong className="text-cc-text">코인크래프트</strong></li>
                <li>또는 사이트 내 <strong className="text-cc-text">[마이페이지 &gt; 주문내역/수강내역 &gt; 환불요청]</strong></li>
              </ul>
              <p className="mb-2 text-sm">신청 시 아래 정보를 함께 기재해주시면 처리 속도가 빨라집니다.</p>
              <ul className="list-disc list-inside text-sm">
                <li>주문번호 / 구매자 이메일 / 상품명 / 환불 사유</li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">9. 정책의 변경</h2>
              <p className="mb-4">본 정책은 관련 법령/서비스 구조 변경에 따라 개정될 수 있으며, 개정 시 사이트 공지 또는 페이지 게시를 통해 안내합니다.</p>
              <p><strong className="text-cc-text">공고일자:</strong> 2026년 1월 19일<br /><strong className="text-cc-text">시행일자:</strong> 2026년 1월 19일</p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
