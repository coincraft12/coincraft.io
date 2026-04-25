'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface Question {
  id: string;
  title: string;
  content: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  createdAt: string;
  viewCount: number;
  isPrivate: boolean;
  canViewContent: boolean;
  status: 'pending' | 'ai_answering' | 'ai_answered' | 'completed';
}

interface Answer {
  id: string;
  content: string;
  type: 'ai' | 'instructor';
  userName: string | null;
  userAvatar: string | null;
  isAccepted: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  myReaction: 'helpful' | 'unhelpful' | null;
  instructorRevision: string | null;
  createdAt: string;
}

interface QASectionProps {
  lessonId: string;
  courseId: string;
  courseName: string;
  lessonTitle: string;
}

export function QASection({ lessonId, courseId, courseName, lessonTitle }: QASectionProps) {
  const token = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reactionError, setReactionError] = useState<string | null>(null);

  // 질문 목록 조회
  const { data: response, isLoading: questionsLoading, refetch: refetchQuestions } = useQuery({
    queryKey: ['questions', lessonId, token],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/api/v1/lessons/${lessonId}/questions?limit=20`, { token: token ?? undefined });
      return res;
    },
  });

  const questions = response?.data?.questions || [];

  // 질문 상세 + 답변 조회
  const { data: questionDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['question', expandedQuestion],
    queryFn: async () => {
      if (!expandedQuestion) return null;
      const res = await apiClient.get<any>(`/api/v1/questions/${expandedQuestion}`);
      return res.data;
    },
    enabled: !!expandedQuestion,
  });

  // 질문 작성
  const createQuestion = useMutation({
    mutationFn: async () => {
      await apiClient.post(
        `/api/v1/lessons/${lessonId}/questions`,
        { title, content, isPrivate },
        { token: token ?? undefined }
      );
    },
    onSuccess: () => {
      setTitle('');
      setContent('');
      setIsPrivate(false);
      setShowCreateForm(false);
      setError(null);
      refetchQuestions();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : '질문 작성에 실패했습니다.');
    },
  });

  // 답변 평가 (토글)
  const reactToAnswer = useMutation({
    mutationFn: async ({ answerId, reactionType }: { answerId: string; reactionType: 'helpful' | 'unhelpful' }) => {
      if (!token) throw new Error('로그인이 필요합니다.');
      return apiClient.post(
        `/api/v1/answers/${answerId}/reaction`,
        { reactionType },
        { token }
      );
    },
    onSuccess: () => {
      setReactionError(null);
      queryClient.invalidateQueries({ queryKey: ['question', expandedQuestion] });
    },
    onError: (err) => {
      setReactionError(err instanceof Error ? err.message : '평가 처리에 실패했습니다.');
    },
  });

  // 질문 삭제
  const deleteQuestion = useMutation({
    mutationFn: async (questionId: string) => {
      await apiClient.delete(`/api/v1/questions/${questionId}`, { token: token ?? undefined });
    },
    onSuccess: () => {
      setExpandedQuestion(null);
      refetchQuestions();
    },
  });

  // 비공개 토글
  const togglePrivacy = useMutation({
    mutationFn: async ({ questionId, isPrivate }: { questionId: string; isPrivate: boolean }) => {
      return apiClient.patch(`/api/v1/questions/${questionId}/privacy`, { isPrivate }, { token: token ?? undefined });
    },
    onSuccess: () => {
      refetchQuestions();
      queryClient.invalidateQueries({ queryKey: ['question', expandedQuestion] });
    },
  });

  return (
    <div className="space-y-6">
      {/* 질문 작성 */}
      <div className="cc-glass p-6">
        {!showCreateForm ? (
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowCreateForm(true)}
            className="w-full"
          >
            💬 새로운 질문 작성
          </Button>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="질문 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={500}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded text-cc-text placeholder-cc-muted text-sm focus:outline-none focus:border-cc-accent transition-colors"
            />
            <textarea
              placeholder="질문 내용"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              rows={4}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded text-cc-text placeholder-cc-muted text-sm resize-none focus:outline-none focus:border-cc-accent transition-colors"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <label className="flex items-center gap-2 text-sm text-cc-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded accent-cc-accent"
              />
              🔒 비공개 (강사와 나만 볼 수 있음)
            </label>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setTitle('');
                  setContent('');
                  setShowCreateForm(false);
                  setError(null);
                }}
              >
                취소
              </Button>
              <Button
                variant="primary"
                loading={createQuestion.isPending}
                disabled={!title || !content || createQuestion.isPending}
                onClick={() => createQuestion.mutate()}
              >
                질문 작성
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 질문 목록 */}
      {questionsLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : questions?.length === 0 ? (
        <p className="text-cc-muted text-center py-8">아직 질문이 없습니다. 첫 번째 질문을 작성해보세요!</p>
      ) : (
        <div className="space-y-3">
          {questions?.map((q: Question) => (
            <div key={q.id} className="cc-glass p-4 border border-white/10 hover:border-cc-accent/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                {/* 클릭 영역: 제목+메타 */}
                <button
                  onClick={() => q.canViewContent && setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                  className={`flex-1 text-left min-w-0 ${!q.canViewContent ? 'cursor-default' : ''}`}
                >
                  <h3 className="text-base font-semibold flex items-center gap-2 flex-wrap">
                    {q.canViewContent ? (
                      <>
                        <span className="text-cc-text">{q.title}</span>
                        {q.isPrivate && <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-cc-muted">🔒 비공개</span>}
                      </>
                    ) : (
                      <span className="text-cc-muted italic">🔒 비공개 질문입니다</span>
                    )}
                  </h3>
                  <p className="text-cc-muted text-sm mt-1">{q.canViewContent ? q.userName : '비공개'} · {new Date(q.createdAt).toLocaleDateString('ko-KR')}</p>
                  <p className="text-xs text-cc-muted mt-0.5">조회 {q.viewCount}</p>
                </button>

                {/* 우측: 상태뱃지 + 질문자 전용 컨트롤 */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`text-xs px-3 py-1 rounded font-medium ${
                    q.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                    q.status === 'ai_answered' ? 'bg-blue-500/20 text-blue-300' :
                    q.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                    'bg-white/10 text-cc-muted'
                  }`}>
                    {q.status === 'pending' ? '대기 중' :
                     q.status === 'ai_answering' ? 'AI 작성 중' :
                     q.status === 'ai_answered' ? 'AI 답변' :
                     q.status === 'completed' ? '완료' : '상태 미정'}
                  </span>
                  {currentUser?.id === q.userId && (
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-cc-muted cursor-pointer select-none" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={q.isPrivate}
                          onChange={(e) => togglePrivacy.mutate({ questionId: q.id, isPrivate: e.target.checked })}
                          className="w-3 h-3 rounded accent-cc-accent"
                        />
                        비공개
                      </label>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm('질문을 삭제하시겠습니까?')) deleteQuestion.mutate(q.id); }}
                        disabled={deleteQuestion.isPending}
                        className="text-xs text-red-400 hover:text-red-300 transition disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 질문 상세 */}
              {expandedQuestion === q.id && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-4">

                  {detailLoading ? (
                    <div className="flex justify-center py-4">
                      <Spinner size="sm" />
                    </div>
                  ) : questionDetail ? (
                    <>
                      <p className="text-cc-text text-sm">{questionDetail.question?.content}</p>

                      {/* 답변 목록 */}
                      {questionDetail.answers?.length === 0 ? (
                        <p className="text-cc-muted text-sm">아직 답변이 없습니다.</p>
                      ) : (
                        questionDetail.answers?.map((answer: Answer) => (
                          <div key={answer.id} className={`rounded p-4 border ${
                            answer.type === 'ai'
                              ? 'bg-blue-500/10 border-blue-500/20'
                              : 'bg-green-500/10 border-green-500/20'
                          }`}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-xs font-semibold text-cc-muted flex items-center gap-1">
                                  {answer.type === 'ai' ? '🤖 AI 답변' : '💬 강사 답변'}
                                  {answer.isAccepted && <span className="text-green-300">✓ 채택됨</span>}
                                </p>
                                <p className="text-sm text-cc-text mt-1">{answer.userName || 'AI 어시스턴트'}</p>
                              </div>
                            </div>
                            <p className="text-cc-text text-sm mb-3">{answer.content}</p>
                            <div className="flex gap-3 text-sm flex-wrap items-center">
                              <button
                                onClick={() => reactToAnswer.mutate({ answerId: answer.id, reactionType: 'helpful' })}
                                disabled={reactToAnswer.isPending}
                                className={`transition disabled:opacity-50 ${answer.myReaction === 'helpful' ? 'text-green-400 font-semibold' : 'text-cc-muted hover:text-green-400'}`}
                              >
                                👍 도움됨 ({answer.helpfulCount})
                              </button>
                              <button
                                onClick={() => reactToAnswer.mutate({ answerId: answer.id, reactionType: 'unhelpful' })}
                                disabled={reactToAnswer.isPending}
                                className={`transition disabled:opacity-50 ${answer.myReaction === 'unhelpful' ? 'text-red-400 font-semibold' : 'text-cc-muted hover:text-red-400'}`}
                              >
                                👎 도움 안 됨 ({answer.unhelpfulCount})
                              </button>
                              {reactionError && (
                                <span className="text-xs text-amber-400">{reactionError}</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
