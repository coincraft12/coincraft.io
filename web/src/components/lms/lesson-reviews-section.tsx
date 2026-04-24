'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface Review {
  id: string;
  rating: number;
  content: string;
  userName: string;
  userAvatar: string | null;
  createdAt: string;
}

interface LessonReviewsSectionProps {
  lessonId: string;
}

export function LessonReviewsSection({ lessonId }: LessonReviewsSectionProps) {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 후기 목록 조회
  const { data: response, isLoading, refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', lessonId],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/api/v1/lessons/${lessonId}/reviews?limit=20`);
      return res;
    },
  });

  const reviews = response?.data?.reviews || [];

  // 후기 작성
  const createReview = useMutation({
    mutationFn: async () => {
      await apiClient.post(
        `/api/v1/lessons/${lessonId}/reviews`,
        { rating, content },
        { token: token ?? undefined }
      );
    },
    onSuccess: () => {
      setRating(5);
      setContent('');
      setShowForm(false);
      setError(null);
      refetchReviews();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : '후기 작성에 실패했습니다.');
    },
  });

  // 후기 삭제
  const deleteReview = useMutation({
    mutationFn: async (reviewId: string) => {
      await apiClient.delete(`/api/v1/reviews/${reviewId}`, { token: token ?? undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', lessonId] });
    },
  });

  const StarRating = ({ value, onChange, interactive = false }: { value: number; onChange?: (v: number) => void; interactive?: boolean }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => interactive && setHoveredRating(star)}
          onMouseLeave={() => interactive && setHoveredRating(0)}
          onClick={() => interactive && onChange?.(star)}
          className={`text-2xl transition ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          {(hoveredRating || value) >= star ? '★' : '☆'}
        </button>
      ))}
    </div>
  );

  const myReview = reviews?.find((r) => r.id === user?.id);

  return (
    <div className="space-y-6">
      {/* 후기 작성 */}
      {token && !myReview && (
        <div className="cc-glass p-6">
          {!showForm ? (
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowForm(true)}
              className="w-full"
            >
              ⭐ 강의 후기 작성
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-cc-text text-sm mb-2 font-medium">평점</p>
                <StarRating value={rating} onChange={setRating} interactive={true} />
              </div>
              <textarea
                placeholder="강의에 대한 솔직한 후기를 작성해주세요."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={2000}
                rows={4}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded text-cc-text placeholder-cc-muted text-sm resize-none focus:outline-none focus:border-cc-accent transition-colors"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setRating(5);
                    setContent('');
                    setShowForm(false);
                    setError(null);
                  }}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  loading={createReview.isPending}
                  disabled={!content || createReview.isPending}
                  onClick={() => createReview.mutate()}
                >
                  후기 작성
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 후기 목록 */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : reviews?.length === 0 ? (
        <p className="text-cc-muted text-center py-8">아직 후기가 없습니다. 첫 번째 후기를 작성해보세요!</p>
      ) : (
        <div className="space-y-3">
          {reviews?.map((review) => (
            <div key={review.id} className="cc-glass p-4 border border-white/10">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating value={review.rating} />
                    <span className="text-sm text-cc-muted font-medium">{review.rating}/5</span>
                  </div>
                  <p className="text-cc-text text-sm font-medium">{review.userName}</p>
                </div>
                {token && review.id === user?.id && (
                  <button
                    onClick={() => deleteReview.mutate(review.id)}
                    disabled={deleteReview.isPending}
                    className="text-cc-muted hover:text-red-400 transition disabled:opacity-50"
                    title="후기 삭제"
                  >
                    🗑️
                  </button>
                )}
              </div>
              <p className="text-cc-text text-sm">{review.content}</p>
              <p className="text-cc-muted text-xs mt-2">{new Date(review.createdAt).toLocaleDateString('ko-KR')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
