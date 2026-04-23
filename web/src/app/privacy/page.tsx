import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export const metadata = {
  title: '개인정보처리방침 — COINCRAFT',
};

export default function PrivacyPage() {
  const lastUpdated = '2026년 1월 19일';

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

          <div className="space-y-6 text-cc-muted leading-relaxed">

            <section className="cc-glass p-8">
              <p>
                주식회사 코인크래프트(이하 "회사")는 「개인정보 보호법」 등 관련 법령을 준수하며,
                이용자의 개인정보를 보호하기 위해 다음과 같이 개인정보처리방침을 수립·공개합니다.
                본 방침은 회사가 제공하는 웹/모바일 서비스(이하 "서비스")에 적용됩니다.
              </p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">1. 개인정보의 처리목적</h2>
              <p className="mb-3">회사는 다음 목적을 위해 개인정보를 처리합니다. 처리한 개인정보는 아래 목적 이외의 용도로는 이용하지 않으며, 목적이 변경되는 경우 관련 법령에 따라 별도 동의를 받는 등 필요한 조치를 이행합니다.</p>
              <ol className="space-y-3 list-decimal list-inside">
                <li>
                  <strong className="text-cc-text">회원가입 및 계정관리</strong>
                  <ul className="mt-1 ml-4 list-disc list-inside text-sm">
                    <li>가입의사 확인, 본인 확인(소셜로그인 포함), 계정 관리, 부정 이용 방지, 서비스 이용 관련 고지/공지 전달</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-cc-text">서비스 제공 및 계약 이행</strong>
                  <ul className="mt-1 ml-4 list-disc list-inside text-sm">
                    <li>강의/디지털콘텐츠 제공, 학습 진도/수료 관리, 구매/결제/정산, 고객 상담 및 민원 처리</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-cc-text">커뮤니티 운영 및 안전한 이용환경 조성</strong>
                  <ul className="mt-1 ml-4 list-disc list-inside text-sm">
                    <li>게시물 관리, 운영정책 위반 대응, 분쟁 대응, 서비스 보안 및 안전성 확보</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-cc-text">마케팅·홍보(동의한 경우에 한함)</strong>
                  <ul className="mt-1 ml-4 list-disc list-inside text-sm">
                    <li>이벤트/프로모션 안내, 신규 서비스 안내, 맞춤형 콘텐츠 추천</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">2. 처리하는 개인정보 항목 및 수집방법</h2>
              <p className="mb-4">회사는 서비스 제공을 위해 필요한 최소한의 개인정보를 수집합니다.</p>

              <h3 className="font-bold text-cc-text mb-3">(1) 수집 항목</h3>
              <ol className="space-y-3 list-decimal list-inside mb-4">
                <li>
                  회원가입(일반/소셜로그인)
                  <ul className="mt-1 ml-4 list-disc list-inside text-sm">
                    <li>필수: 이메일(아이디), 닉네임(또는 이름), 비밀번호(이메일 가입 시), 로그인 식별자(소셜 제공 식별값)</li>
                    <li>선택: 프로필 이미지, 연락처, 직업/관심분야(선택 설문 시)</li>
                  </ul>
                </li>
                <li>
                  결제/환불
                  <ul className="mt-1 ml-4 list-disc list-inside text-sm">
                    <li>필수: 결제 승인 및 정산에 필요한 정보(결제수단 식별정보, 거래내역, 영수증/세금처리 정보 등)</li>
                    <li>선택: 환불 계좌정보(계좌이체 환불 시)</li>
                  </ul>
                </li>
                <li>
                  고객지원/문의
                  <ul className="mt-1 ml-4 list-disc list-inside text-sm">
                    <li>필수: 이메일, 문의 내용</li>
                    <li>선택: 첨부파일(이용자가 제공하는 경우)</li>
                  </ul>
                </li>
                <li>
                  서비스 이용 과정에서 자동 생성/수집
                  <ul className="mt-1 ml-4 list-disc list-inside text-sm">
                    <li>IP주소, 접속로그, 쿠키, 기기정보(브라우저/OS 등), 이용기록(수강/열람/클릭/구매 이력), 부정이용 탐지 정보</li>
                  </ul>
                </li>
                <li>
                  블록체인/지갑 기능 사용
                  <ul className="mt-1 ml-4 list-disc list-inside text-sm">
                    <li>지갑 주소(공개키), 서명값(인증 목적), 네트워크 정보</li>
                    <li>※ 회사는 원칙적으로 개인키/시드문구를 수집·보관하지 않습니다.</li>
                  </ul>
                </li>
              </ol>

              <h3 className="font-bold text-cc-text mb-3">(2) 수집 방법</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>회원가입/결제/문의 등 이용자가 직접 입력</li>
                <li>소셜로그인 제공사로부터 제공(이용자 동의 기반)</li>
                <li>서비스 이용 과정에서 자동 수집(쿠키, 로그 등)</li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">3. 개인정보의 처리 및 보유기간</h2>
              <p className="mb-4">회사는 개인정보를 <strong className="text-cc-text">수집·이용 목적 달성 시 지체 없이 파기</strong>합니다. 다만, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관 후 파기합니다.</p>
              <ol className="space-y-3 list-decimal list-inside">
                <li>
                  회원정보
                  <ul className="mt-1 ml-4 list-disc list-inside text-sm">
                    <li>보유기간: 회원 탈퇴 시까지</li>
                    <li>단, 부정 이용 방지/분쟁 대응을 위해 탈퇴 후 일정기간 보관 후 파기</li>
                  </ul>
                </li>
                <li>
                  전자상거래 관련 기록(법정 보관)
                  <ul className="mt-1 ml-4 list-disc list-inside text-sm">
                    <li>표시·광고에 관한 기록: 6개월</li>
                    <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                    <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                    <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
                  </ul>
                </li>
                <li>
                  접속기록(보안/부정이용 대응 목적)
                  <ul className="mt-1 ml-4 list-disc list-inside text-sm">
                    <li>보유기간: 3개월~1년 내</li>
                    <li>단, 법령상 별도 보관 의무가 있는 경우 해당 법령을 따름</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">4. 개인정보의 제3자 제공</h2>
              <p className="mb-3">회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령에 근거하거나 수사기관의 적법한 요청이 있는 경우</li>
                <li>서비스 제공을 위해 불가피하게 제공이 필요한 경우(해당 시 제공받는 자/목적/항목/보유기간을 별도 고지 및 동의)</li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">5. 개인정보 처리업무의 위탁</h2>
              <p className="mb-4">회사는 원활한 서비스 제공을 위해 개인정보 처리업무를 위탁할 수 있으며, 위탁 시 관련 법령에 따라 수탁자를 관리·감독합니다.</p>
              <ul className="space-y-3 list-disc list-inside">
                <li>
                  <strong className="text-cc-text">결제 처리: KG이니시스</strong>
                  <ul className="mt-1 ml-4 list-disc list-inside text-sm">
                    <li>위탁업무: 결제 승인 및 정산</li>
                    <li>위탁항목: 결제 정보, 주문자 정보(이메일/이름 등)</li>
                    <li>보유기간: 위탁계약 종료 시 또는 관계 법령상 보관기간까지</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-cc-text">알림/이메일 발송: 구글 클라우드 플랫폼</strong>
                  <ul className="mt-1 ml-4 list-disc list-inside text-sm">
                    <li>위탁업무: 이메일/알림 발송</li>
                    <li>위탁항목: 이메일, 발송 이력</li>
                    <li>보유기간: 목적 달성 시 또는 계약 종료 시까지</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-cc-text">서비스 인프라/호스팅: Hetzner</strong>
                  <ul className="mt-1 ml-4 list-disc list-inside text-sm">
                    <li>위탁업무: 서비스 운영 인프라 제공, 로그 보관</li>
                    <li>위탁항목: 서비스 이용 중 생성되는 로그/기술정보 등</li>
                    <li>보유기간: 계약 종료 시 또는 회사 정책에 따른 기간</li>
                  </ul>
                </li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">6. 개인정보의 국외 이전</h2>
              <p className="mb-3">회사는 원칙적으로 이용자의 개인정보를 국외로 이전하지 않습니다.</p>
              <p>다만, 향후 클라우드/메일/분석 도구 등 이용으로 국외 이전이 발생하는 경우, 관련 법령이 요구하는 <strong className="text-cc-text">별도 동의 및 처리방침 공개 등 요건</strong>을 충족하여 이전합니다.</p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">7. 개인정보의 파기절차 및 파기방법</h2>
              <p className="mb-3">회사는 개인정보 보유기간 경과, 처리목적 달성 등 파기사유가 발생하면 지체 없이 파기합니다.</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>파기절차: 파기 사유 발생 → 내부 검토/승인 → 파기 실행 및 로그 관리</li>
                <li>
                  파기방법
                  <ul className="mt-1 ml-4 list-disc list-inside text-sm">
                    <li>전자적 파일: 복구 불가능한 방법으로 영구 삭제</li>
                    <li>출력물: 분쇄 또는 소각</li>
                  </ul>
                </li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">8. 이용자 및 법정대리인의 권리·의무 및 행사방법</h2>
              <p className="mb-3">이용자는 언제든지 본인의 개인정보에 대해 다음 권리를 행사할 수 있습니다.</p>
              <ul className="space-y-2 list-disc list-inside mb-4">
                <li>열람, 정정, 삭제, 처리정지 요구</li>
                <li>동의 철회(마케팅 수신동의 등)</li>
              </ul>
              <p className="mb-2 font-semibold text-cc-text">행사 방법</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>계정 설정/마이페이지에서 직접 수정(가능한 항목에 한함)</li>
                <li>또는 고객센터(coincraft.edu@gmail.com)로 요청</li>
              </ul>
              <p className="mt-3 text-sm">※ 법정대리인은 만 14세 미만 아동의 개인정보에 대해 위 권리를 행사할 수 있습니다.</p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">9. 쿠키의 설치·운영 및 거부</h2>
              <p>회사는 이용자에게 맞춤형 서비스 제공 및 로그인 상태 유지 등을 위해 쿠키를 사용할 수 있습니다. 이용자는 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다. 다만 쿠키 저장을 거부할 경우 일부 서비스(로그인 유지, 맞춤형 기능 등)가 제한될 수 있습니다.</p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">10. 개인정보의 안전성 확보조치</h2>
              <p className="mb-3">회사는 개인정보의 안전성 확보를 위해 다음 조치를 시행합니다.</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>관리적 조치: 내부관리계획 수립·시행, 정기 교육</li>
                <li>기술적 조치: 접근권한 관리, 암호화(비밀번호 등), 보안프로그램, 접속기록 관리</li>
                <li>물리적 조치: 전산실/자료보관실 접근통제(해당 시)</li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">11. 개인정보 보호책임자 및 문의처</h2>
              <p className="mb-3">회사는 개인정보 처리에 관한 업무를 총괄하고, 개인정보 관련 문의/불만 처리 등을 위해 아래와 같이 개인정보 보호책임자를 지정합니다.</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>개인정보 보호책임자: 김응준 / 대표</li>
                <li>소속: 주식회사 코인크래프트</li>
                <li>이메일: <a href="mailto:coincraft.edu@gmail.com" className="text-cc-accent hover:underline">coincraft.edu@gmail.com</a></li>
                <li>전화: 02-515-0407</li>
                <li>운영시간: 평일 09:00~18:00</li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">12. 만 14세 미만 아동의 개인정보 처리</h2>
              <p>회사는 원칙적으로 만 14세 미만 아동의 회원가입을 제한하거나, 법정대리인의 동의를 확인한 경우에만 개인정보를 처리합니다.</p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">13. 권익침해 구제방법</h2>
              <p>이용자는 개인정보 침해로 인한 구제를 위해 개인정보보호위원회, 한국인터넷진흥원 등 관계기관에 신고하거나 상담을 신청할 수 있습니다.</p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">14. 개인정보처리방침의 변경 및 고지의무</h2>
              <p className="mb-4">본 개인정보처리방침은 법령/정책 또는 회사 내부 운영 방침 변경에 따라 변경될 수 있으며, 변경 시 사이트 공지사항 또는 별도 안내를 통해 고지합니다.</p>
              <p>공고일자: <strong className="text-cc-text">2026년 1월 19일</strong><br />시행일자: <strong className="text-cc-text">2026년 1월 19일</strong></p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
