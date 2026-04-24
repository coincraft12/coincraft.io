'use client';

import { useState, use, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import { revalidateCourse } from '@/lib/revalidate';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import VimeoUploader from '@/components/ui/VimeoUploader';
import MarkdownEditor from '@/components/ui/MarkdownEditor';

interface CreateLessonBody {
  title: string;
  type: 'video' | 'text' | 'quiz';
  videoProvider?: 'youtube' | 'vimeo';
  videoUrl?: string;
  duration: number;
  isPreview: boolean;
  isPublished: boolean;
  textContent?: string;
  order: number;
}

type NotesStatus = 'none' | 'transcript_processing' | 'transcript_ready' | 'notes_processing' | 'done' | 'error';
interface NotesStatusResponse {
  success: boolean;
  data: { status: NotesStatus; hasTranscript: boolean; hasNotes: boolean };
}

interface LessonResponse {
  success: boolean;
  data: { id: string; courseId: string };
}

async function fetchVimeoDuration(url: string): Promise<number> {
  try {
    if (url.includes('vimeo.com')) {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
      if (!res.ok) return 0;
      const data = await res.json();
      return typeof data.duration === 'number' ? data.duration : 0;
    }
  } catch { return 0; }
  return 0;
}

function NotesPanel({
  lessonId,
  token,
  onNotesGenerated,
}: {
  lessonId: string;
  token: string;
  onNotesGenerated: (notes: string) => void;
}) {
  const [status, setStatus] = useState<NotesStatus>('transcript_processing');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startPolling();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  function startPolling() {
    pollRef.current = setInterval(async () => {
      try {
        const res = await apiClient.get<NotesStatusResponse>(
          `/api/v1/instructor/lessons/${lessonId}/notes-status`,
          { token }
        );
        const s = res.data.status;
        setStatus(s);
        if (s !== 'transcript_processing' && s !== 'notes_processing') {
          clearInterval(pollRef.current!);
          if (s === 'done') {
            // 생성된 노트 로드
            const lessonRes = await apiClient.get<{ success: boolean; data: { textContent: string | null } }>(
              `/api/v1/instructor/lessons/${lessonId}`,
              { token }
            );
            onNotesGenerated(lessonRes.data.textContent ?? '');
          }
        }
      } catch {
        clearInterval(pollRef.current!);
      }
    }, 3000);
  }

  async function handleGenerateNotes() {
    setStatus('notes_processing');
    try {
      await apiClient.post(`/api/v1/instructor/lessons/${lessonId}/generate-notes`, {}, { token });
      startPolling();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'transcript_processing') {
    return (
      <div className="space-y-2 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center gap-2 text-sm text-cc-muted">
          <span className="inline-block animate-spin">⟳</span>
          <span>자막 수집 중... 잠시 후 강의노트 생성 버튼이 활성화됩니다.</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1">
          <div className="bg-white/30 h-1 rounded-full animate-pulse w-1/3" />
        </div>
      </div>
    );
  }

  if (status === 'notes_processing') {
    return (
      <div className="space-y-2 p-4 bg-cc-accent/5 rounded-lg border border-cc-accent/20">
        <div className="flex items-center gap-2 text-sm text-cc-accent">
          <span className="inline-block animate-spin">⟳</span>
          <span>강의노트 작성 중...</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1">
          <div className="bg-cc-accent h-1 rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  if (status === 'transcript_ready') {
    return (
      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
        <button
          type="button"
          onClick={handleGenerateNotes}
          className="px-4 py-2 text-sm font-medium rounded bg-cc-accent/20 text-cc-accent border border-cc-accent/40 hover:bg-cc-accent/30 transition-colors"
        >
          ✨ 강의노트 자동 생성
        </button>
        <span className="text-xs text-emerald-400">자막 수집 완료 — 강의 내용을 기반으로 노트를 생성합니다</span>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
        <span className="text-sm text-emerald-400">✓ 강의노트가 아래에 자동 생성되었습니다. 수정 후 저장해주세요.</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <p className="text-sm text-amber-400 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
        자막 수집 실패 — Vimeo 자동 자막 생성에 수분이 걸릴 수 있습니다. 레슨 수정 페이지에서 다시 시도해주세요.
      </p>
    );
  }

  return null;
}

export default function NewLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const chapterId = searchParams.get('chapterId') ?? '';
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CreateLessonBody>({
    title: '',
    type: 'video',
    videoProvider: 'vimeo',
    videoUrl: '',
    duration: 0,
    isPreview: false,
    isPublished: false,
    textContent: '',
    order: 0,
  });
  const [videoDuration, setVideoDuration] = useState(0);
  const [formError, setFormError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [savedLessonId, setSavedLessonId] = useState<string | null>(null);
  const { confirmLeave } = useUnsavedChanges(isDirty && !savedLessonId);

  function markDirty(updater: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...updater }));
    setIsDirty(true);
  }

  const mutation = useMutation({
    mutationFn: async (body: CreateLessonBody) => {
      const res = await apiClient.post<LessonResponse>(
        `/api/v1/instructor/chapters/${chapterId}/lessons`,
        body,
        { token: token ?? undefined }
      );
      return res.data;
    },
    onSuccess: (data) => {
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['instructor-course', courseId] });
      revalidateCourse();
      // Vimeo 영상이면 노트 패널 표시, 아니면 바로 이동
      if (form.videoProvider === 'vimeo' && form.videoUrl) {
        setSavedLessonId(data.id);
      } else {
        router.push(`/instructor/courses/${courseId}`);
      }
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : '레슨 추가 중 오류가 발생했습니다.');
    },
  });

  // 노트 업데이트 mutation
  const updateNotesMutation = useMutation({
    mutationFn: async (textContent: string) => {
      await apiClient.put(
        `/api/v1/instructor/lessons/${savedLessonId}`,
        { textContent },
        { token: token ?? undefined }
      );
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) { setFormError('레슨 제목을 입력해 주세요.'); return; }
    if (!chapterId) { setFormError('챕터 ID가 없습니다. URL을 확인해 주세요.'); return; }
    mutation.mutate({
      ...form,
      duration: videoDuration,
      videoProvider: form.type === 'video' ? form.videoProvider : undefined,
      videoUrl: form.type === 'video' ? form.videoUrl?.trim() || undefined : undefined,
      textContent: form.textContent?.trim() || undefined,
    });
  }

  // 레슨 저장 완료 후 노트 패널 표시 단계
  if (savedLessonId) {
    return (
      <div className="max-w-2xl space-y-8">
        <div>
          <p className="cc-label mb-1">INSTRUCTOR</p>
          <h1 className="text-3xl font-bold text-cc-text">레슨 추가 완료</h1>
          <p className="text-cc-muted mt-1 text-sm">"{form.title}" 레슨이 저장되었습니다.</p>
        </div>

        <div className="space-y-4 bg-cc-secondary border border-white/10 rounded-cc p-6">
          <NotesPanel
            lessonId={savedLessonId}
            token={token ?? ''}
            onNotesGenerated={(notes) => {
              setForm((prev) => ({ ...prev, textContent: notes }));
              updateNotesMutation.mutate(notes);
            }}
          />

          {form.textContent && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-cc-text">강의노트 미리보기</label>
              <MarkdownEditor
                label=""
                value={form.textContent}
                onChange={(v) => setForm((prev) => ({ ...prev, textContent: v }))}
                height={300}
              />
              <Button
                type="button"
                loading={updateNotesMutation.isPending}
                onClick={() => updateNotesMutation.mutate(form.textContent ?? '')}
              >
                강의노트 저장
              </Button>
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/instructor/courses/${courseId}`)}
        >
          강좌로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="cc-label mb-1">INSTRUCTOR</p>
        <h1 className="text-3xl font-bold text-cc-text">레슨 추가</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-cc-secondary border border-white/10 rounded-cc p-6">
        <Input
          label="레슨 제목 *"
          placeholder="예: 스마트 컨트랙트 개요"
          value={form.title}
          onChange={(e) => markDirty({ title: e.target.value })}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-cc-text">레슨 타입</label>
          <select
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text text-sm focus:outline-none focus:border-cc-accent transition-colors"
            value={form.type}
            onChange={(e) => markDirty({ type: e.target.value as CreateLessonBody['type'] })}
          >
            <option value="video" className="text-black bg-white">영상</option>
            <option value="text" className="text-black bg-white">텍스트</option>
            <option value="quiz" className="text-black bg-white">퀴즈</option>
          </select>
        </div>

        {form.type === 'video' && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-cc-text">영상 등록 방식</label>
              <select
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text text-sm focus:outline-none focus:border-cc-accent transition-colors"
                value={form.videoProvider}
                onChange={(e) => markDirty({ videoProvider: e.target.value as CreateLessonBody['videoProvider'] })}
              >
                <option value="vimeo" className="text-black bg-white">영상 업로드</option>
                <option value="youtube" className="text-black bg-white">YouTube URL</option>
              </select>
            </div>

            {form.videoProvider === 'vimeo' ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-cc-text">영상 파일</label>
                <VimeoUploader
                  token={token ?? ''}
                  courseId={courseId}
                  onComplete={async (url) => {
                    markDirty({ videoUrl: url });
                    const duration = await fetchVimeoDuration(url);
                    if (duration > 0) setVideoDuration(duration);
                  }}
                />
                {form.videoUrl && (
                  <p className="text-xs text-cc-muted break-all">업로드 완료: {form.videoUrl}</p>
                )}
              </div>
            ) : (
              <Input
                label="YouTube URL"
                placeholder="예: https://youtu.be/xxxxx"
                value={form.videoUrl}
                onChange={(e) => markDirty({ videoUrl: e.target.value })}
                onBlur={async (e) => {
                  const duration = await fetchVimeoDuration(e.target.value);
                  setVideoDuration(duration);
                }}
              />
            )}
          </>
        )}

        <MarkdownEditor
          label={form.type === 'text' ? '텍스트 내용' : '강의노트 (선택)'}
          value={form.textContent ?? ''}
          onChange={(v) => markDirty({ textContent: v })}
          height={form.type === 'text' ? 320 : 240}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-cc-text">강의자료</label>
          <p className="text-xs text-cc-muted">레슨 저장 후 수정 페이지에서 PDF를 추가할 수 있습니다.</p>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-cc-accent" checked={form.isPreview}
              onChange={(e) => markDirty({ isPreview: e.target.checked })} />
            <span className="text-sm text-cc-text">미리보기 허용</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-cc-accent" checked={form.isPublished}
              onChange={(e) => markDirty({ isPublished: e.target.checked })} />
            <span className="text-sm text-cc-text">즉시 공개</span>
          </label>
        </div>

        {formError && <p className="text-sm text-red-400">{formError}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={mutation.isPending}>레슨 추가</Button>
          <Button type="button" variant="ghost" onClick={() => confirmLeave(() => router.back())}>취소</Button>
        </div>
      </form>
    </div>
  );
}
