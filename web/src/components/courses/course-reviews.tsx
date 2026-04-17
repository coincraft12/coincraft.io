'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import Spinner from '@/components/ui/Spinner';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
}

interface ReviewsResponse {
  success: boolean;
  data: Review[];
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-2xl transition-colors ${
            star <= (hover || value) ? 'text-yellow-400' : 'text-white/20'
          } ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function CourseReviews({ courseId }: { courseId: string }) {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['course-reviews', courseId],
    queryFn: async () => {
      const res = await apiClient.get<ReviewsResponse>(`/api/v1/courses/${courseId}/reviews`);
      return res.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(
        `/api/v1/courses/${courseId}/reviews`,
        { rating, comment: comment.trim() || undefined },
        { token: token ?? undefined }
      );
    },
    onSuccess: () => {
      setComment('');
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['course-reviews', courseId] });
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : '리뷰 등록에 실패했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      await apiClient.delete(`/api/v1/reviews/${reviewId}`, { token: token ?? undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-reviews', courseId] });
    },
  });

  const myReview = reviews?.find((r) => r.user.id === user?.id);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-cc-text">수강생 리뷰</h2>

      {/* 리뷰 작성 폼 */}
      {token && !myReview && (
        <div className="bg-cc-secondary border border-white/10 rounded-cc p-5 space-y-4">
          <p className="text-cc-text font-medium text-sm">리뷰 작성</p>
          <StarRating value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="이 강좌에 대한 솔직한 리뷰를 남겨주세요. (선택)"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-cc px-3 py-2 text-cc-text text-sm resize-none focus:outline-none focus:border-cc-accent/50 placeholder:text-cc-muted"
          />
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
          <button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
            className="px-4 py-2 bg-cc-accent text-cc-primary text-sm font-semibold rounded-cc hover:bg-cc-accent/90 disabled:opacity-50 transition-colors"
          >
            {submitMutation.isPending ? '등록 중...' : '리뷰 등록'}
          </button>
        </div>
      )}

      {/* 내 리뷰 (등록된 경우) */}
      {myReview && (
        <div className="bg-cc-accent/10 border border-cc-accent/20 rounded-cc p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StarRating value={myReview.rating} />
              <span className="text-xs text-cc-muted">내 리뷰</span>
            </div>
            <button
              onClick={() => deleteMutation.mutate(myReview.id)}
              disabled={deleteMutation.isPending}
              className="text-xs text-cc-muted hover:text-red-400 transition-colors"
            >
              삭제
            </button>
          </div>
          {myReview.comment && <p className="text-cc-text text-sm">{myReview.comment}</p>}
        </div>
      )}

      {/* 리뷰 목록 */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : !reviews || reviews.filter((r) => r.user.id !== user?.id).length === 0 ? (
        <p className="text-cc-muted text-sm py-4">아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!</p>
      ) : (
        <div className="space-y-4">
          {reviews
            .filter((r) => r.user.id !== user?.id)
            .map((review) => (
              <div key={review.id} className="bg-cc-secondary border border-white/10 rounded-cc p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-cc-text overflow-hidden">
                    {review.user.avatarUrl ? (
                      <img src={review.user.avatarUrl} alt={review.user.name} className="w-full h-full object-cover" />
                    ) : (
                      review.user.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="text-cc-text text-sm font-medium">{review.user.name}</p>
                    <StarRating value={review.rating} />
                  </div>
                  <span className="ml-auto text-xs text-cc-muted">
                    {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                {review.comment && <p className="text-cc-muted text-sm pl-11">{review.comment}</p>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
