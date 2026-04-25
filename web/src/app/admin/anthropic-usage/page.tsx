'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import Spinner from '@/components/ui/Spinner';

interface UsageData {
  summary: {
    totalTokens: number;
    totalAnswers: number;
    avgTokens: number;
    thisMonthTokens: number;
    thisMonthAnswers: number;
  };
  daily: { date: string; tokens: number; answers: number }[];
  byModel: { model: string; tokens: number; count: number }[];
}

// claude-haiku-4-5: $0.80/M input + $4/M output → rough blended ~$1.6/M
// claude-sonnet-4-5/4-6: $3/M input + $15/M output → rough blended ~$7/M
const MODEL_PRICE: Record<string, number> = {
  'claude-haiku-4-5-20251001': 1.6,
  'claude-haiku-4-5': 1.6,
  'claude-sonnet-4-5': 7.0,
  'claude-sonnet-4-6': 7.0,
};

function estimateCost(model: string, tokens: number): string {
  const price = MODEL_PRICE[model] ?? 5.0;
  const usd = (tokens / 1_000_000) * price;
  return usd < 0.01 ? '< $0.01' : `$${usd.toFixed(3)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function AnthropicUsagePage() {
  const token = useAuthStore((s) => s.accessToken);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-anthropic-usage'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: UsageData }>(
        '/api/v1/admin/anthropic-usage',
        { token: token ?? undefined }
      );
      return res.data;
    },
  });

  if (isLoading) return (
    <div className="flex justify-center py-20"><Spinner /></div>
  );

  if (error || !data) return (
    <p className="text-red-400 text-sm">데이터를 불러오지 못했습니다.</p>
  );

  const { summary, daily, byModel } = data;
  const maxDailyTokens = Math.max(...daily.map((d) => d.tokens), 1);

  const totalEstimatedCost = byModel.reduce((sum, m) => {
    const price = MODEL_PRICE[m.model] ?? 5.0;
    return sum + (m.tokens / 1_000_000) * price;
  }, 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold tracking-widest text-cc-muted uppercase mb-1">Admin</p>
        <h1 className="text-2xl font-bold text-cc-text">Anthropic API 사용 현황</h1>
        <p className="text-xs text-cc-muted mt-1">Q&amp;A AI 답변 기준 · 강의노트 생성 토큰은 별도 집계되지 않음</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: '누적 토큰', value: formatTokens(summary.totalTokens), sub: '전체 기간' },
          { label: 'AI 답변 수', value: summary.totalAnswers.toLocaleString(), sub: '전체 기간' },
          { label: '답변당 평균', value: formatTokens(summary.avgTokens), sub: '토큰' },
          { label: '이번 달 토큰', value: formatTokens(summary.thisMonthTokens), sub: `${summary.thisMonthAnswers}개 답변` },
          { label: '추정 누적 비용', value: `$${totalEstimatedCost.toFixed(2)}`, sub: '입출력 70/30 추정' },
        ].map((c) => (
          <div key={c.label} className="cc-glass p-5 border border-white/10 rounded-xl">
            <p className="text-xs text-cc-muted mb-1">{c.label}</p>
            <p className="text-2xl font-bold text-cc-text">{c.value}</p>
            <p className="text-xs text-cc-muted mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* 일별 차트 (최근 30일) */}
      <div className="cc-glass p-6 border border-white/10 rounded-xl">
        <h2 className="text-sm font-semibold text-cc-text mb-5">일별 토큰 사용량 (최근 30일)</h2>
        {daily.length === 0 ? (
          <p className="text-cc-muted text-sm text-center py-8">데이터 없음</p>
        ) : (
          <div className="flex items-end gap-1 h-32 overflow-x-auto pb-1">
            {daily.map((d) => (
              <div key={d.date} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: 28 }}>
                <span className="text-xs text-cc-muted opacity-0 group-hover:opacity-100">{formatTokens(d.tokens)}</span>
                <div className="relative group w-full flex flex-col justify-end" style={{ height: 96 }}>
                  <div
                    className="w-full bg-cc-accent/60 hover:bg-cc-accent rounded-sm transition-colors cursor-default"
                    style={{ height: `${Math.max((d.tokens / maxDailyTokens) * 96, 2)}px` }}
                    title={`${d.date}\n${formatTokens(d.tokens)} 토큰 · ${d.answers}개 답변`}
                  />
                </div>
                <span className="text-xs text-cc-muted" style={{ fontSize: 9 }}>{d.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 모델별 사용 현황 */}
      <div className="cc-glass p-6 border border-white/10 rounded-xl">
        <h2 className="text-sm font-semibold text-cc-text mb-4">모델별 사용 현황</h2>
        {byModel.length === 0 ? (
          <p className="text-cc-muted text-sm">데이터 없음</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-3 text-xs text-cc-muted font-medium">모델</th>
                  <th className="text-right py-2 px-3 text-xs text-cc-muted font-medium">답변 수</th>
                  <th className="text-right py-2 px-3 text-xs text-cc-muted font-medium">토큰</th>
                  <th className="text-right py-2 px-3 text-xs text-cc-muted font-medium">추정 비용</th>
                  <th className="py-2 px-3 text-xs text-cc-muted font-medium">비율</th>
                </tr>
              </thead>
              <tbody>
                {byModel.map((m) => {
                  const pct = summary.totalTokens > 0 ? (m.tokens / summary.totalTokens) * 100 : 0;
                  return (
                    <tr key={m.model} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-3 text-cc-text font-mono text-xs">{m.model}</td>
                      <td className="py-3 px-3 text-right text-cc-muted">{m.count.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-cc-text">{formatTokens(m.tokens)}</td>
                      <td className="py-3 px-3 text-right text-cc-text">{estimateCost(m.model, m.tokens)}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/10 rounded-full h-1.5 min-w-16">
                            <div className="bg-cc-accent h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-cc-muted w-10 text-right">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/20">
                  <td className="py-3 px-3 text-xs text-cc-muted font-medium">합계</td>
                  <td className="py-3 px-3 text-right text-cc-muted">{summary.totalAnswers.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-cc-text font-medium">{formatTokens(summary.totalTokens)}</td>
                  <td className="py-3 px-3 text-right text-cc-text font-medium">${totalEstimatedCost.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <p className="text-xs text-cc-muted mt-4 opacity-60">* 비용 추정: 입력 70% / 출력 30% 가정 기준 rough estimate. 실제 비용은 Anthropic Console에서 확인하세요.</p>
      </div>
    </div>
  );
}
