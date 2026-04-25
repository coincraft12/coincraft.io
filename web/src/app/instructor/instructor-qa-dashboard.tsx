'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface QuestionSummary {
  id: string;
  title: string;
  status: string;
  viewCount: number;
  createdAt: string;
  lessonTitle: string | null;
  courseName: string | null;
  userName: string | null;
  answerCount: number;
  hasAIAnswer: boolean;
  hasInstructorAnswer: boolean;
  isPrivate: boolean;
}

interface Answer {
  id: string;
  type: 'ai' | 'instructor';
  content: string;
  status: string;
  helpfulCount: number;
  unhelpfulCount: number;
  instructorRevision: string | null;
  createdAt: string;
  userName: string | null;
}

interface QuestionDetail {
  question: {
    id: string;
    title: string;
    content: string;
    userName: string | null;
    createdAt: string;
    viewCount: number;
  };
  answers: Answer[];
}

type FilterStatus = 'all' | 'unanswered' | 'completed';

const FILTER_LABELS: Record<FilterStatus, string> = {
  all: '전체',
  unanswered: '미답변',
  completed: '완료',
};

function StatusBadge({ q }: { q: QuestionSummary }) {
  if (q.hasInstructorAnswer) {
    return <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">완료</span>;
  }
  if (q.hasAIAnswer) {
    return <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">AI</span>;
  }
  return <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">미답변</span>;
}

export function InstructorQADashboard() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [revision, setRevision] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFilterChange(f: FilterStatus) {
    setFilter(f);
    setSelectedId(null);
    setRevision('');
    setIsEditing(false);
    setError(null);
  }

  // 질문 목록
  const { data: listRes, isLoading: listLoading } = useQuery({
    queryKey: ['instructor-qa', filter],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: { questions: QuestionSummary[] } }>(
        `/api/v1/instructor/qa?status=${filter}`,
        { token: token ?? undefined }
      );
      return res.data.questions;
    },
  });

  const questions = listRes ?? [];

  // 선택된 질문 상세 + 답변 (질문 바꿀 때 이전 데이터 즉시 제거)
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['instructor-qa-detail', selectedId],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: QuestionDetail }>(
        `/api/v1/questions/${selectedId}`,
        { token: token ?? undefined }
      );
      return res.data;
    },
    enabled: !!selectedId,
    placeholderData: undefined,
  });

  const selectedSummary = questions.find((q) => q.id === selectedId);
  const aiAnswer = detail?.answers.find((a) => a.type === 'ai');
  const instructorAnswer = detail?.answers.find((a) => a.type === 'instructor');

  // 강사 답변 작성/수정
  const submitAnswer = useMutation({
    mutationFn: async (questionId: string) => {
      await apiClient.post(
        `/api/v1/questions/${questionId}/instructor-answer`,
        { instructorRevision: revision },
        { token: token ?? undefined }
      );
    },
    onSuccess: () => {
      setRevision('');
      setIsEditing(false);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['instructor-qa'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-qa-detail', selectedId] });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : '답변 작성에 실패했습니다.');
    },
  });

  function handleSelectQuestion(id: string) {
    setSelectedId(id);
    setRevision('');
    setIsEditing(false);
    setError(null);
  }

  function handleStartAnswer() {
    setRevision(instructorAnswer?.instructorRevision ?? '');
    setIsEditing(true);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-220px)] min-h-[600px]">
      {/* 질문 목록 */}
      <div className="lg:col-span-2 flex flex-col bg-cc-secondary border border-white/10 rounded-cc overflow-hidden">
        <div className="p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-cc-text">질문 목록</h2>
            <span className="text-xs text-cc-muted">{questions.length}건</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(Object.keys(FILTER_LABELS) as FilterStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => handleFilterChange(s)}
                className={`text-xs px-3 py-1 rounded transition ${
                  filter === s
                    ? 'bg-cc-accent text-cc-primary font-medium'
                    : 'bg-white/10 text-cc-muted hover:bg-white/20'
                }`}
              >
                {FILTER_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {listLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="sm" />
            </div>
          ) : questions.length === 0 ? (
            <p className="text-cc-muted text-sm p-6 text-center">질문이 없습니다.</p>
          ) : (
            questions.map((q) => (
              <button
                key={q.id}
                onClick={() => handleSelectQuestion(q.id)}
                className={`w-full text-left p-4 transition hover:bg-white/5 ${
                  selectedId === q.id ? 'bg-white/10 border-l-2 border-cc-accent' : 'border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium text-cc-text line-clamp-2 flex-1">
                    {q.isPrivate && <span className="mr-1">🔒</span>}{q.title}
                  </p>
                  <StatusBadge q={q} />
                </div>
                <p className="text-xs text-cc-muted truncate">
                  {q.courseName}{q.lessonTitle ? ` · ${q.lessonTitle}` : ''}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-cc-muted">{q.userName ?? '익명'}</span>
                  <span className="text-xs text-cc-muted">·</span>
                  <span className="text-xs text-cc-muted">
                    {new Date(q.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                  {q.answerCount > 0 && (
                    <>
                      <span className="text-xs text-cc-muted">·</span>
                      <span className="text-xs text-cc-muted">답변 {q.answerCount}</span>
                    </>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 질문 상세 + 답변 */}
      <div className="lg:col-span-3 flex flex-col bg-cc-secondary border border-white/10 rounded-cc overflow-hidden">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-cc-muted text-sm">왼쪽에서 질문을 선택하세요.</p>
          </div>
        ) : detailLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner />
          </div>
        ) : detail ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 질문 */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-xl font-bold text-cc-text">{detail.question.title}</h3>
                {selectedSummary && <StatusBadge q={selectedSummary} />}
              </div>
              <p className="text-xs text-cc-muted mb-4">
                {selectedSummary?.courseName} {selectedSummary?.lessonTitle ? `· ${selectedSummary.lessonTitle}` : ''} ·{' '}
                {detail.question.userName ?? '익명'} ·{' '}
                {new Date(detail.question.createdAt).toLocaleDateString('ko-KR')} ·{' '}
                조회 {detail.question.viewCount}
              </p>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-cc-text text-sm whitespace-pre-wrap">{detail.question.content}</p>
              </div>
            </div>

            {/* AI 답변 */}
            {aiAnswer && (
              <div className="rounded-lg p-4 border bg-blue-500/10 border-blue-500/20">
                <p className="text-xs font-semibold text-blue-300 mb-3">🤖 AI 답변</p>
                <p className="text-cc-text text-sm whitespace-pre-wrap">{aiAnswer.content.replace(/\*\*\*([^*]+)\*\*\*/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*\n]+)\*/g, '$1').replace(/_([^_\n]+)_/g, '$1').replace(/^#{1,6}\s+/gm, '').replace(/^[-*]\s+/gm, '• ').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')}</p>
                <div className="flex gap-4 mt-3 pt-3 border-t border-white/10 text-xs text-cc-muted">
                  <span>👍 {aiAnswer.helpfulCount}</span>
                  <span>👎 {aiAnswer.unhelpfulCount}</span>
                </div>
              </div>
            )}

            {/* 강사 기존 답변 */}
            {instructorAnswer && !isEditing && (
              <div className="rounded-lg p-4 border bg-emerald-500/10 border-emerald-500/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-emerald-300">💬 강사 답변</p>
                  <button
                    type="button"
                    onClick={handleStartAnswer}
                    className="text-xs text-cc-muted hover:text-cc-text transition"
                  >
                    수정
                  </button>
                </div>
                <p className="text-cc-text text-sm whitespace-pre-wrap">{instructorAnswer.content}</p>
                <div className="flex gap-4 mt-3 pt-3 border-t border-white/10 text-xs text-cc-muted">
                  <span>👍 {instructorAnswer.helpfulCount}</span>
                  <span>👎 {instructorAnswer.unhelpfulCount}</span>
                </div>
              </div>
            )}

            {/* 답변 작성/수정 폼 */}
            {(!instructorAnswer || isEditing) && (
              <div className="pt-2 border-t border-white/10 space-y-3">
                <h4 className="font-semibold text-cc-text text-sm">
                  {instructorAnswer ? '강사 답변 수정' : '강사 답변 작성'}
                </h4>
                {aiAnswer && !instructorAnswer && (
                  <p className="text-xs text-cc-muted">AI 답변을 검토하고 필요시 추가 설명을 입력해주세요.</p>
                )}
                <textarea
                  value={revision}
                  onChange={(e) => setRevision(e.target.value)}
                  placeholder="학생에게 전달할 답변을 입력하세요."
                  maxLength={5000}
                  rows={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded text-cc-text placeholder-cc-muted text-sm resize-none focus:outline-none focus:border-cc-accent transition-colors"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-cc-muted">{revision.length}/5000</span>
                  <div className="flex gap-2">
                    {isEditing && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => { setIsEditing(false); setRevision(''); setError(null); }}
                      >
                        취소
                      </Button>
                    )}
                    <Button
                      type="button"
                      loading={submitAnswer.isPending}
                      disabled={!revision.trim() || submitAnswer.isPending}
                      onClick={() => submitAnswer.mutate(selectedId)}
                    >
                      {instructorAnswer ? '수정 완료' : '답변 등록'}
                    </Button>
                  </div>
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
