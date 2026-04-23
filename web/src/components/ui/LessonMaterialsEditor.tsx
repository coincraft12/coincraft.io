'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Material {
  id: string;
  title: string;
  fileUrl: string;
  fileSize: number | null;
  fileType: string | null;
  order: number;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  lessonId: string;
  token: string;
}

export default function LessonMaterialsEditor({ lessonId, token }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ['lesson-materials', lessonId],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Material[] }>(
        `/api/v1/instructor/lessons/${lessonId}/materials`,
        { token }
      );
      return res.data;
    },
    enabled: !!lessonId && !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: async (materialId: string) => {
      await apiClient.delete(`/api/v1/instructor/lessons/${lessonId}/materials/${materialId}`, { token });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lesson-materials', lessonId] }),
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);

    try {
      // 1. S3 업로드
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/v1/instructor/upload/material', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('파일 업로드 실패');
      const uploadData = await uploadRes.json() as { success: boolean; data: { url: string; size: number } };

      // 2. DB 저장
      await apiClient.post(
        `/api/v1/instructor/lessons/${lessonId}/materials`,
        {
          title: file.name.replace(/\.[^.]+$/, ''),
          fileUrl: uploadData.data.url,
          fileSize: uploadData.data.size,
          fileType: file.name.split('.').pop()?.toLowerCase() ?? 'pdf',
        },
        { token }
      );

      qc.invalidateQueries({ queryKey: ['lesson-materials', lessonId] });
    } catch {
      setError('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-cc-text">강의자료</label>

      {materials.length > 0 && (
        <ul className="flex flex-col gap-2">
          {materials.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded text-sm">
              <span className="text-cc-text truncate flex-1 mr-2">
                {m.title}
                {m.fileSize && <span className="ml-2 text-xs text-cc-muted">{formatBytes(m.fileSize)}</span>}
              </span>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(m.id)}
                disabled={deleteMutation.isPending}
                className="text-xs text-red-400 hover:text-red-300 shrink-0"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.zip,.pptx,.docx,.xlsx"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 text-sm border border-white/20 rounded text-cc-text hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          {uploading ? '업로드 중...' : '+ PDF 추가'}
        </button>
        <p className="mt-1 text-xs text-cc-muted">PDF, ZIP, PPTX, DOCX, XLSX (최대 100MB)</p>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
