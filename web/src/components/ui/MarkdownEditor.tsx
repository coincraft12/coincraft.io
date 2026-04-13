'use client';

import dynamic from 'next/dynamic';
import TurndownService from 'turndown';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });

interface MarkdownEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

export default function MarkdownEditor({
  label,
  value,
  onChange,
  height = 320,
}: MarkdownEditorProps) {
  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const html = e.clipboardData.getData('text/html');
    if (!html) return;

    e.preventDefault();

    // read everything synchronously before any async boundary
    const textarea = e.currentTarget;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;

    const markdown = td.turndown(html);
    const next = value.slice(0, start) + markdown + value.slice(end);
    onChange(next);

    // restore cursor after React re-render
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + markdown.length;
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-cc-text">{label}</label>}
      <div data-color-mode="dark" className="cc-md-editor">
        <MDEditor
          value={value}
          onChange={(v) => onChange(v ?? '')}
          height={height}
          preview="edit"
          visibleDragbar={false}
          textareaProps={{
            placeholder: '마크다운으로 작성해 주세요. # 제목, **굵게**, *기울임* 등 사용 가능합니다.',
            onPaste: handlePaste,
          }}
        />
      </div>
    </div>
  );
}
