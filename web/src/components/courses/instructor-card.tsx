'use client';

import { useState } from 'react';

interface Props {
  name: string;
  avatarUrl?: string | null;
  photoUrl?: string | null;
  bio?: string | null;
  specialties?: string[] | null;
}

export default function InstructorCard({ name, avatarUrl, photoUrl, bio, specialties }: Props) {
  const [expanded, setExpanded] = useState(false);
  const imgSrc = photoUrl ?? avatarUrl;

  return (
    <div className="bg-cc-secondary border border-white/10 rounded-cc p-4">
      {/* 항상 보이는 요약 */}
      <div className="flex items-center gap-4">
        {imgSrc && (
          <img
            src={imgSrc}
            alt={name}
            className="w-12 h-12 rounded-full object-contain bg-white flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-cc-text font-semibold text-sm">{name}</p>
          {specialties && specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {specialties.map((s) => (
                <span key={s} className="text-xs bg-cc-accent/20 text-cc-accent px-2 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        {bio && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-cc-muted hover:text-cc-text whitespace-nowrap flex-shrink-0 transition-colors"
          >
            {expanded ? '접기 ▲' : '자세히 ▼'}
          </button>
        )}
      </div>

      {/* 펼쳤을 때만 보이는 상세 */}
      {expanded && bio && (
        <p className="mt-3 pt-3 border-t border-white/10 text-cc-muted text-sm leading-relaxed whitespace-pre-line">
          {bio}
        </p>
      )}
    </div>
  );
}
