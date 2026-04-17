'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';

export default function InstructorApplyPage() {
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !user) router.push(`/login?redirect=/instructors/apply`);
  }, [isLoading, user, router]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ bio: '', career: '' });
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function addTag(value: string) {
    const tag = value.trim().replace(/^#/, '');
    if (!tag || specialties.includes(tag) || specialties.length >= 10) return;
    setSpecialties((prev) => [...prev, tag]);
    setTagInput('');
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && specialties.length > 0) {
      setSpecialties((prev) => prev.slice(0, -1));
    }
  }

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('error', 'JPG, PNG, WEBP 파일만 업로드 가능합니다.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('error', '파일 크기는 10MB 이하여야 합니다.');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoFile || !accessToken) return null;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', photoFile);

      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
      const res = await fetch(`${apiBase}/api/v1/instructor/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? '업로드 실패');
      return json.data.url as string;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !accessToken) {
      router.push('/login?redirect=/instructors/apply');
      return;
    }
    if (!form.bio.trim() || !form.career.trim()) {
      showToast('error', '소개와 경력은 필수 입력 항목입니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        const uploaded = await uploadPhoto();
        if (!uploaded) {
          showToast('error', '사진 업로드에 실패했습니다.');
          return;
        }
        photoUrl = uploaded;
      }

      const payload: Record<string, unknown> = {
        bio: form.bio.trim(),
        career: form.career.trim(),
      };
      if (photoUrl) payload.photoUrl = photoUrl;
      if (specialties.length > 0) payload.specialties = specialties;

      await apiClient.post('/api/v1/instructors/apply', payload, { token: accessToken });
      showToast('success', '강사 신청이 완료되었습니다. 검토 후 승인됩니다.');
      setTimeout(() => router.push('/instructors'), 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        showToast('error', err.code === 'ALREADY_APPLIED' ? '이미 강사 신청이 되어 있습니다.' : err.message);
      } else {
        showToast('error', '오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-2xl">
          <div className="mb-8">
            <p className="cc-label mb-2">INSTRUCTORS</p>
            <h1 className="text-3xl font-bold text-cc-text">강사 등록 신청</h1>
            <p className="text-cc-muted mt-2">신청서를 제출하면 검토 후 승인됩니다.</p>
          </div>

          <form onSubmit={handleSubmit} className="cc-glass p-8 space-y-6">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-cc-muted mb-2">이름</label>
              <input
                type="text"
                value={user?.name ?? '로그인이 필요합니다'}
                disabled
                className="w-full bg-cc-primary border border-white/10 rounded-cc px-4 py-3 text-cc-muted text-sm cursor-not-allowed"
              />
            </div>

            {/* 프로필 사진 업로드 */}
            <div>
              <label className="block text-sm font-medium text-cc-text mb-2">
                프로필 사진 <span className="text-cc-muted text-xs">(선택 · JPG/PNG/WEBP · 10MB 이하)</span>
              </label>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="미리보기"
                    className="w-20 h-20 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-cc-secondary border border-white/10 flex items-center justify-center text-cc-muted text-xs">
                    미리보기
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="cc-btn cc-btn-secondary text-sm px-4 py-2"
                  >
                    {photoFile ? '사진 변경' : '사진 선택'}
                  </button>
                  {photoFile && (
                    <p className="text-xs text-cc-muted mt-1">{photoFile.name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 소개 */}
            <div>
              <label className="block text-sm font-medium text-cc-text mb-2">
                소개 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="블록체인/WEB3 분야에서의 전문성과 강의 방향을 소개해주세요. (최소 10자)"
                rows={4}
                required
                minLength={10}
                className="w-full bg-cc-primary border border-white/10 rounded-cc px-4 py-3 text-cc-text text-sm placeholder-cc-muted focus:outline-none focus:border-cc-accent resize-none"
              />
            </div>

            {/* 경력 */}
            <div>
              <label className="block text-sm font-medium text-cc-text mb-2">
                경력 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.career}
                onChange={(e) => setForm((f) => ({ ...f, career: e.target.value }))}
                placeholder="주요 경력, 프로젝트, 자격증 등을 입력해주세요."
                rows={4}
                required
                minLength={5}
                className="w-full bg-cc-primary border border-white/10 rounded-cc px-4 py-3 text-cc-text text-sm placeholder-cc-muted focus:outline-none focus:border-cc-accent resize-none"
              />
            </div>

            {/* 전문 분야 태그 */}
            <div>
              <label className="block text-sm font-medium text-cc-text mb-1">
                전문 분야 <span className="text-cc-muted text-xs">(선택 · 최대 10개)</span>
              </label>
              <p className="text-xs text-cc-muted mb-2">Enter 또는 쉼표로 태그 추가, Backspace로 마지막 태그 삭제</p>
              <div
                className="flex flex-wrap gap-2 w-full bg-cc-primary border border-white/10 rounded-cc px-3 py-2 min-h-[46px] cursor-text focus-within:border-cc-accent transition-colors"
                onClick={() => document.getElementById('tag-input')?.focus()}
              >
                {specialties.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 bg-cc-accent/20 text-cc-accent text-xs px-2 py-1 rounded-full">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setSpecialties((prev) => prev.filter((t) => t !== tag))}
                      className="hover:text-white leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {specialties.length < 10 && (
                  <input
                    id="tag-input"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => addTag(tagInput)}
                    placeholder={specialties.length === 0 ? '예: 블록체인, DeFi, Solidity' : ''}
                    className="flex-1 min-w-[120px] bg-transparent text-cc-text text-sm placeholder-cc-muted focus:outline-none"
                  />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isUploading || !user}
              className="w-full cc-btn cc-btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? '사진 업로드 중...' : isSubmitting ? '신청 중...' : '강사 신청하기'}
            </button>

            {!user && (
              <p className="text-center text-sm text-cc-muted">
                <a href="/login?redirect=/instructors/apply" className="text-cc-accent hover:underline">로그인</a>
                {' '}후 신청할 수 있습니다.
              </p>
            )}
          </form>
        </div>
      </main>
      <Footer />

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-cc shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </>
  );
}
