'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Spinner from '@/components/ui/Spinner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  coverImageUrl: string | null;
  description: string | null;
  stock: number;
}

interface BookDetail {
  subtitle: string;
  description: string;
  publisher: string;
  pages: number;
  isbn: string;
  highlights: string[];
  tableOfContents: string[];
  previewFolder?: string;
  previewImages?: string[];
}

// 책별 상세 정보
const BOOK_DETAILS: Record<string, BookDetail> = {
  '온체인 시그널, 보이지 않는 시장의 진짜 움직임': {
    subtitle: '가격 차트 너머, 데이터로 시장을 읽는 실전 분석서',
    description: `『온체인 시그널』은 블록체인 위에 기록된 온체인 데이터를 통해 자금의 흐름과 시장 참여자의 행동을 읽어내는 방법을 다룬 실전 분석서다. 가격 차트만으로는 보이지 않는 실제 거래 기록과 데이터 구조를 기반으로, 암호화폐 시장이 어떻게 움직이고 있는지를 분석하는 관점을 제시한다.

이더스캔(Etherscan)과 듄 애널리틱스(Dune Analytics) 등 대표적인 온체인 분석 도구를 활용해 트랜잭션, 지갑 주소, 자금 이동 흐름을 해석하는 방법을 단계적으로 설명한다. 단순한 기술 설명이 아닌, 투자·리서치·시장 분석에 바로 적용할 수 있는 데이터 해석 프레임을 중심으로 구성되었다.

"왜 이 코인은 갑자기 올랐을까?", "누가 먼저 알고 움직인 걸까?"
이 질문에 뉴스나 소문이 아닌 데이터로 답하는 법을 안내한다.`,
    publisher: '코인크래프트',
    pages: 445,
    isbn: '9791199613812',
    highlights: [
      '이더스캔·듄 애널리틱스 실전 활용법 단계별 설명',
      '트랜잭션·지갑·자금 흐름 해석 프레임 제공',
      '고래 주소·스테이블코인·브리지 심층 분석',
      '스캠 토큰 구별법·러그풀 사례 분석 부록 수록',
    ],
    previewImages: [
      '/books/onchain-signal/앞표지.jpg',
      '/books/onchain-signal/앞날개.jpg',
      ...Array.from({ length: 12 }, (_, i) => `/books/onchain-signal/${i + 1}.jpg`),
    ],
    tableOfContents: [
      '프롤로그',
      'PART 01. 온체인 분석의 세계로',
      '  1장. 온체인이 뭐길래',
      '  2장. 온체인 분석의 기본 단위',
      'PART 02. 도구를 익히다',
      '  3장. 이더스캔',
      '  4장. Dune',
      'PART 03. 돈의 움직임을 읽는 법',
      '  5장. 브리지',
      '  6장. 스테이블코인',
      '  7장. 고래 주소',
      'PART 04. 나아가기',
      '  8장. 고급 분석을 위한 나침반',
      '  9장. 온체인 분석가로 살아가기',
      '에필로그',
      'APPENDIX (부록)',
      '  A-1. AI 에이전트 시대, 온체인 분석은 어디로 가는가',
      '  A-2. 스캠 토큰 구별법',
      '  A-3. 러그풀 사례 분석',
      '  A-4. 용어집',
      '  A-5. 참고 문헌 및 데이터 출처',
    ],
  },
  '살아남기 위한 생존전략 WEB3': {
    subtitle: '암호화폐와 Web3를 처음 접하는 이들을 위한 실전 입문서',
    description: `불안정한 시대, Web3와 암호화폐는 더 이상 일부 전문가의 영역이 아니다. 이제 기술을 이해하는가, 이해하지 못하는가에 따라 생존의 조건이 달라지고 있다.

『살아남기 위한 생존전략 WEB3』는 암호화폐와 Web3를 처음 접하는 독자들을 위해 기술적 배경부터 실제 활용까지를 체계적으로 정리한 실전 입문서다. 지갑, 거래소, 스마트 컨트랙트 등 기본 개념을 추상적인 설명이 아닌 직접 실습하며 이해할 수 있도록 구성하였다.

저자는 보안 및 암호 시스템을 전공하고, 삼성리서치 Security & Privacy 팀에서 연구원으로 근무한 경험을 바탕으로 기술적 깊이를 유지하면서도 입문자가 이해할 수 있는 언어로 Web3의 구조를 설명한다.`,
    publisher: '코인크래프트',
    pages: 321,
    isbn: '9791199613805',
    highlights: [
      '지갑·거래소·스마트 컨트랙트 직접 실습하며 이해',
      '송금, DeFi, NFT, RWA, DePIN 실생활 활용 사례 총망라',
      '삼성리서치 출신 저자가 쓴 기술 문해력 중심 입문서',
      '투자 방법이 아닌 구조 이해와 생존 전략에 집중',
    ],
    previewImages: Array.from({ length: 7 }, (_, i) => `/books/web3-survival/page-${String(i + 1).padStart(3, '0')}.jpg`),
    tableOfContents: [
      '프롤로그: 새로운 문 앞에 선 우리',
      '1장. 지금 왜 배워야 하는가',
      '  1-1. 세계는 지금 금융 전환 중',
      '  1-2. 미국의 전략 – 제도화로 주도권을 쥐다',
      '  1-3. 세계 각국의 대응 – 제도화의 현실과 속도',
      '  1-4. 블록체인 – 권력 질서를 바꾸는 힘',
      '  1-5. 기술 리터러시와 생존의 조건',
      '  1-6. Web3 – 개인에게 주어진 선택지',
      '2장. 돈이란 무엇인가: 암호화폐가 바꾼 질서',
      '  2-1. 우리가 아는 돈은 왜 바뀌었는가',
      '  2-2. 사토시 나카모토가 던진 질문',
      '  2-3. 블록체인, 새로운 신뢰의 구조',
      '  2-4. 암호화폐는 투자 수단을 넘어선다',
      '  2-5. 개인이 주인 되는 새로운 경제 시스템',
      '3장. 어떻게 작동하는가: 핵심 개념과 구조 이해',
      '  3-1. 거래소란 무엇인가',
      '  3-2. 지갑이란 무엇인가',
      '  3-3. 트랜잭션이란 무엇인가',
      '  3-4. 스마트 컨트랙트란 무엇인가',
      '  3-5. 토큰이란 무엇인가',
      '4장. 어디서, 어떻게 시작할까: 실전 입문 가이드',
      '  4-1. 중앙화 거래소 가입과 첫 구매',
      '  4-2. 지갑 만들기 실습',
      '  4-3. 탈중앙화 거래소 사용법',
      '  4-4. 트랜잭션 실습',
      '  4-5. 처음 만나는 스마트 컨트랙트',
      '  4-6. FT 토큰 발행 실습',
      '  4-7. NFT 발행 실습',
      '5장. 어디에 쓰이는가: 암호화폐의 실생활 활용',
      '  5-1. 국경 없는 송금',
      '  5-2. 디파이와 은행 없는 금융',
      '  5-3. RWA와 화폐의 디지털화',
      '  5-4. 블록체인 게임·NFT·메타버스',
      '  5-5. 탈중앙 신원과 디지털 권리',
      '  5-6. DePIN과 현실 인프라 연결',
      '6장. 함께 성장하기: Web3가 열어주는 새로운 기회',
      '  6-1. 새로운 기회의 문',
      '  6-2. 경험이 다시 살아나는 길',
      '  6-3. 은퇴 이후 열리는 또 하나의 무대',
      '  6-4. 앞으로 내가 걸어가야 할 길',
      '에필로그: 벼랑 끝에서 마주한 선택',
    ],
  },
};

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const tocRef = useRef<HTMLDivElement>(null);
  const [activePreview, setActivePreview] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<{ x: number; y: number; lensLeft: number; lensTop: number } | null>(null);
  const mainImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/books`)
      .then((r) => r.json())
      .then((json: { success: boolean; data: Book[] }) => {
        const found = json.data?.find((b) => b.id === bookId);
        if (found) setBook(found);
        else setError('도서를 찾을 수 없습니다.');
        setLoading(false);
      })
      .catch(() => { setError('도서 정보를 불러올 수 없습니다.'); setLoading(false); });
  }, [bookId]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cc-primary pt-24 flex items-center justify-center">
          <Spinner size="lg" />
        </main>
      </>
    );
  }

  if (error || !book) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cc-primary pt-24 flex items-center justify-center">
          <p className="text-red-400">{error ?? '도서를 찾을 수 없습니다.'}</p>
        </main>
      </>
    );
  }

  const details = BOOK_DETAILS[book.title];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container">
          {/* 뒤로가기 */}
          <button
            onClick={() => router.push('/shop')}
            className="flex items-center gap-2 text-cc-muted hover:text-cc-text text-sm mb-8 transition-colors"
          >
            ← 종이책 목록으로
          </button>

          {/* 상단 히어로 영역 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            {/* 표지 이미지 */}
            <div className="flex justify-center md:justify-end">
              {book.coverImageUrl ? (
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  className="w-72 md:w-80 object-cover rounded-lg shadow-2xl shadow-black/50"
                />
              ) : (
                <div className="w-72 md:w-80 aspect-[3/4] bg-cc-secondary rounded-lg flex items-center justify-center shadow-2xl">
                  <span className="text-7xl opacity-20">📚</span>
                </div>
              )}
            </div>

            {/* 책 정보 */}
            <div className="flex flex-col justify-center space-y-6">
              <div>
                <p className="cc-label mb-2">{book.author}</p>
                <h1 className="text-2xl md:text-3xl font-bold text-cc-text leading-snug">
                  {book.title}
                </h1>
                {details?.subtitle && (
                  <p className="text-cc-muted mt-2">{details.subtitle}</p>
                )}
              </div>

              {/* 도서 기본 정보 */}
              {details && (details.publisher || details.pages || details.isbn) && (
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-cc-muted">
                  {details.publisher && <span>출판사: <span className="text-cc-text">{details.publisher}</span></span>}
                  {details.pages > 0 && <span>쪽수: <span className="text-cc-text">{details.pages}p</span></span>}
                  {details.isbn && <span>ISBN: <span className="text-cc-text">{details.isbn}</span></span>}
                </div>
              )}

              {/* 하이라이트 */}
              {details?.highlights && (
                <ul className="space-y-2">
                  {details.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-cc-muted">
                      <span className="text-cc-accent mt-0.5 flex-shrink-0">✓</span>
                      {h}
                    </li>
                  ))}
                </ul>
              )}

              {/* 가격 + 구매 */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-cc-accent">
                    {book.price.toLocaleString('ko-KR')}원
                  </span>
                  <span className="text-cc-muted text-sm">· 무료 배송</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => router.push(`/checkout/book/${book.id}`)}
                    disabled={book.stock === 0}
                    className="cc-btn cc-btn-primary px-8 py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {book.stock === 0 ? '품절' : '구매하기'}
                  </button>
                  <button
                    onClick={() => router.push('/shop')}
                    className="cc-btn px-6 py-3 text-base border border-white/20 text-cc-muted hover:text-cc-text hover:border-white/40 transition-colors"
                  >
                    목록으로
                  </button>
                </div>
                <p className="text-xs text-cc-muted">주문 후 2~3일 이내 발송 · 배송 문의: contact@coincraft.io</p>
              </div>
            </div>
          </div>

          {/* 미리보기 갤러리 */}
          {details?.previewImages && details.previewImages.length > 0 && (
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-cc-text mb-4">미리보기</h2>

              {/* 메인 이미지 + 돋보기 */}
              <div className="flex gap-4 mb-3 items-start">
                {/* 메인 이미지 */}
                <div
                  className="relative bg-cc-secondary border border-white/10 rounded-cc overflow-hidden flex items-center justify-center flex-1"
                  style={{ minHeight: '480px', cursor: zoom ? 'zoom-in' : 'zoom-in' }}
                  onMouseMove={(e) => {
                    const containerRect = e.currentTarget.getBoundingClientRect();
                    const img = mainImgRef.current;
                    if (!img) return;
                    const imgRect = img.getBoundingClientRect();
                    if (
                      e.clientX < imgRect.left || e.clientX > imgRect.right ||
                      e.clientY < imgRect.top || e.clientY > imgRect.bottom
                    ) { setZoom(null); return; }
                    const x = ((e.clientX - imgRect.left) / imgRect.width) * 100;
                    const y = ((e.clientY - imgRect.top) / imgRect.height) * 100;
                    const lensLeft = e.clientX - containerRect.left;
                    const lensTop = e.clientY - containerRect.top;
                    setZoom({ x, y, lensLeft, lensTop });
                  }}
                  onMouseLeave={() => setZoom(null)}
                >
                  <img
                    ref={mainImgRef}
                    src={details.previewImages[activePreview]}
                    alt={`미리보기 ${activePreview + 1}`}
                    className="max-h-[600px] w-auto object-contain select-none"
                    draggable={false}
                  />
                  {/* 렌즈 원 */}
                  {zoom && (
                    <div
                      className="absolute pointer-events-none border-2 border-cc-accent/60 rounded-full"
                      style={{
                        width: 100,
                        height: 100,
                        left: zoom.lensLeft - 50,
                        top: zoom.lensTop - 50,
                        background: 'rgba(255,255,255,0.05)',
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.15)',
                      }}
                    />
                  )}
                </div>

                {/* 확대 뷰 */}
                {zoom && (
                  <div
                    className="hidden lg:block flex-shrink-0 bg-cc-secondary border border-cc-accent/30 rounded-cc overflow-hidden"
                    style={{
                      width: 380,
                      height: 480,
                      backgroundImage: `url(${details.previewImages[activePreview]})`,
                      backgroundSize: '300%',
                      backgroundPosition: `${zoom.x}% ${zoom.y}%`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                )}
                {/* 확대뷰 자리 유지용 (hover 아닐 때) */}
                {!zoom && (
                  <div className="hidden lg:flex flex-shrink-0 items-center justify-center bg-cc-secondary/40 border border-white/5 rounded-cc text-cc-muted/30 text-xs text-center"
                    style={{ width: 380, height: 480 }}>
                    이미지에 마우스를<br/>올려보세요
                  </div>
                )}
              </div>

              {/* 썸네일 스크롤 */}
              <div ref={galleryRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {details.previewImages.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setActivePreview(i)}
                    className={`flex-shrink-0 w-16 h-20 overflow-hidden rounded border-2 transition-colors ${
                      activePreview === i ? 'border-cc-accent' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img src={src} alt={`썸네일 ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* 이전/다음 */}
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => setActivePreview((v) => Math.max(0, v - 1))}
                  disabled={activePreview === 0}
                  className="text-sm text-cc-muted hover:text-cc-text disabled:opacity-30 transition-colors"
                >
                  ← 이전
                </button>
                <span className="text-xs text-cc-muted">
                  {activePreview + 1} / {details.previewImages.length}
                </span>
                <button
                  onClick={() => setActivePreview((v) => Math.min(details.previewImages!.length - 1, v + 1))}
                  disabled={activePreview === details.previewImages.length - 1}
                  className="text-sm text-cc-muted hover:text-cc-text disabled:opacity-30 transition-colors"
                >
                  다음 →
                </button>
              </div>
            </div>
          )}

          {/* 도서 소개 */}
          {details?.description && (
            <div className="bg-cc-secondary border border-white/10 rounded-cc p-8 mb-5">
              <h2 className="text-lg font-semibold text-cc-text mb-4">도서 소개</h2>
              <div className="text-cc-muted leading-relaxed whitespace-pre-line text-sm">
                {details.description}
              </div>
            </div>
          )}

          {/* 목차 */}
          {details?.tableOfContents && (
            <div className="bg-cc-secondary border border-white/10 rounded-cc overflow-hidden">
              <div className="px-8 pt-6 pb-2">
                <h2 className="text-lg font-semibold text-cc-text mb-4">목차</h2>
                <div className="space-y-1.5">
                  {(tocOpen ? details.tableOfContents : details.tableOfContents.slice(0, 6)).map((chapter) => {
                    const isSubItem = chapter.startsWith('  ');
                    return (
                      <div key={chapter} className={`flex items-start gap-2 text-sm ${isSubItem ? 'pl-5 text-cc-muted/70' : 'text-cc-muted font-medium'}`}>
                        <span className={`mt-1.5 flex-shrink-0 rounded-full ${isSubItem ? 'w-1 h-1 bg-white/20' : 'w-1.5 h-1.5 bg-cc-accent'}`} />
                        {chapter.trim()}
                      </div>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={() => setTocOpen((v) => !v)}
                className="w-full flex items-center justify-center gap-2 py-4 text-sm text-cc-muted hover:text-cc-text hover:bg-white/5 transition-colors border-t border-white/10 mt-3"
              >
                {tocOpen ? '접기' : `전체 보기 (${details.tableOfContents.length}개)`}
                <span className={`transition-transform duration-200 ${tocOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
