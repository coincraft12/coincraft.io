import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export const metadata = { title: '자격 관리·운영 규정 — CoinCraft' };

export default function CertPolicyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-2xl">

          {/* 브레드크럼 */}
          <p className="text-xs text-cc-muted mb-6">
            <Link href="/cert" className="text-cc-muted hover:text-cc-accent transition-colors">검정 홈</Link>
            {' › '}자격 관리·운영 규정
          </p>

          {/* 타이틀 */}
          <h1 className="text-2xl font-extrabold text-cc-text mb-2">자격 관리·운영 규정</h1>
          <p className="text-xs text-cc-muted mb-10">
            WEB3 구조 설계자 | 주식회사 코인크래프트 | 최근 개정: 2026년 1월 13일
          </p>

          {/* 제1장 총칙 */}
          <SectionTitle>제1장 총칙</SectionTitle>

          <SubTitle>제1조 (목적)</SubTitle>
          <p className="text-sm text-cc-muted leading-relaxed mb-4">
            본 규정은 주식회사 코인크래프트(이하 "자격관리기관")가 시행·관리하는 WEB3 구조 설계자 자격의 관리 및 운영에 관한 사항을 정함으로써, 자격 검정의 공정성·객관성·신뢰성을 확보하고 자격 제도의 체계적인 운영을 도모함을 목적으로 한다.
          </p>

          <SubTitle>제2조 (정의)</SubTitle>
          <ul className="text-sm text-cc-muted leading-relaxed list-disc pl-5 space-y-1 mb-4">
            <li><strong className="text-cc-text">본 자격</strong>: WEB3 및 블록체인 기반 구조에 대한 이해, 활용, 판단 및 책임 수행 역량을 단계적으로 검정하는 민간자격</li>
            <li><strong className="text-cc-text">등급</strong>: Basic, Associate, Professional로 구분된 자격 단계</li>
            <li><strong className="text-cc-text">필기검정</strong>: 개념·원리·구조·사례 기반 판단을 문항 형태로 평가하는 검정 방식</li>
            <li><strong className="text-cc-text">실기검정</strong>: 실제 자산 이동을 요구하지 않고, 시나리오 기반 과제 수행으로 판단 능력을 평가하는 방식</li>
            <li><strong className="text-cc-text">부정행위</strong>: 검정의 공정성을 해치는 행위로 본 규정에서 정한 기준에 해당하는 행위</li>
          </ul>

          <SubTitle>제3조 (자격 명칭 및 등급)</SubTitle>
          <p className="text-sm text-cc-muted leading-relaxed mb-8">
            자격 명칭은 <strong className="text-cc-text">"WEB3 구조 설계자"</strong>이며, 등급은 Basic / Associate / Professional로 구분한다.
          </p>

          {/* 제2장 등급 및 직무내용 */}
          <SectionTitle>제2장 등급 및 직무내용</SectionTitle>

          <SubTitle>제4조 (등급별 직무내용)</SubTitle>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#0a2463] text-white">
                  <th className="text-left px-4 py-3 w-28">등급</th>
                  <th className="text-left px-4 py-3">직무내용</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  ['Basic', '중앙화 구조와 분산 신뢰 구조의 차이를 설명하고, 지갑·주소·트랜잭션 등 기본 요소를 이해하여 WEB3 구조를 읽을 수 있다.'],
                  ['Associate', '서비스/프로젝트의 구조를 WEB3 관점에서 해석하고, 사용자 온보딩·자산흐름·권한/책임 구조를 점검하여 위험요소를 식별할 수 있다.'],
                  ['Professional', '목표(보안·거버넌스·규제·성장)에 맞춰 WEB3 구조를 설계·개선하고, 핵심 리스크를 통제하는 설계안을 제시할 수 있다.'],
                ].map(([grade, content]) => (
                  <tr key={grade} className="bg-cc-secondary">
                    <td className="px-4 py-3 font-bold text-cc-text">{grade}</td>
                    <td className="px-4 py-3 text-cc-muted leading-relaxed">{content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 제3장 검정기준·방법·응시자격 */}
          <SectionTitle>제3장 검정기준·방법·응시자격</SectionTitle>

          <SubTitle>제5조 (검정기준)</SubTitle>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#0a2463] text-white">
                  <th className="text-left px-4 py-3 w-28">등급</th>
                  <th className="text-left px-4 py-3">검정기준</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  ['Basic', 'WEB3 핵심 구성요소(지갑·주소·트랜잭션·가스·스마트컨트랙트)의 개념을 이해하고, 중앙화/탈중앙화 구조 차이를 구조적 관점에서 설명할 수 있는 수준'],
                  ['Associate', '시나리오에서 역할·권한·자산흐름을 파악하고, 구조적 취약점 및 운영 리스크를 식별하여 개선 방향을 제시할 수 있는 수준'],
                  ['Professional', '복합 시나리오에서 설계 목표와 제약조건을 정리하고, 보안·거버넌스·규제·운영 관점의 설계안을 논리적으로 구성·평가할 수 있는 수준'],
                ].map(([grade, criterion]) => (
                  <tr key={grade} className="bg-cc-secondary">
                    <td className="px-4 py-3 font-bold text-cc-text">{grade}</td>
                    <td className="px-4 py-3 text-cc-muted leading-relaxed">{criterion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SubTitle>제6조 (검정방법 및 과목)</SubTitle>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#0a2463] text-white">
                  <th className="text-left px-4 py-3 w-28">등급</th>
                  <th className="text-left px-4 py-3 w-28">검정방법</th>
                  <th className="text-left px-4 py-3">검정과목</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr className="bg-cc-secondary">
                  <td className="px-4 py-3 font-bold text-cc-text">Basic</td>
                  <td className="px-4 py-3 text-cc-muted">필기검정</td>
                  <td className="px-4 py-3 text-cc-muted leading-relaxed">분산 신뢰 구조의 이해 / WEB3 기초 구조의 이해 (지갑·주소·트랜잭션·컨트랙트·토큰 기본 개념)</td>
                </tr>
                <tr className="bg-cc-secondary border-b border-white/10">
                  <td className="px-4 py-3 font-bold text-cc-text" rowSpan={2}>Associate</td>
                  <td className="px-4 py-3 text-cc-muted">필기검정</td>
                  <td className="px-4 py-3 text-cc-muted">WEB3 아키텍처 분석</td>
                </tr>
                <tr className="bg-cc-secondary">
                  <td className="px-4 py-3 text-cc-muted">실기검정</td>
                  <td className="px-4 py-3 text-cc-muted">권한 통제 설계 / 자금 흐름 기반 리스크 평가</td>
                </tr>
                <tr className="bg-cc-secondary">
                  <td className="px-4 py-3 font-bold text-cc-text">Professional</td>
                  <td className="px-4 py-3 text-cc-muted">실기검정</td>
                  <td className="px-4 py-3 text-cc-muted">프로토콜 설계 / 거버넌스 설계 / 컴플라이언스·운영 설계</td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubTitle>제7조 (응시자격)</SubTitle>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#0a2463] text-white">
                  <th className="text-left px-4 py-3 w-28">등급</th>
                  <th className="text-left px-4 py-3">응시자격</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  ['Basic', '연령 및 학력에 제한 없이 누구나 응시 가능'],
                  ['Associate', 'WEB3 구조 설계자 Basic 자격 취득자'],
                  ['Professional', 'WEB3 구조 설계자 Associate 자격 취득자'],
                ].map(([grade, eligibility]) => (
                  <tr key={grade} className="bg-cc-secondary">
                    <td className="px-4 py-3 font-bold text-cc-text">{grade}</td>
                    <td className="px-4 py-3 text-cc-muted">{eligibility}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 제4장 검정 운영 */}
          <SectionTitle>제4장 검정 운영</SectionTitle>

          <SubTitle>제8조 (공고 및 원서접수)</SubTitle>
          <p className="text-sm text-cc-muted leading-relaxed mb-4">
            자격관리기관은 검정 실시 일정, 응시 방법, 수수료, 환불 기준 등 필요한 사항을 사전에 공고한다. 응시자는 자격관리기관이 정한 방법에 따라 원서접수 및 수수료 납부를 완료하여야 한다.
          </p>

          <SubTitle>제9조 (수험자 확인)</SubTitle>
          <p className="text-sm text-cc-muted leading-relaxed mb-4">
            온라인 검정의 경우, 사전 등록 정보(성명, 수험번호 등) 확인 및 자격관리기관이 정한 방식으로 본인 확인을 진행한다.
          </p>

          <SubTitle>제10조 (합격기준 및 합격자 결정)</SubTitle>
          <p className="text-sm text-cc-muted leading-relaxed mb-8">
            합격기준은 각 검정별 총점의 <strong className="text-cc-text">70점 이상</strong>을 득점한 경우 합격으로 한다. 자격관리기관은 채점 결과를 검토한 후 합격자를 확정하고 공고한다.
          </p>

          {/* 제5장 자격증 교부 및 사후관리 */}
          <SectionTitle>제5장 자격증 교부 및 사후관리</SectionTitle>

          <SubTitle>제11조 (자격증 교부)</SubTitle>
          <p className="text-sm text-cc-muted leading-relaxed mb-2">
            합격자에게는 자격관리기관 명의의 자격증을 교부한다. 자격증에는 다음 사항을 기재한다.
          </p>
          <ul className="text-sm text-cc-muted leading-relaxed list-disc pl-5 space-y-1 mb-4">
            <li>자격명 / 등급 / 성명 / 생년월일</li>
            <li>발급번호 / 발급일 / 발급기관</li>
          </ul>

          <SubTitle>제12조 (유효기간 및 재발급)</SubTitle>
          <p className="text-sm text-cc-muted leading-relaxed mb-8">
            본 자격의 유효기간은 별도로 정하지 아니한다. 자격증 분실·훼손 시 신청을 통해 재발급 가능하며, 재발급 수수료는 별도로 정한다.
          </p>

          {/* 제6장 수수료 및 환불 */}
          <SectionTitle>제6장 수수료 및 환불</SectionTitle>

          <SubTitle>제14조 (검정 수수료)</SubTitle>
          <p className="text-sm text-cc-muted leading-relaxed mb-4">
            응시자는 자격관리기관이 공고한 검정 수수료를 납부하여야 한다. 수수료 금액·납부 방법·납부 기한은 공고 내용에 따른다.
          </p>

          <SubTitle>제15조 (환불 기준)</SubTitle>
          <ul className="text-sm text-cc-muted leading-relaxed list-disc pl-5 space-y-1 mb-8">
            <li>검정일 <strong className="text-cc-text">7일 전까지</strong> 신청 시: 전액 환불</li>
            <li>검정일 7일 이내: 원칙적으로 환불 불가</li>
            <li>천재지변·주최 측 귀책 사유: 전부 또는 일부 환불 가능</li>
          </ul>

          {/* 제7장 개인정보 및 기록관리 */}
          <SectionTitle>제7장 개인정보 및 기록관리</SectionTitle>

          <SubTitle>제16조 (개인정보 보호)</SubTitle>
          <p className="text-sm text-cc-muted leading-relaxed mb-4">
            자격관리기관은 자격 운영 과정에서 취득한 개인정보를 관련 법령에 따라 안전하게 관리·보호한다. 개인정보의 수집·이용·보관·파기 기준은 별도의 개인정보처리방침 및 시험 관리 세부 규정에 따른다.
          </p>

          <SubTitle>제17조 (자료 보관 및 공개)</SubTitle>
          <p className="text-sm text-cc-muted leading-relaxed mb-8">
            채점표·평가자료 등 검정 관련 기록은 공정한 운영을 위해 일정 기간 보관한다. 검정 종료 후 문제·평가자료는 원칙적으로 외부에 공개하지 않는다.
          </p>

          {/* 제8장 부정행위 처리 */}
          <SectionTitle>제8장 부정행위 처리</SectionTitle>

          <SubTitle>제18조 (부정행위 기준 및 조치)</SubTitle>
          <p className="text-sm text-cc-muted mb-2">다음 행위는 부정행위로 간주한다.</p>
          <ul className="text-sm text-cc-muted leading-relaxed list-disc pl-5 space-y-1 mb-3">
            <li>대리응시</li>
            <li>타인의 도움을 받아 답안 작성</li>
            <li>문제·답안 유출</li>
            <li>검정 절차 위반</li>
            <li>기타 공정성을 해치는 행위</li>
          </ul>
          <p className="text-sm text-cc-muted leading-relaxed mb-2">
            부정행위가 확인된 경우 해당 검정은 무효로 처리되며, 응시 제한 등의 조치가 취해질 수 있다.
          </p>
          <p className="text-sm text-cc-muted mb-8">
            세부 처리 절차:{' '}
            <Link href="/cert/exam-rules" className="text-cc-accent hover:underline">
              시험 관리 세부 규정
            </Link>{' '}
            참조
          </p>

          {/* 부칙 */}
          <SectionTitle>부칙</SectionTitle>
          <p className="text-sm text-cc-muted leading-relaxed mb-10">
            본 규정은 공표한 날로부터 시행한다. (최근 개정: 2026년 1월 13일)
          </p>

          {/* 하단 링크 */}
          <div className="border-t border-white/10 pt-6 flex flex-wrap gap-4">
            <Link href="/cert" className="text-sm text-cc-accent hover:underline">← 검정 홈으로</Link>
            <Link href="/cert/exam-rules" className="text-sm text-cc-accent hover:underline">시험 관리 세부 규정 →</Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-bold text-cc-text bg-cc-secondary border border-white/10 rounded-lg px-4 py-3 mb-4 mt-2">
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-cc-text mb-2">{children}</h3>
  );
}
