'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface QuestionWithAnswers {
  id: string;
  title: string;
  content: string;
  status: string;
  lessonTitle: string;
  courseName: string;
  userName: string;
  createdAt: string;
  answers: {
    id: string;
    type: 'ai' | 'instructor';
    content: string;
    instructorRevision?: string;
    status: string;
  }[];
}

interface Filter {
  status: 'all' | 'unanswered' | 'ai-only' | 'completed';
}

export function InstructorQADashboard() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>({ status: 'all' });
  const [revision, setRevision] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Q&A 목록 조회
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['instructor-qa', filter.status],
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/api/v1/instructor/qa?status=${filter.status}`,
        { token: token ?? undefined }
      );
      return res;
    },
  });

  const questions = response?.data?.questions || [];

  // 강사 답변 작성
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
      setSelectedQuestion(null);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['instructor-qa'] });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : '답변 작성에 실패했습니다.');
    },
  });

  const selectedQ = questions.find((q) => q.id === selectedQuestion);
  const hasAIAnswer = selectedQ?.answers.some((a) => a.type === 'ai');
  const hasInstructorAnswer = selectedQ?.answers.some((a) => a.type === 'instructor');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 질문 목록 */}
      <div className="lg:col-span-1 cc-glass overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold text-cc-text">
            💬 Q&A 관리
          </h2>
          <div className="mt-3 flex gap-2 flex-wrap">
            {['all', 'unanswered', 'ai-only', 'completed'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter({ status: s as any })}
                className={`text-xs px-3 py-1 rounded transition ${
                  filter.status === s
                    ? 'bg-cc-accent text-cc-primary'
                    : 'bg-white/10 text-cc-muted hover:bg-white/20'
                }`}
              >
                {s === 'all'
                  ? '전체'
                  : s === 'unanswered'
                    ? '미답변'
                    : s === 'ai-only'
                      ? 'AI만'
                      : '완료'}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-white/10 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : questions.length === 0 ? (
            <p className="text-cc-muted text-sm p-4 text-center">질문이 없습니다.</p>
          ) : (
            questions.map((q) => {
              const qHasAI = q.answers?.some((a) => a.type === 'ai');
              const qHasInstructor = q.answers?.some((a) => a.type === 'instructor');
              return (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuestion(q.id)}
                  className={`w-full text-left p-3 transition hover:bg-white/5 ${
                    selectedQuestion === q.id ? 'bg-white/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 mt-0.5">
                      {!qHasAI && '⚠️'}
                      {qHasInstructor && '✅'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-cc-text truncate">{q.title}</p>
                      <p className="text-xs text-cc-muted truncate">{q.courseName}</p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 질문 상세 */}
      <div className="lg:col-span-2 cc-glass p-6">
        {!selectedQuestion ? (
          <p className="text-cc-muted text-center py-12">질문을 선택해주세요.</p>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : selectedQ ? (
          <div className="space-y-6">
            {/* 질문 정보 */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-cc-text">{selectedQ.title}</h3>
                  <p className="text-sm text-cc-muted mt-1">
                    {selectedQ.courseName} • {selectedQ.userName} •{' '}
                    {new Date(selectedQ.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
              <p className="text-cc-text whitespace-pre-wrap text-sm">{selectedQ.content}</p>
            </div>

            {/* 답변 목록 */}
            {selectedQ.answers && selectedQ.answers.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                {selectedQ.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className={`rounded-lg p-4 border ${
                      answer.type === 'ai'
                        ? 'bg-blue-500/10 border-blue-500/20'
                        : 'bg-green-500/10 border-green-500/20'
                    }`}
                  >
                    <p className="text-xs font-semibold text-cc-muted mb-2">
                      {answer.type === 'ai' ? '🤖 AI 답변' : '💬 강사 답변'} • {answer.status}
                    </p>
                    <p className="text-cc-text text-sm mb-3">{answer.content}</p>

                    {answer.instructorRevision && (
                      <div className="bg-white/5 p-3 rounded text-sm border border-white/10">
                        <p className="text-cc-muted mb-2 font-medium">💭 강사 보완:</p>
                        <p className="text-cc-text">{answer.instructorRevision}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 강사 답변 작성 (AI 답변이 있는데 강사 답변이 없을 때만) */}
            {hasAIAnswer && !hasInstructorAnswer && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="font-semibold text-cc-text mb-3">강사 보완 답변</h4>
                <textarea
                  value={revision}
                  onChange={(e) => setRevision(e.target.value)}
                  placeholder="AI 답변을 검토하고 필요시 추가 설명을 입력해주세요."
                  maxLength={5000}
                  rows={4}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded text-cc-text placeholder-cc-muted text-sm resize-none focus:outline-none focus:border-cc-accent transition-colors mb-3"
                />
                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                <Button
                  variant="primary"
                  size="lg"
                  loading={submitAnswer.isPending}
                  disabled={!revision || submitAnswer.isPending}
                  onClick={() => submitAnswer.mutate(selectedQuestion)}
                  className="w-full"
                >
                  📨 답변 완료
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
