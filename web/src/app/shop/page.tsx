'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';


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

export default function ShopPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/books`)
      .then((r) => r.json())
      .then((json: { success: boolean; data: Book[] }) => {
        setBooks(json.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container">
          <div className="mb-10">
            <p className="cc-label mb-2">SHOP</p>
            <h1 className="text-3xl md:text-4xl font-bold text-cc-text">종이책</h1>
            <p className="text-cc-muted mt-2">COINCRAFT가 직접 집필한 도서를 만나보세요.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <Spinner size="lg" />
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-24 text-cc-muted">준비 중입니다.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-cc-secondary border border-white/10 rounded-cc overflow-hidden flex flex-col cursor-pointer hover:border-cc-accent/40 transition-colors group"
                  onClick={() => router.push(`/shop/${book.id}`)}
                >
                  {book.coverImageUrl ? (
                    <div className="aspect-[3/4] overflow-hidden bg-white/5">
                      <img
                        src={book.coverImageUrl}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[3/4] bg-white/5 flex items-center justify-center">
                      <span className="text-5xl opacity-30">📚</span>
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1 space-y-3">
                    <div className="flex-1">
                      <p className="text-xs text-cc-muted mb-1">{book.author}</p>
                      <h3 className="text-cc-text font-semibold leading-snug">{book.title}</h3>
                      {book.description && (
                        <p className="text-cc-muted text-sm mt-2 line-clamp-2">{book.description}</p>
                      )}
                    </div>
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-lg font-bold text-cc-accent">
                        {book.price.toLocaleString('ko-KR')}원
                      </span>
                      <span className="text-sm text-cc-muted group-hover:text-cc-accent transition-colors">
                        자세히 보기 →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 border-t border-white/10 pt-8">
            <p className="text-cc-muted text-sm">
              종이책은 주문 후 2~3일 이내 발송됩니다. 문의:{' '}
              <Link href="mailto:coincraft.press@gmail.com" className="text-cc-accent hover:underline">
                coincraft.press@gmail.com
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
