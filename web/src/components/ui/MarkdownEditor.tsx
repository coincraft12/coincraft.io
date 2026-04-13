'use client';

import dynamic from 'next/dynamic';
import { useRef, useEffect } from 'react';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: (() => void) | undefined;

    // MDEditor is dynamically imported — wait for .cm-content to appear
    const observer = new MutationObserver(() => {
      const cmContent = containerRef.current?.querySelector<HTMLElement>('.cm-content');
      if (!cmContent || cmContent.dataset.pasteHandled) return;

      cmContent.dataset.pasteHandled = 'true';

      async function handler(e: ClipboardEvent) {
        const html = e.clipboardData?.getData('text/html');
        if (!html) return;

        e.preventDefault();
        e.stopPropagation();

        const TurndownService = (await import('turndown')).default;
        const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });
        const markdown = td.turndown(html);

        // execCommand targets the focused contenteditable (CodeMirror's .cm-content)
        document.execCommand('insertText', false, markdown);
      }

      // capture:true so we intercept before CodeMirror's own paste handler
      cmContent.addEventListener('paste', handler, true);
      cleanup = () => cmContent.removeEventListener('paste', handler, true);
      observer.disconnect();
    });

    observer.observe(containerRef.current, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanup?.();
    };
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-cc-text">{label}</label>}
      <div ref={containerRef} data-color-mode="dark" className="cc-md-editor">
        <MDEditor
          value={value}
          onChange={(v) => onChange(v ?? '')}
          height={height}
          preview="edit"
          visibleDragbar={false}
          textareaProps={{
            placeholder: '마크다운으로 작성해 주세요. # 제목, **굵게**, *기울임* 등 사용 가능합니다.',
          }}
        />
      </div>
    </div>
  );
}
