'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

const LEVELS = [
  { value: '', label: '전체 레벨' },
  { value: 'beginner', label: '입문' },
  { value: 'intermediate', label: '중급' },
  { value: 'advanced', label: '고급' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
];

export default function CourseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      params.delete('page'); // reset page on filter change
      return params.toString();
    },
    [searchParams]
  );

  function updateFilter(key: string, value: string) {
    router.push(`${pathname}?${createQueryString({ [key]: value })}`);
  }

  const level = searchParams.get('level') ?? '';
  const isFree = searchParams.get('isFree') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      <select
        value={level}
        onChange={(e) => updateFilter('level', e.target.value)}
        className="bg-cc-secondary border border-white/10 text-cc-text text-sm rounded-cc px-3 py-2 focus:outline-none focus:border-cc-accent"
      >
        {LEVELS.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>

      <button
        onClick={() => updateFilter('isFree', isFree === 'true' ? '' : 'true')}
        className={`px-4 py-2 rounded-cc text-sm border transition-colors ${
          isFree === 'true'
            ? 'bg-cc-accent text-cc-primary border-cc-accent font-semibold'
            : 'border-white/10 text-cc-muted hover:border-cc-accent hover:text-cc-accent'
        }`}
      >
        무료 강좌
      </button>

      <div className="ml-auto">
        <select
          value={sort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="bg-cc-secondary border border-white/10 text-cc-text text-sm rounded-cc px-3 py-2 focus:outline-none focus:border-cc-accent"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
