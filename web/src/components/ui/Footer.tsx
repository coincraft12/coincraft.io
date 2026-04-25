import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-[#1a1a2e] border-t border-white/10">

      {/* 투자정보 면책 */}
      <div className="border-b border-white/10 py-4 text-center">
        <p className="text-sm font-bold text-cc-text px-4">
          코인크래프트는 블록체인/WEB3 기술 교육 플랫폼이며 투자정보/거래중개를 제공하지 않습니다.
        </p>
      </div>

      {/* 메인 푸터 — 3열 */}
      <div className="max-w-cc mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-10">

          {/* 1열: 로고 */}
          <div className="flex items-start justify-center md:justify-start">
            <Image src="/logo-footer-v4.png" alt="COINCRAFT" width={220} height={220} className="w-56 object-contain" />
          </div>

          {/* 2열: 연락처 */}
          <div>
            <ul className="space-y-3 text-base text-cc-muted">
              <li className="flex items-center gap-2">
                <span className="text-cc-accent">📞</span>
                고객센터 02-515-0407
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cc-accent">✉</span>
                contact@coincraft.io
              </li>
              <li>
                <a
                  href="http://pf.kakao.com/_xhPxdxgn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-cc-text transition-colors"
                >
                  <span className="text-cc-accent">💬</span>
                  (09:00~18:00) 빠른 상담은 카톡 플러스 친구
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/channel/UCT7SwOLZfnx-1zxAprRTQNg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-cc-text transition-colors"
                >
                  <span className="text-cc-accent">▶</span>
                  YouTube
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/coincraft.labs/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-cc-text transition-colors"
                >
                  <span className="text-cc-accent">📷</span>
                  Instagram
                </a>
              </li>
            </ul>
          </div>

          {/* 3열: 법무 링크 + 카카오 버튼 */}
          <div className="flex flex-col gap-4">
            <ul className="space-y-3 text-base text-cc-muted">
              <li>
                <a href="/terms" className="flex items-center gap-2 hover:text-cc-text transition-colors">
                  <span className="text-cc-accent">📄</span>이용약관
                </a>
              </li>
              <li>
                <a href="/privacy" className="flex items-center gap-2 hover:text-cc-text transition-colors">
                  <span className="text-cc-accent">🔒</span>개인정보처리방침
                </a>
              </li>
              <li>
                <a href="/refund" className="flex items-center gap-2 hover:text-cc-text transition-colors">
                  <span className="text-cc-accent">💳</span>환불정책
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-[#666]">
                <span>🚫</span>
                ⓒ COINCRAFT, 강의 예제, 영상 복제 금지
              </li>
            </ul>

            {/* 카카오 노란색 버튼 */}
            <a
              href="http://pf.kakao.com/_xhPxdxgn/chat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-sm font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#FEE500', color: '#191919' }}
            >
              <svg viewBox="0 0 512 512" className="w-4 h-4 flex-shrink-0" fill="currentColor" aria-hidden="true">
                <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm144 276c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92h-92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z" />
              </svg>
              문의ㆍ상담은 플러스 친구 코인크래프트
            </a>
          </div>

        </div>
      </div>

      {/* 사업자 정보 */}
      <div className="border-t border-white/10 py-6 px-6">
        <div className="max-w-cc mx-auto text-xs text-[#878787] leading-relaxed text-center space-y-1">
          <p>
            (주)코인크래프트 | 대표자: 김응준 | 사업자등록번호: 573-86-03834 &nbsp;
            [<a href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=5738603834" target="_blank" rel="noopener noreferrer" className="underline hover:text-cc-muted transition-colors">사업자 정보 확인</a>]
          </p>
          <p>
            통신판매업: 2026-서울강남-00160 | 개인정보보호책임자: 김응준 | 이메일: contact@coincraft.io
          </p>
          <p>
            전화번호: 02-515-0407 | 주소: 서울특별시 강남구 강남대로112길 47, 2층 J721호(논현동)
          </p>
          <p className="pt-1">© COINCRAFT. ALL RIGHT RESERVED</p>
        </div>
      </div>

    </footer>
  )
}
