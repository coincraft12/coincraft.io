import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import EbookCard from '@/components/ebooks/ebook-card';

export const metadata = { title: '전자책 — COINCRAFT' };
export const dynamic = 'force-dynamic';

interface EbookListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  price: string;
  isFree: boolean;
  pageCount: number | null;
}

interface EbooksResponse {
  success: boolean;
  data: EbookListItem[];
}

async function fetchEbooks(): Promise<EbookListItem[]> {
  const API_BASE = process.env.API_INTERNAL_URL ?? 'http://localhost:4001';
  const res = await fetch(`${API_BASE}/api/v1/ebooks`, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const json: EbooksResponse = await res.json();
  return json.data;
}

export default async function EbooksPage() {
  const ebooks = await fetchEbooks();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container">
          <div className="mb-10">
            <p className="cc-label mb-2">EBOOKS</p>
            <h1 className="text-3xl md:text-4xl font-bold text-cc-text">전자책</h1>
            {ebooks.length > 0 && (
              <p className="text-cc-muted mt-2">총 {ebooks.length}권의 전자책</p>
            )}
          </div>

          {ebooks.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-5xl mb-4">📚</p>
              <p className="text-cc-muted">아직 등록된 전자책이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {ebooks.map((ebook) => (
                <EbookCard key={ebook.id} {...ebook} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
