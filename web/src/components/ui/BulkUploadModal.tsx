'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import Spinner from './Spinner';

interface UploadItem {
  localId: string;
  uploadId: string;
  filename: string;
  status: 'uploading' | 'processing' | 'done' | 'error';
  progress: number;
  errorMsg?: string;
}

interface BulkUploadRecord {
  id: string;
  filename: string;
  status: string;        // uploading | processing | done | error
  videoUri: string | null;
  vimeoUrl: string | null;
  lessonId: string | null;
  createdAt: string;
}

interface ChapterInfo {
  id: string;
  title: string;
}

interface Props {
  token: string;
  courseId: string;
  chapters: ChapterInfo[];
  onClose: () => void;
  onGenerated: () => void;
}

export default function BulkUploadModal({ token, courseId, chapters, onClose, onGenerated }: Props) {
  const [tab, setTab] = useState<'unlinked' | 'linked'>('unlinked');
  const [activeUploads, setActiveUploads] = useState<UploadItem[]>([]);
  const [dbRecords, setDbRecords] = useState<BulkUploadRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragOver, setIsDragOver] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('새 챕터');
  const [targetChapterId, setTargetChapterId] = useState<string>('__new__');
  const [showGenOptions, setShowGenOptions] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadDbRecords = useCallback(async () => {
    try {
      const res = await apiClient.get<{ success: boolean; data: BulkUploadRecord[] }>(
        `/api/v1/instructor/upload/bulk-uploads?courseId=${courseId}`,
        { token }
      );
      setDbRecords(res.data);
    } catch { /* silent */ }
  }, [courseId, token]);

  // 모달 열릴 때 목록 로드
  useEffect(() => { loadDbRecords(); }, [loadDbRecords]);

  // "상태 확인" — processing 상태인 모든 레코드를 한 번씩 체크
  const checkProcessing = useCallback(async () => {
    const processing = dbRecords.filter((r) => r.status === 'processing' && r.videoUri);
    if (processing.length === 0) return;
    setChecking(true);
    await Promise.all(
      processing.map(async (r) => {
        try {
          const res = await apiClient.get<{ success: boolean; data: { status: string; vimeoUrl: string | null } }>(
            `/api/v1/instructor/upload/vimeo-status?videoUri=${encodeURIComponent(r.videoUri!)}`,
            { token }
          );
          if (res.data.status === 'available' && res.data.vimeoUrl) {
            await apiClient.patch(
              `/api/v1/instructor/upload/bulk-uploads/${r.id}`,
              { status: 'done', vimeoUrl: res.data.vimeoUrl },
              { token }
            ).catch(() => {});
          }
        } catch { /* silent */ }
      })
    );
    await loadDbRecords();
    setChecking(false);
  }, [dbRecords, token, loadDbRecords]);

  async function uploadFile(file: File) {
    const localId = crypto.randomUUID();

    let uploadId = '';
    let uploadLink = '';
    let videoUri = '';
    try {
      const init = await apiClient.post<{
        success: boolean;
        data: { uploadId: string; uploadLink: string; videoUri: string };
      }>(
        '/api/v1/instructor/upload/bulk-vimeo-init',
        { size: file.size, filename: file.name, courseId },
        { token }
      );
      uploadId = init.data.uploadId;
      uploadLink = init.data.uploadLink;
      videoUri = init.data.videoUri;
    } catch (err) {
      setActiveUploads((prev) => [...prev, {
        localId, uploadId: '', filename: file.name,
        status: 'error', progress: 0,
        errorMsg: err instanceof Error ? err.message : '초기화 실패',
      }]);
      return;
    }

    setActiveUploads((prev) => [...prev, {
      localId, uploadId, filename: file.name, status: 'uploading', progress: 0,
    }]);

    const { Upload } = await import('tus-js-client');
    try {
      await new Promise<void>((resolve, reject) => {
        const upload = new Upload(file, {
          uploadUrl: uploadLink,
          chunkSize: 128 * 1024 * 1024,
          retryDelays: [0, 1000, 3000, 5000],
          metadata: { filename: file.name, filetype: file.type },
          onProgress(uploaded, total) {
            setActiveUploads((prev) => prev.map((it) =>
              it.localId === localId
                ? { ...it, progress: Math.round((uploaded / total) * 100) }
                : it
            ));
          },
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        });
        upload.start();
      });

      // TUS 전송 완료 → DB에 'processing' 기록하고 끝 (폴링 없음)
      await apiClient.patch(
        `/api/v1/instructor/upload/bulk-uploads/${uploadId}`,
        { status: 'processing' },
        { token }
      ).catch(() => {});

      setActiveUploads((prev) => prev.map((it) =>
        it.localId === localId ? { ...it, status: 'processing' } : it
      ));

      // 목록 새로고침 후 처리 중 항목 상태 확인
      await loadDbRecords();

    } catch (err) {
      setActiveUploads((prev) => prev.map((it) =>
        it.localId === localId
          ? { ...it, status: 'error', errorMsg: err instanceof Error ? err.message : '업로드 실패' }
          : it
      ));
    }
  }

  function handleFiles(files: FileList | File[]) {
    Array.from(files)
      .filter((f) => f.type.startsWith('video/') || f.name.match(/\.(mp4|mkv|m4v|mov|avi|webm)$/i))
      .forEach((f) => uploadFile(f));
  }

  async function handleDelete(record: BulkUploadRecord) {
    try {
      await apiClient.delete(`/api/v1/instructor/upload/bulk-uploads/${record.id}`, { token });
      setDbRecords((prev) => prev.filter((r) => r.id !== record.id));
      setSelectedIds((prev) => { const s = new Set(prev); s.delete(record.id); return s; });
    } catch { /* silent */ }
  }

  async function handleGenerate() {
    const doneRecords = dbRecords.filter(
      (r) => r.status === 'done' && !r.lessonId && selectedIds.has(r.id)
    );
    if (doneRecords.length === 0) return;
    setGenerating(true);
    try {
      await apiClient.post('/api/v1/instructor/upload/bulk-generate', {
        courseId,
        uploadIds: doneRecords.map((r) => r.id),
        chapterTitle: targetChapterId === '__new__' ? chapterTitle : '(existing)',
        chapterId: targetChapterId !== '__new__' ? targetChapterId : undefined,
      }, { token });
      await loadDbRecords();
      setSelectedIds(new Set());
      setShowGenOptions(false);
      onGenerated();
    } catch (err) {
      alert(err instanceof Error ? err.message : '생성 실패');
    } finally {
      setGenerating(false);
    }
  }

  const unlinked = dbRecords.filter((r) => !r.lessonId);
  const linked = dbRecords.filter((r) => r.lessonId);
  const currentList = tab === 'unlinked' ? unlinked : linked;
  const processingCount = dbRecords.filter((r) => r.status === 'processing').length;
  const selectedDoneCount = dbRecords.filter(
    (r) => r.status === 'done' && !r.lessonId && selectedIds.has(r.id)
  ).length;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  function toggleAll() {
    const ids = unlinked.filter((r) => r.status === 'done').map((r) => r.id);
    if (ids.every((id) => selectedIds.has(id)) && ids.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ids));
    }
  }

  const inProgressUploads = activeUploads.filter((it) => it.status === 'uploading' || it.status === 'processing');
  const failedUploads = activeUploads.filter((it) => it.status === 'error');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-cc-secondary border border-white/10 rounded-cc w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-cc-text">영상 일괄 업로드</h2>
          <button onClick={onClose} className="text-cc-muted hover:text-cc-text transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* 드롭존 */}
        <div
          className={`mx-6 mt-4 border-2 border-dashed rounded-lg px-4 py-8 text-center transition-colors cursor-pointer ${
            isDragOver ? 'border-cc-accent bg-cc-accent/5' : 'border-white/20 hover:border-white/40'
          }`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files); }}
        >
          <div className="text-4xl mb-2">☁️</div>
          <p className="text-sm text-cc-muted">파일을 여기에 드래그하거나 클릭하세요.</p>
          <p className="text-xs text-cc-muted/60 mt-1">mp4, mkv, m4v, mov 형식, 파일당 최대 5GB</p>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }}
          />
        </div>

        {/* 업로드 진행 중 항목 */}
        {(inProgressUploads.length > 0 || failedUploads.length > 0) && (
          <div className="mx-6 mt-3 space-y-1.5">
            {inProgressUploads.map((it) => (
              <div key={it.localId} className="bg-white/5 rounded px-3 py-2">
                <div className="flex justify-between text-xs text-cc-muted mb-1">
                  <span className="truncate max-w-[70%]">{it.filename}</span>
                  <span>{it.status === 'uploading' ? `${it.progress}%` : '전송 완료, 처리 대기 중'}</span>
                </div>
                {it.status === 'uploading' && (
                  <div className="w-full h-1.5 bg-white/10 rounded-full">
                    <div className="h-full bg-cc-accent rounded-full transition-all" style={{ width: `${it.progress}%` }} />
                  </div>
                )}
              </div>
            ))}
            {failedUploads.map((it) => (
              <div key={it.localId} className="bg-red-500/10 rounded px-3 py-2">
                <div className="flex justify-between text-xs">
                  <span className="text-red-400 truncate max-w-[70%]">{it.filename}</span>
                  <span className="text-red-400">{it.errorMsg ?? '업로드 실패'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 처리 중 안내 + 상태 확인 버튼 */}
        {processingCount > 0 && (
          <div className="mx-6 mt-3 flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 rounded px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm text-yellow-400">
              <Spinner size="sm" />
              <span>처리 중인 영상 {processingCount}개 — 완료까지 수 분~수십 분 소요</span>
            </div>
            <button
              onClick={checkProcessing}
              disabled={checking}
              className="text-xs text-cc-accent hover:underline whitespace-nowrap ml-3 disabled:opacity-50"
            >
              {checking ? '확인 중...' : '상태 확인'}
            </button>
          </div>
        )}

        {/* 탭 */}
        <div className="flex items-center gap-1 px-6 mt-4 border-b border-white/10">
          {(['unlinked', 'linked'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors ${
                tab === t ? 'border-cc-accent text-cc-accent' : 'border-transparent text-cc-muted hover:text-cc-text'
              }`}
            >
              {t === 'unlinked' ? `미연결 (${unlinked.length})` : `연결됨 (${linked.length})`}
            </button>
          ))}
          <button
            onClick={loadDbRecords}
            className="ml-auto text-xs text-cc-muted hover:text-cc-text transition-colors px-2 py-2"
            title="새로고침"
          >
            ↻
          </button>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto px-6 py-3 min-h-[120px]">
          {currentList.length === 0 ? (
            <p className="text-sm text-cc-muted text-center py-8">
              {tab === 'unlinked' ? '미연결 영상이 없습니다.' : '연결된 영상이 없습니다.'}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-cc-muted border-b border-white/10">
                  {tab === 'unlinked' && (
                    <th className="w-8 pb-2">
                      <input
                        type="checkbox"
                        className="accent-cc-accent"
                        checked={unlinked.filter((r) => r.status === 'done').every((r) => selectedIds.has(r.id)) && unlinked.some((r) => r.status === 'done')}
                        onChange={toggleAll}
                      />
                    </th>
                  )}
                  <th className="text-left pb-2 font-normal">파일명</th>
                  <th className="text-left pb-2 font-normal w-32">업로드일</th>
                  <th className="w-16 pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {currentList.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/3">
                    {tab === 'unlinked' && (
                      <td className="py-2 pr-2">
                        {r.status === 'done' && (
                          <input type="checkbox" className="accent-cc-accent"
                            checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} />
                        )}
                        {r.status === 'processing' && <Spinner size="sm" />}
                        {r.status === 'uploading' && <Spinner size="sm" />}
                        {r.status === 'error' && <span className="text-red-400 text-xs">✗</span>}
                      </td>
                    )}
                    <td className="py-2 text-cc-text">
                      <span className="truncate block max-w-[280px]">{r.filename}</span>
                      {r.status === 'processing' && (
                        <span className="text-xs text-yellow-400">처리 중</span>
                      )}
                    </td>
                    <td className="py-2 text-cc-muted text-xs whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 text-right">
                      {tab === 'unlinked' && (
                        <button onClick={() => handleDelete(r)}
                          className="text-red-400 hover:text-red-300 transition-colors" title="삭제">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/>
                            <path d="M10,11v6"/><path d="M14,11v6"/><path d="M9,6V4h6v2"/>
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 하단 액션 */}
        <div className="px-6 py-4 border-t border-white/10">
          {!showGenOptions ? (
            <div className="flex justify-end">
              <button
                onClick={() => setShowGenOptions(true)}
                disabled={selectedDoneCount === 0}
                className="px-4 py-2 bg-cc-accent text-white text-sm font-medium rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cc-accent/90 transition-colors"
              >
                수업 한 번에 생성하기 ({selectedDoneCount}개)
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-cc-text font-medium">어느 챕터에 추가할까요?</p>
              <select
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text text-sm focus:outline-none focus:border-cc-accent"
                value={targetChapterId}
                onChange={(e) => setTargetChapterId(e.target.value)}
              >
                <option value="__new__">+ 새 챕터 생성</option>
                {chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.title}</option>
                ))}
              </select>
              {targetChapterId === '__new__' && (
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text text-sm focus:outline-none focus:border-cc-accent"
                  placeholder="새 챕터 이름"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                />
              )}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowGenOptions(false)}
                  className="px-3 py-2 text-sm text-cc-muted hover:text-cc-text transition-colors">
                  취소
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating || (targetChapterId === '__new__' && !chapterTitle.trim())}
                  className="px-4 py-2 bg-cc-accent text-white text-sm font-medium rounded disabled:opacity-40 hover:bg-cc-accent/90 transition-colors flex items-center gap-2"
                >
                  {generating && <Spinner size="sm" />}
                  {selectedDoneCount}개 레슨 생성
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
