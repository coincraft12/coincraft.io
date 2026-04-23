'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';

interface CourseOption {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
}

interface UserOption {
  id: string;
  email: string;
  name: string;
}

interface EnrollResult {
  success: boolean;
  userId: string;
  courseId: string;
  courseName: string;
  userEmail: string;
  userName: string;
}

export default function AdminEnrollPage() {
  const { user, accessToken, isLoading } = useAuthStore();

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [email, setEmail] = useState('');
  const [courseId, setCourseId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const emailInputRef = useRef<HTMLDivElement>(null);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }

  // 강좌 + 사용자 목록 로드
  useEffect(() => {
    if (!accessToken || !user || user.role !== 'admin') return;
    apiClient
      .get<{ success: boolean; data: CourseOption[] }>('/api/v1/admin/courses', { token: accessToken })
      .then((res) => setCourses(res.data))
      .catch(() => {});
    apiClient
      .get<{ success: boolean; data: UserOption[] }>('/api/v1/admin/users', { token: accessToken })
      .then((res) => setUsers(res.data))
      .catch(() => {});
  }, [accessToken, user]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emailInputRef.current && !emailInputRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = email.trim()
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(email.toLowerCase()) ||
          u.name.toLowerCase().includes(email.toLowerCase())
      )
    : users;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !courseId) {
      showToast('error', '이메일과 강좌를 모두 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: EnrollResult }>(
        '/api/v1/admin/enroll',
        { email: email.trim(), courseId },
        { token: accessToken ?? undefined }
      );
      const d = res.data;
      showToast(
        'success',
        `${d.userName}(${d.userEmail})님을 "${d.courseName}" 강좌에 무료 입과시켰습니다.`
      );
      setEmail('');
      setCourseId('');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'USER_NOT_FOUND') showToast('error', '해당 이메일의 사용자를 찾을 수 없습니다.');
        else if (err.code === 'COURSE_NOT_FOUND') showToast('error', '강좌를 찾을 수 없습니다.');
        else if (err.code === 'ALREADY_ENROLLED') showToast('error', '이미 수강 중인 강좌입니다.');
        else showToast('error', err.message);
      } else {
        showToast('error', '오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || !user) return null;

  return (
    <>
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-cc-text">무료 입과</h1>
        <p className="text-cc-muted mt-1">관리자 권한으로 특정 사용자를 강좌에 무료 입과시킵니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="cc-glass p-8 space-y-6">
            {/* 이메일 입력 + 사용자 드롭다운 */}
            <div ref={emailInputRef}>
              <label className="block text-sm font-medium text-cc-text mb-2">
                사용자 이메일 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setShowUserDropdown(true); }}
                  onFocus={() => setShowUserDropdown(true)}
                  placeholder="이메일 또는 이름으로 검색"
                  required
                  className="w-full bg-cc-primary border border-white/10 rounded-cc px-4 py-3 text-cc-text text-sm placeholder-cc-muted focus:outline-none focus:border-cc-accent"
                />
                {showUserDropdown && filteredUsers.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 bg-cc-secondary border border-white/10 rounded-cc shadow-xl max-h-60 overflow-y-auto">
                    {filteredUsers.map((u) => (
                      <li
                        key={u.id}
                        onMouseDown={() => { setEmail(u.email); setShowUserDropdown(false); }}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-white/5 cursor-pointer"
                      >
                        <span className="text-sm text-cc-text font-medium">{u.name}</span>
                        <span className="text-xs text-cc-muted ml-4">{u.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* 강좌 선택 드롭다운 */}
            <div>
              <label className="block text-sm font-medium text-cc-text mb-2">
                강좌 선택 <span className="text-red-400">*</span>
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
                className="w-full bg-cc-primary border border-white/10 rounded-cc px-4 py-3 text-cc-text text-sm focus:outline-none focus:border-cc-accent"
              >
                <option value="">-- 강좌를 선택하세요 --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}{!c.isPublished ? ' (비공개)' : ''}
                  </option>
                ))}
              </select>
              {courses.length === 0 && (
                <p className="text-xs text-cc-muted mt-1">강좌 목록을 불러오는 중...</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full cc-btn cc-btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '처리 중...' : '입과시키기'}
            </button>
      </form>
    </div>

    {/* Toast */}
    {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-sm px-5 py-3 rounded-cc shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-green-500/90 text-white'
              : 'bg-red-500/90 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}

