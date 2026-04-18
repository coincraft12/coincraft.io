import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export const metadata = { title: '시험 관리 세부 규정 — COINCRAFT' };

export default function CertExamRulesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-2xl">

          {/* 브레드크럼 */}
          <p className="text-xs text-cc-muted mb-6">
            <Link href="/cert" className="text-cc-muted hover:text-cc-accent transition-colors">검정 홈</Link>
            {' › '}시험 관리 세부 규정
          </p>

          {/* 타이틀 */}
          <h1 className="text-2xl font-extrabold text-cc-text mb-2">시험 관리 세부 규정</h1>
          <p className="text-xs text-cc-muted mb-10">
            WEB3 구조 설계자 | 주식회사 코인크래프트 | 시행: 2026년 4월 6일
          </p>

          {/* 제1장 부정행위 처리 세부 절차 */}
          <SectionTitle>제1장 부정행위 처리 세부 절차</SectionTitle>

          <SubTitle>제1조 (부정행위 유형)</SubTitle>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#0a2463] text-white">
                  <th className="text-left px-4 py-3 w-32">유형</th>
                  <th className="text-left px-4 py-3">구체적 사례</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  ['대리응시', '수험번호·성명 등록자와 실제 응시자 불일치'],
                  ['타인 도움', '시험 중 타인과 답안 공유, 화면 공유, 메신저 소통'],
                  ['문제·답안 유출', '시험 문항 캡처·촬영·공유 또는 외부 공개'],
                  ['절차 위반', '지정 시간 외 응시, 1회 초과 응답 시도, 수험번호 허위 입력'],
                  ['기타', '응시 자격 허위 기재, 응시료 이중 납부 후 복수 응시 시도'],
                ].map(([type, example]) => (
                  <tr key={type} className="bg-cc-secondary">
                    <td className="px-4 py-3 font-bold text-cc-text">{type}</td>
                    <td className="px-4 py-3 text-cc-muted">{example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SubTitle>제2조 (부정행위 적발 절차)</SubTitle>
          <ol className="text-sm text-cc-muted leading-relaxed list-decimal pl-5 space-y-1 mb-4">
            <li><strong className="text-cc-text">감지</strong>: 운영 책임자가 응답 로그·타임스탬프·응답 패턴 검토</li>
            <li><strong className="text-cc-text">증거 수집</strong>: 응답 기록, 접속 이메일, 타임스탬프 등 관련 자료 보관</li>
            <li><strong className="text-cc-text">당사자 통보</strong>: 시험일로부터 5영업일 이내 이메일 통보 (소명 기회 부여)</li>
            <li><strong className="text-cc-text">소명 접수</strong>: 통보일로부터 3영업일 이내 소명 자료 제출 가능</li>
            <li><strong className="text-cc-text">최종 판정</strong>: 소명 기한 종료 후 3영업일 이내 판정</li>
            <li><strong className="text-cc-text">처분 집행</strong>: 판정 결과 이메일 통보 및 필요 시 조치 집행</li>
          </ol>

          <SubTitle>제3조 (처분 기준)</SubTitle>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#0a2463] text-white">
                  <th className="text-left px-4 py-3">위반 유형</th>
                  <th className="text-left px-4 py-3 w-52">처분</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  ['경미한 절차 위반 (처음, 고의성 낮음)', '해당 회차 검정 무효'],
                  ['대리응시·답안 유출·타인 도움', '검정 무효 + 다음 2회차 응시 제한'],
                  ['반복 부정행위 (2회 이상)', '검정 무효 + 향후 2년 응시 제한'],
                  ['자격 취득 후 부정행위 사실 확인', '자격 취소 + 향후 2년 응시 제한'],
                ].map(([type, action]) => (
                  <tr key={type} className="bg-cc-secondary">
                    <td className="px-4 py-3 text-cc-muted">{type}</td>
                    <td className="px-4 py-3 text-cc-muted">{action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 제2장 이의신청 및 재심의 */}
          <SectionTitle>제2장 이의신청 및 재심의</SectionTitle>

          <SubTitle>제5조 (이의신청 대상)</SubTitle>
          <ul className="text-sm text-cc-muted leading-relaxed list-disc pl-5 space-y-1 mb-4">
            <li>채점 결과에 오류가 있다고 판단하는 경우</li>
            <li>문항 자체에 오류 (복수정답, 오류 문항)가 있다고 판단하는 경우</li>
            <li>부정행위 처분에 이의가 있는 경우</li>
          </ul>

          <SubTitle>제6조 (이의신청 기한 및 방법)</SubTitle>
          <div className="bg-cc-secondary border border-white/10 rounded-xl p-5 mb-4 text-sm text-cc-muted leading-relaxed space-y-1">
            <p><strong className="text-cc-text">신청 기한</strong>: 결과 통보일로부터 5영업일 이내</p>
            <p><strong className="text-cc-text">신청 방법</strong>: 이메일 (<a href="mailto:coincraft.edu@gmail.com" className="text-cc-accent hover:underline">coincraft.edu@gmail.com</a>)</p>
            <p><strong className="text-cc-text">필수 기재</strong>: 수험번호, 성명, 이의신청 대상, 구체적 사유, 증빙 자료</p>
          </div>

          <SubTitle>제7조 (재심의 절차)</SubTitle>
          <ol className="text-sm text-cc-muted leading-relaxed list-decimal pl-5 space-y-1 mb-4">
            <li>신청 수령 후 1영업일 이내 접수 확인 이메일 발송</li>
            <li>운영 책임자가 이의신청 내용 및 증빙 검토</li>
            <li>접수일로부터 5영업일 이내 재심의 결과 통보</li>
            <li>이의신청이 타당한 경우 점수·합격 여부 재산정</li>
          </ol>
          <p className="text-sm text-cc-muted leading-relaxed mb-8">
            문항 오류가 확인된 경우 해당 문항은 <strong className="text-cc-text">전원 정답 처리</strong> 후 점수를 재산정한다. 재심의 결과는 최종 결정으로 한다.
          </p>

          {/* 제3장 온라인 시험 보안 및 감시 */}
          <SectionTitle>제3장 온라인 시험 보안 및 감시</SectionTitle>

          <SubTitle>제9조 (시험지 보안 관리)</SubTitle>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#0a2463] text-white">
                  <th className="text-left px-4 py-3 w-24">단계</th>
                  <th className="text-left px-4 py-3">조치</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  ['보관', '운영 책임자만 접근 가능한 비공개 환경에 보관'],
                  ['배포', '시험 당일 오전 9시, 수험번호 확인된 수험생에게만 링크 발송'],
                  ['회수', '시험 종료 후 응답 수집 마감 및 링크 비활성화'],
                  ['파기', '다음 회차 시험 전 이전 회차 문항 파기'],
                ].map(([stage, action]) => (
                  <tr key={stage} className="bg-cc-secondary">
                    <td className="px-4 py-3 font-bold text-cc-text">{stage}</td>
                    <td className="px-4 py-3 text-cc-muted">{action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SubTitle>제10조 (온라인 부정행위 감시)</SubTitle>
          <ul className="text-sm text-cc-muted leading-relaxed list-disc pl-5 space-y-1 mb-4">
            <li>응답 시간 검토: 제한 시간(60분) 초과 응답 확인</li>
            <li>중복 응답 감지: 동일 수험번호 중복 제출 시 최초 제출만 유효</li>
            <li>응답 패턴 분석: 이상 패턴 (전체 동일 응답 등) 채점 후 검토</li>
            <li>수험번호 불일치: 등록 정보와 응답 성명 불일치 시 무효 처리</li>
          </ul>

          <SubTitle>제11조 (기술 오류 대응)</SubTitle>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#0a2463] text-white">
                  <th className="text-left px-4 py-3 w-40">상황</th>
                  <th className="text-left px-4 py-3">대응</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  ['시험 링크 미수신', '오전 11시까지 미수신 시 coincraft.edu@gmail.com으로 연락 → 재발송'],
                  ['응시 중 연결 끊김', '제한 시간 내 재접속 후 재응답 가능'],
                  ['시스템 장애', '운영 책임자 판단에 따라 시험 연기 또는 대체 수단 제공, 전원 통보'],
                  ['제한 시간 내 미제출', '원칙적으로 불합격 처리. 시스템 귀책 사유 확인 시 재응시 기회 부여'],
                ].map(([situation, response]) => (
                  <tr key={situation} className="bg-cc-secondary">
                    <td className="px-4 py-3 font-bold text-cc-text">{situation}</td>
                    <td className="px-4 py-3 text-cc-muted">{response}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 제4장 자격 취소 세부 절차 */}
          <SectionTitle>제4장 자격 취소 세부 절차</SectionTitle>

          <SubTitle>제12조 (자격 취소 사유)</SubTitle>
          <ul className="text-sm text-cc-muted leading-relaxed list-disc pl-5 space-y-1 mb-4">
            <li>부정행위로 자격을 취득한 사실이 사후 확인된 경우</li>
            <li>응시자격을 허위로 기재하여 자격을 취득한 경우</li>
            <li>자격 취득 후 본 규정에 중대하게 위반한 사실이 확인된 경우</li>
          </ul>

          <SubTitle>제13조 (자격 취소 절차)</SubTitle>
          <ol className="text-sm text-cc-muted leading-relaxed list-decimal pl-5 space-y-1 mb-8">
            <li>취소 사유 발생 시 관련 증거 확보</li>
            <li>당사자에게 자격 취소 검토 사실 및 이의제기 기회 이메일 통보</li>
            <li>통보일로부터 5영업일 이내 소명 제출 가능</li>
            <li>운영 책임자가 최종 취소 여부 결정 및 이메일 통보</li>
            <li>합격자 명단 및 인증서 발급 대장에 무효 표시</li>
          </ol>

          {/* 제5장 개인정보 보관 및 파기 */}
          <SectionTitle>제5장 개인정보 보관 및 파기</SectionTitle>

          <SubTitle>제14조 (보관 기간)</SubTitle>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#0a2463] text-white">
                  <th className="text-left px-4 py-3">항목</th>
                  <th className="text-left px-4 py-3 w-40">보관 기간</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  ['신청서 (성명·생년월일·이메일·연락처)', '자격 유효기간 + 3년'],
                  ['시험 응답 데이터', '해당 회차 완료 후 2년'],
                  ['인증서 발급 대장', '영구 보관'],
                  ['부정행위 처리 기록', '5년'],
                  ['환불 처리 기록', '5년'],
                ].map(([item, period]) => (
                  <tr key={item} className="bg-cc-secondary">
                    <td className="px-4 py-3 text-cc-muted">{item}</td>
                    <td className="px-4 py-3 text-cc-muted">{period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SubTitle>제15조 (파기 절차)</SubTitle>
          <p className="text-sm text-cc-muted leading-relaxed mb-8">
            보관 기한 도래 시 운영 책임자가 파기 대상을 확인하고, 디지털 데이터는 복구 불가 방식으로 영구 삭제한다. 파기 완료 후 파기 일시·대상·담당자를 기록으로 남긴다.
          </p>

          {/* 제6장 환불 세부 절차 */}
          <SectionTitle>제6장 환불 세부 절차</SectionTitle>

          <SubTitle>제16조 (환불 신청 및 처리)</SubTitle>
          <div className="bg-cc-secondary border border-white/10 rounded-xl p-5 mb-4 text-sm text-cc-muted leading-relaxed space-y-1">
            <p><strong className="text-cc-text">신청 방법</strong>: 이메일 (<a href="mailto:coincraft.edu@gmail.com" className="text-cc-accent hover:underline">coincraft.edu@gmail.com</a>)</p>
            <p><strong className="text-cc-text">신청 기한</strong>: 시험일 7일 전 (4월 26일 기준 → 4월 19일까지)</p>
            <p><strong className="text-cc-text">처리 기간</strong>: 신청 확인 후 5영업일 이내</p>
            <p><strong className="text-cc-text">환불 계좌</strong>: 신청 이메일에 계좌 정보 명시</p>
          </div>

          <SubTitle>제17조 (주최 측 귀책 사유 환불)</SubTitle>
          <ul className="text-sm text-cc-muted leading-relaxed list-disc pl-5 space-y-1 mb-8">
            <li>시스템 장애로 정상 시험 진행 불가: 전액 환불</li>
            <li>문제 오류로 시험 무효 처리: 전액 환불 또는 재응시 기회 부여 (응시자 선택)</li>
          </ul>

          {/* 부칙 */}
          <SectionTitle>부칙</SectionTitle>
          <p className="text-sm text-cc-muted leading-relaxed mb-10">
            본 세부 규정은 2026년 4월 6일부터 시행한다.
          </p>

          {/* 하단 링크 */}
          <div className="border-t border-white/10 pt-6 flex flex-wrap gap-4">
            <Link href="/cert" className="text-sm text-cc-accent hover:underline">← 검정 홈으로</Link>
            <Link href="/cert/policy" className="text-sm text-cc-accent hover:underline">자격 관리·운영 규정 →</Link>
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
