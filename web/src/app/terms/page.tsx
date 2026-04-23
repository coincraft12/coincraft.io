import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export const metadata = {
  title: '이용약관 — COINCRAFT',
};

export default function TermsPage() {
  const lastUpdated = '2026년 1월 19일';

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

          <div className="space-y-6 text-cc-muted leading-relaxed">

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제1조 (목적)</h2>
              <p className="mb-3">
                본 약관은 주식회사 코인크래프트(이하 "회사")가 운영하는 coincraft.io 및 이에 부수하는 웹/모바일 서비스(이하 "사이트" 또는 "서비스")를 이용함에 있어, 회사와 이용자(회원/비회원)의 권리·의무 및 책임사항, 이용조건과 절차 등 기본적인 사항을 규정함을 목적으로 합니다.
              </p>
              <p>
                본 서비스는 블록체인/WEB3 관련 <strong className="text-cc-text">기술 교육 및 학습지원</strong>을 제공하는 온라인 교육 플랫폼입니다. 회사는 금융상품의 판매·중개를 하지 않으며, 특정 자산에 대한 <strong className="text-cc-text">추천/자문/리딩</strong>, <strong className="text-cc-text">거래 중개·대리</strong> 또는 <strong className="text-cc-text">회원 자금 예치/운용</strong>을 제공하지 않습니다.
              </p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제2조 (정의)</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>"사이트"란 회사가 서비스(교육 콘텐츠, 디지털 상품, 커뮤니티, 결제, 이벤트 등)를 제공하기 위해 구축한 온라인 플랫폼을 말하며, 모바일 웹/앱 및 향후 추가 채널을 포함합니다.</li>
                <li>"회원"이란 본 약관에 동의하고 회사가 정한 절차에 따라 가입하여 서비스를 이용할 수 있는 자를 말합니다.</li>
                <li>"비회원"이란 회원가입 없이 사이트를 이용하는 자를 말합니다.</li>
                <li>"아이디(ID)"란 회원의 식별 및 서비스 이용을 위하여 회원이 설정하거나 소셜 로그인으로 제공되는 이메일 주소(또는 이에 준하는 식별자)를 말합니다.</li>
                <li>"콘텐츠"란 회사가 제공하는 강의 영상, 텍스트 강의, 자료(PDF/파일), 퀴즈/과제/평가, 라이브 세션, 뉴스레터, 커뮤니티 게시글/댓글, 기타 교육·정보 제공물 일체를 말합니다.</li>
                <li>"유료서비스"란 회사가 유료로 제공하는 온라인 강의, 멤버십, 디지털 다운로드 상품, 유료 프로그램/이벤트 등을 말합니다.</li>
                <li>"디지털 상품"이란 다운로드/스트리밍/열람 형태로 제공되는 무형의 상품을 말합니다(예: 강의, 전자책, 자료, 멤버십 등).</li>
                <li>"게시물"이란 회원이 서비스 내에 게시한 글, 댓글, 이미지, 영상, 링크, 파일 등 정보 일체를 말합니다.</li>
                <li>"외부 지갑(월렛)"이란 블록체인 네트워크에서 서명/인증 등에 사용되는 외부 지갑을 의미하며, 회사는 회원의 개인키/시드문구를 저장하거나 보관하지 않습니다.</li>
                <li>본 조에서 정의되지 않은 용어는 관련 법령 및 일반적인 거래관행에 따릅니다.</li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제3조 (약관의 명시, 설명 및 개정)</h2>
              <ol className="space-y-3 list-decimal list-inside">
                <li>
                  회사는 본 약관의 내용과 다음 정보를 사이트 하단(푸터) 또는 별도 화면을 통해 게시합니다.
                  <ul className="mt-2 ml-4 space-y-1 list-disc list-inside text-sm">
                    <li>상호: 주식회사 코인크래프트</li>
                    <li>대표자: 김응준</li>
                    <li>사업장 주소: 서울특별시 강남구 강남대로112길 47 2층 J721(논현동)</li>
                    <li>사업자등록번호: 573-86-03834</li>
                    <li>통신판매업 신고번호: 2026-서울강남-00160</li>
                    <li>이메일: coincraft.edu@gmail.com</li>
                    <li>전화번호: 02-515-0407 (운영시간: 09:00~18:00)</li>
                    <li>개인정보관리책임자: 김응준</li>
                  </ul>
                </li>
                <li>회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</li>
                <li>회사가 약관을 개정할 경우 적용일자 및 개정사유를 명시하여 적용일자 7일 전부터 공지하며, 회원에게 불리한 변경은 30일 이상의 유예기간을 두고 공지합니다.</li>
                <li>회원은 개정 약관에 동의하지 않을 권리가 있으며, 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다. 기한까지 거부 의사를 표시하지 아니한 경우 개정 약관에 동의한 것으로 봅니다.</li>
                <li>회사는 서비스별 운영정책/개별약관(예: 환불정책, 커뮤니티 가이드라인, 이벤트 규정 등)을 둘 수 있으며, 개별약관이 본 약관에 우선할 수 있습니다.</li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제4조 (서비스의 제공)</h2>
              <ol className="space-y-2 list-decimal list-inside mb-4">
                <li>회사는 다음 각 호의 서비스를 제공합니다.<br />
                  (1) 온라인 교육 서비스(영상/텍스트 강의, 과제/퀴즈/평가, 수료 관리 등)<br />
                  (2) 디지털 상품 판매 및 열람 서비스(전자책/자료/다운로드/스트리밍 등)<br />
                  (3) 커뮤니티/학습 지원 서비스(토론, 질의응답, 공지, 이벤트 등)<br />
                  (4) 자격/수료/검정 관련 서비스(신청, 응시, 결과 안내 등)<br />
                  (5) 기타 회사가 정하거나 추가 개발하는 서비스
                </li>
                <li>회사는 상품/콘텐츠의 품절, 저작권/라이선스 변경, 기술적 사양 변경 등 사유로 제공 내용을 변경할 수 있으며, 변경 시 사이트를 통해 고지합니다.</li>
              </ol>
              <h3 className="font-bold text-cc-text mb-2">제4조의2 (서비스 성격 및 제공 범위 고지)</h3>
              <ol className="space-y-2 list-decimal list-inside">
                <li>회사가 제공하는 서비스는 블록체인/WEB3 관련 <strong className="text-cc-text">기술 교육 콘텐츠 및 학습지원</strong>입니다.</li>
                <li>회사는 특정 자산의 거래 판단을 위한 추천/자문/리딩, 거래 중개·대리 또는 회원 자금 예치/운용을 제공하지 않습니다.</li>
                <li>서비스 내에서 트랜잭션/주소/데이터 흐름 등 사례를 다루는 경우에도 이는 <strong className="text-cc-text">기술 구조 이해, 보안/리스크 인지, 데이터 분석 학습</strong>을 위한 것으로, 금융상품 또는 거래 판단 자료로 해석되지 않습니다.</li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제5조 (서비스의 중단)</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>회사는 설비 점검, 교체, 장애, 통신두절, 보안 이슈, 운영상 필요 등의 사유로 서비스 제공을 일시 중단할 수 있습니다.</li>
                <li>회사는 서비스 중단 시 사유와 기간을 사이트 공지 또는 이에 준하는 방법으로 안내합니다.</li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제6조 (회원가입 및 이용계약의 성립)</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>이용계약은 가입신청자가 약관에 동의하고 회사가 정한 절차에 따라 가입을 신청한 후, 회사가 이를 승인함으로써 성립합니다.</li>
                <li>회사는 다음 각 호에 해당하는 경우 가입 승인을 거부하거나 유보할 수 있습니다.<br />
                  (1) 타인 명의 도용, 허위 정보 기재, 필수 항목 누락/오기<br />
                  (2) 만 14세 미만인 경우<br />
                  (3) 서비스 운영을 방해하거나 부정 이용 이력이 있는 경우<br />
                  (4) 기타 합리적으로 승인 불가 사유가 있다고 판단되는 경우
                </li>
                <li>회원은 가입 정보에 변경이 있는 경우 지체 없이 수정해야 하며, 미수정으로 인한 불이익은 회원에게 있습니다.</li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제7조 (회원의 의무)</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>회원은 관련 법령, 본 약관, 운영정책 및 회사의 안내를 준수해야 합니다.</li>
                <li>회원은 회사의 사전 동의 없이 콘텐츠를 복제·배포·전송·판매·2차 저작물화 하는 등 저작권을 침해하는 행위를 해서는 안 됩니다.</li>
                <li>회원은 다음의 부정 이용행위를 해서는 안 됩니다.<br />
                  (1) 계정 공유/양도/대여/판매, 동시접속을 통한 이용<br />
                  (2) 해킹, 크롤링/스크래핑(허용 범위 초과), 취약점 악용, 바이러스 유포<br />
                  (3) 타인의 명예훼손, 모욕, 혐오, 차별, 불법정보 게시<br />
                  (4) 불법/무단 광고, 스팸, 다단계/사기성 홍보<br />
                  (5) 기타 공서양속 및 법령 위반 행위
                </li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제8조 (아이디 및 계정 관리)</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>아이디 및 비밀번호(또는 소셜 로그인 계정)의 관리 책임은 회원에게 있습니다.</li>
                <li>회원은 계정 도용 또는 제3자 사용을 인지한 경우 즉시 회사에 통지해야 합니다.</li>
                <li>회사는 다음 각 호의 경우 부정 이용으로 간주하여 이용제한, 계약해지 등 조치를 할 수 있습니다.<br />
                  (1) 동일 계정의 비정상적 동시 접속<br />
                  (2) 계정/강의 이용권의 판매·대여·양도·공유<br />
                  (3) 자동화 수단을 통한 비정상 이용
                </li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제9조 (회원 탈퇴 및 자격 상실)</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>회원은 언제든지 탈퇴를 요청할 수 있으며 회사는 관련 정책에 따라 처리합니다.</li>
                <li>회사는 회원이 본 약관을 위반하거나 서비스 운영을 방해하는 경우 사전 통지 후 이용 제한 또는 회원자격 상실 조치를 할 수 있습니다.</li>
                <li>회원자격 상실 시 회사는 사전 소명 기회를 부여할 수 있습니다(긴급/중대 사안은 예외).</li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제10조 (회사의 의무)</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>회사는 법령과 본 약관이 금지하는 행위를 하지 않으며 안정적으로 서비스를 제공하도록 노력합니다.</li>
                <li>회사는 개인정보 보호를 위해 관련 법령 및 개인정보처리방침을 준수합니다.</li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제11조 (부정이용의 차단)</h2>
              <p>회사는 로그/접속정보 등 합리적인 방법으로 부정이용 여부를 확인하고, 필요한 경우 접속 차단·이용정지·계약해지 등 조치를 취할 수 있습니다. 회원은 회사의 정당한 보안 조치에 협조해야 합니다.</p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제12조 (개인정보보호)</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>회사는 개인정보처리방침을 통해 개인정보의 수집·이용·보관·파기 및 권리행사 방법을 안내합니다.</li>
                <li>회사는 회원의 동의 없이 개인정보를 목적 외로 이용하거나 제3자에게 제공하지 않습니다(법령상 예외 제외).</li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제13조 (회원에 대한 통지)</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>회사는 회원의 이메일, 서비스 내 알림, 공지사항 등 합리적인 방법으로 통지할 수 있습니다.</li>
                <li>불특정 다수에 대한 통지는 공지사항 게시로 갈음할 수 있습니다.</li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제14조 (정보 제공 및 광고)</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>회사는 서비스 운영상 필요한 안내 및 정보를 제공할 수 있습니다.</li>
                <li>회사는 법령이 허용하는 범위에서 마케팅 정보를 제공할 수 있으며, 회원은 수신거부를 할 수 있습니다.</li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제15조 (구매신청)</h2>
              <p>회원은 사이트가 정한 절차에 따라 유료서비스/상품 구매를 신청하고, 결제 전 가격·환불조건·이용기간 등 주요 내용을 확인해야 합니다.</p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제16조 (대금 지급 방법)</h2>
              <p>회사는 카드결제, 계좌이체, 간편결제 등 사이트에서 제공하는 결제수단을 통해 대금을 지급받습니다. 회사는 <strong className="text-cc-text">가상자산(암호화폐) 결제</strong>를 제공하지 않습니다.</p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제17조 (쿠폰 및 프로모션)</h2>
              <p>쿠폰/할인 혜택은 회사 정책에 따라 발행·회수·변경될 수 있으며, 현금 환급되지 않습니다. 부정 취득/부정 사용 시 회사는 혜택 회수 및 이용제한을 할 수 있습니다.</p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제18조 (계약의 성립)</h2>
              <p>회사가 구매신청에 대해 결제 완료 및 제공 가능 안내를 한 때 계약이 성립합니다. 회사는 허위 신청, 부정 이용 등 정당한 사유가 있는 경우 승낙을 거부하거나 계약을 취소할 수 있습니다.</p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제19조 (수신확인통지, 변경 및 취소)</h2>
              <p>회사는 회원의 구매신청 시 수신확인 안내를 제공하며, 회원은 제공 개시 전에는 변경/취소를 요청할 수 있습니다. 제공 개시 후에는 제22조(환불/청약철회) 및 별도 환불정책을 따릅니다.</p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제20조 (콘텐츠 제공)</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>디지털 콘텐츠는 결제 완료 후 즉시 제공(열람/다운로드/수강권 부여 등)될 수 있습니다.</li>
                <li>콘텐츠의 제공 방식, 이용기간, 지원 범위는 상품 상세페이지 및 운영정책에 따릅니다.</li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제21조 (환급)</h2>
              <p>회사는 제공 불가(서비스 종료, 중대한 장애, 품절 등) 사유가 발생한 경우 지체 없이 안내하고, 관련 법령 및 환불정책에 따라 환급을 진행합니다.</p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제22조 (청약철회 및 환불)</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>회사는 전자상거래 등 관련 법령이 정한 소비자 보호 기준을 준수합니다.</li>
                <li>디지털 콘텐츠 특성상 열람/다운로드/스트리밍 제공이 개시되면 청약철회가 제한될 수 있으며, 구체 기준은 상품 상세 안내 및 환불정책에 따릅니다.</li>
                <li>환불 요청은 coincraft.edu@gmail.com으로 접수하며, 회사는 처리 결과를 안내합니다.</li>
              </ol>
              <div className="mt-4 pt-4 border-t border-white/10">
                <h3 className="font-bold text-cc-text mb-3">제22조의2 (온라인 강의·디지털 자료 환불 기준)</h3>
                <ol className="space-y-2 list-decimal list-inside">
                  <li>회사는 상품별로 이용기간, 제공방식(스트리밍/다운로드), 수강진도/열람여부 등을 고려하여 환불 기준을 달리 정할 수 있으며, 이는 상품 상세페이지 및 환불정책에 명시합니다.</li>
                  <li>다운로드형 자료는 제공 개시(다운로드/열람 가능 상태 부여) 시점부터 복제가 용이한 특성상 환불이 제한될 수 있습니다.</li>
                  <li>스트리밍형 강의/멤버십은 이용 개시 후 이용분 공제 또는 잔여기간 기준 환불이 적용될 수 있으며, 구체 산식은 환불정책에 따릅니다.</li>
                </ol>
              </div>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제23조 (저작권 및 이용제한)</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>회사가 제작·제공한 콘텐츠의 저작권 및 지식재산권은 회사 또는 정당한 권리자에게 귀속됩니다.</li>
                <li>회원은 회사의 사전 서면 동의 없이 콘텐츠를 복제·배포·전송·판매·공유(계정공유 포함)할 수 없습니다.</li>
                <li>회원이 게시한 게시물의 저작권은 회원에게 귀속되나, 회원은 서비스 운영·개선·홍보를 위해 필요한 범위에서 회사에 무상의 비독점적 사용권을 부여합니다.</li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제24조 (게시물의 관리)</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>회원의 게시물로 인해 발생하는 법적 책임은 회원에게 있습니다.</li>
                <li>회사는 다음에 해당하는 게시물을 사전 통지 없이 삭제/차단할 수 있습니다.
                  <ul className="mt-2 ml-4 space-y-1 list-disc list-inside">
                    <li>명예훼손, 불법정보, 저작권 침해, 해킹/불법복제 조장</li>
                    <li>음란/폭력/혐오 등 공서양속 위반</li>
                    <li>스팸/광고/사기성 홍보</li>
                    <li>기타 운영정책 위반</li>
                  </ul>
                </li>
                <li>회원 탈퇴 후에도 게시물이 즉시 삭제되지 않을 수 있으며, 삭제 정책은 운영정책에 따릅니다.</li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제25조 (블록체인 기반 기능 및 외부 지갑 이용 관련 특칙)</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>회사는 서비스 내에서 블록체인 기반 기능(외부 지갑 연결, 서명 인증, 온체인 증명/발급, 블록체인 네트워크 연동 기능 등)을 제공할 수 있습니다.</li>
                <li>회원은 외부 지갑의 개인키/시드문구를 스스로 관리해야 하며, 회사는 이를 저장·복구·재발급할 의무가 없습니다.</li>
                <li>블록체인 네트워크의 특성상 거래 지연, 수수료 변동, 네트워크 오류/중단, 포크, 제3자 서비스 장애 등이 발생할 수 있으며, 회사는 통제 범위 밖의 사유로 인한 손해에 대해 책임을 제한합니다.</li>
                <li>회사가 제공하는 콘텐츠는 기술 학습 및 일반 정보 제공 목적이며, 특정 자산의 거래 판단을 위한 자문·추천으로 해석되지 않습니다.</li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제26조 (면책 및 책임 제한)</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>회사는 천재지변, 불가항력, 제3자 통신망 장애 등 회사의 합리적 통제 범위를 벗어난 사유로 인한 서비스 장애에 대해 책임을 지지 않습니다.</li>
                <li>회사는 회원의 귀책사유(계정 공유, 부주의, 기기/브라우저 문제, 외부 지갑 정보 분실 등)로 인한 손해에 대해 책임을 지지 않습니다.</li>
                <li>다만, 회사의 고의 또는 중대한 과실로 인한 손해는 관련 법령에 따라 처리합니다.</li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">제27조 (분쟁해결, 준거법 및 관할)</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>회사와 회원 간 분쟁이 발생한 경우 상호 성실히 협의하여 해결하도록 노력합니다.</li>
                <li>본 약관은 대한민국 법령을 준거법으로 합니다.</li>
                <li>소송이 제기될 경우 회사의 본사 소재지를 관할하는 법원을 전속 관할로 합니다.</li>
              </ol>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-lg font-bold text-cc-text mb-4">부칙</h2>
              <p>공고일자: 2026년 1월 19일<br />시행일자: 2026년 1월 19일</p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
