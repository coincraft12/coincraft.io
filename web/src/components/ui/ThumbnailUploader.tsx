'use client';

import { useState, useCallback, useRef } from 'react';
import Cropper, { type CropperProps } from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import Button from './Button';

// ─── Canvas crop helper ────────────────────────────────────────────────────

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, pixelCrop.width, pixelCrop.height,
      );
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('canvas empty'))),
        'image/jpeg',
        0.92,
      );
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}

// ─── Component ────────────────────────────────────────────────────────────

interface ThumbnailUploaderProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  token: string;
}

export default function ThumbnailUploader({
  label = '썸네일',
  value,
  onChange,
  token,
}: ThumbnailUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function openPicker() {
    inputRef.current?.click();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleApply() {
    if (!imageSrc || !croppedAreaPixels) return;
    setUploading(true);
    setError('');
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const formData = new FormData();
      formData.append('image', blob, 'thumbnail.jpg');

      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
      const res = await fetch(`${apiBase}/api/v1/instructor/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('upload failed');
      const json = await res.json();
      onChange(json.data.url);
      setImageSrc(null);
    } catch {
      setError('업로드 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setUploading(false);
    }
  }

  function handleCancel() {
    setImageSrc(null);
    setError('');
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-cc-text">{label}</label>}
        <p className="text-xs text-cc-muted">권장 크기: 1280×720px (16:9) · JPG / PNG / WEBP · 최대 10MB</p>

        {/* Preview / upload area */}
        <div
          role="button"
          tabIndex={0}
          onClick={openPicker}
          onKeyDown={(e) => e.key === 'Enter' && openPicker()}
          className="relative w-full aspect-video bg-white/5 border-2 border-dashed border-white/20 rounded-cc overflow-hidden cursor-pointer hover:border-cc-accent transition-colors group"
        >
          {value ? (
            <>
              <img src={value} alt="thumbnail" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-white text-sm font-medium">이미지 변경</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-cc-muted">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              <div className="text-center">
                <p className="text-sm">클릭하여 이미지 업로드</p>
                <p className="text-xs opacity-60 mt-1">16:9 비율로 자동 크롭됩니다</p>
              </div>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* ── Crop modal ─────────────────────────────────────────────────── */}
      {imageSrc && (
        <div className="fixed inset-0 z-[9998] flex flex-col bg-black/90">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-cc-secondary border-b border-white/10 shrink-0">
            <div>
              <h3 className="text-cc-text font-semibold">썸네일 편집</h3>
              <p className="text-xs text-cc-muted mt-0.5">
                드래그로 위치 조정 · 스크롤 또는 슬라이더로 확대/축소
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="text-cc-muted hover:text-cc-text transition-colors text-2xl leading-none px-2"
            >
              ×
            </button>
          </div>

          {/* Cropper */}
          <div className="relative flex-1 min-h-0">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{ containerStyle: { background: '#0A0A0F' } }}
            />
          </div>

          {/* Controls */}
          <div className="shrink-0 px-6 py-5 bg-cc-secondary border-t border-white/10 space-y-4">
            <div className="flex items-center gap-4 max-w-lg mx-auto">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cc-muted shrink-0">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-cc-accent cursor-pointer"
              />
              <span className="text-xs text-cc-muted w-10 text-right tabular-nums">
                {zoom.toFixed(1)}×
              </span>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                취소
              </Button>
              <Button size="sm" onClick={handleApply} loading={uploading}>
                적용
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
