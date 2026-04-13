import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export default function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  return (
    <div className={`cc-markdown ${className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
