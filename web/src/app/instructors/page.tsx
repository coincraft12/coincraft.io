import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Link from 'next/link';

export const metadata = { title: '강사진 — CoinCraft' };
export const revalidate = 300;

interface InstructorProfile {
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  career: string | null;
  photoUrl: string | null;
  specialties: string[];
}

async function fetchInstructors(): Promise<InstructorProfile[]> {
  const API_BASE = process.env.API_INTERNAL_URL ?? 'http://localhost:4001';
  try {
    const res = await fetch(`${API_BASE}/api/v1/instructors`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function InstructorsPage() {
  const instructors = await fetchInstructors();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="cc-label mb-2">INSTRUCTORS</p>
              <h1 className="text-3xl md:text-4xl font-bold text-cc-text">강사진</h1>
              <p className="text-cc-muted mt-2">CoinCraft의 전문 강사진을 소개합니다.</p>
            </div>
            <Link
              href="/instructors/apply"
              className="cc-btn cc-btn-primary text-sm px-5 py-2.5"
            >
              강사 등록 신청
            </Link>
          </div>

          {instructors.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-5xl mb-4">👨‍🏫</p>
              <p className="text-cc-muted">등록된 강사가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructors.map((instructor) => (
                <InstructorCard key={instructor.id} {...instructor} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function InstructorCard({ id, name, bio, career, photoUrl, specialties }: InstructorProfile) {
  return (
    <Link href={`/instructors/${id}`} className="group block">
    <div className="cc-glass p-6 flex flex-col gap-4 transition-all duration-300 group-hover:border-cc-accent/40 group-hover:-translate-y-1">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-white flex-shrink-0">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="w-full h-full object-contain scale-110" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
          )}
        </div>
        <div>
          <h3 className="font-bold text-cc-text text-lg">{name}</h3>
          {specialties && specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {specialties.slice(0, 3).map((s) => (
                <span
                  key={s}
                  className="text-xs px-2 py-0.5 rounded-full bg-cc-accent/10 text-cc-accent border border-cc-accent/20"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {bio && (
        <p className="text-cc-muted text-sm leading-relaxed line-clamp-3">{bio}</p>
      )}

      {career && (
        <div className="border-t border-white/10 pt-4">
          <p className="text-xs text-cc-muted uppercase tracking-wider mb-1">경력</p>
          <p className="text-sm text-cc-text line-clamp-3">{career}</p>
        </div>
      )}
    </div>
    </Link>
  );
}
