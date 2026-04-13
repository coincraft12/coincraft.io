interface ExamQuestionProps {
  questionNumber: number;
  question: string;
  options: string[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export default function ExamQuestion({
  questionNumber,
  question,
  options,
  selectedIndex,
  onSelect,
}: ExamQuestionProps) {
  return (
    <div className="bg-cc-secondary border border-white/10 rounded-cc p-6 space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-cc-accent/20 text-cc-accent text-xs font-bold flex items-center justify-center">
          {questionNumber}
        </span>
        <p className="text-cc-text font-medium leading-relaxed">{question}</p>
      </div>
      <div className="space-y-2 pl-10">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 text-sm ${
              selectedIndex === idx
                ? 'border-cc-accent bg-cc-accent/10 text-cc-accent'
                : 'border-white/10 text-cc-muted hover:border-white/30 hover:text-cc-text'
            }`}
          >
            <span className="font-semibold mr-2">
              {String.fromCharCode(65 + idx)}.
            </span>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
