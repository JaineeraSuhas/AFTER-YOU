import { useRef } from 'react';

interface TextLine {
  text: string;
  color: string;
}

interface OtherUserLine {
  text: string;
  color: string;
}

interface PaperProps {
  lines: TextLine[];
  currentLine: string;
  currentColor: string;
  scrollPosition: number;
  onScroll: (position: number) => void;
  vibrate?: boolean;
  otherUserCurrentLine?: OtherUserLine | null;
  children?: React.ReactNode;
}

export function Paper({
  lines,
  currentLine,
  currentColor,
  scrollPosition,
  onScroll,
  vibrate = false,
  otherUserCurrentLine = null,
  children
}: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const LINE_HEIGHT = 20;
  const VISIBLE_LINES = 15; // Number of lines visible on paper before scrolling

  return (
    <div className={`w-full h-full relative overflow-hidden ${vibrate ? 'animate-shake' : ''}`}>
      {/* Buttons at top */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        {children}
      </div>

      {/* Paper surface - scrolls UP only when reaching bottom */}
      <div
        ref={paperRef}
        className="w-full h-full bg-[#f5f5dc] shadow-lg border border-gray-300"
        style={{
          paddingTop: '50px',
          paddingBottom: '100px',
          paddingLeft: '20px',
          paddingRight: '20px'
        }}
      >
        {/* Text content - only scrolls when exceeding visible area */}
        <div
          className="font-mono text-[11px] leading-tight"
          style={{
            lineHeight: `${LINE_HEIGHT}px`,
            letterSpacing: '0.02em',
            fontFamily: 'Courier Prime, monospace',
            transform: lines.length > VISIBLE_LINES ? `translateY(-${scrollPosition}px)` : 'translateY(0)',
            wordBreak: 'break-word',
            maxWidth: '100%',
            transition: 'transform 0.2s ease'
          }}
        >
          {/* All previous lines */}
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                color: line.color,
                minHeight: `${LINE_HEIGHT}px`,
                textAlign: 'justify',
                wordBreak: 'break-word'
              }}
            >
              {line.text}
            </div>
          ))}

          {/* Current line being typed - always visible */}
          <div
            style={{
              color: currentColor,
              minHeight: `${LINE_HEIGHT}px`,
              textAlign: 'left',
              wordBreak: 'break-word'
            }}
          >
            {currentLine}
            <span className="animate-pulse">|</span>
          </div>

          {/* Other user's current line - shown in real-time with subtle indicator */}
          {otherUserCurrentLine && otherUserCurrentLine.text && (
            <div
              style={{
                color: otherUserCurrentLine.color,
                minHeight: `${LINE_HEIGHT}px`,
                textAlign: 'left',
                wordBreak: 'break-word',
                opacity: 0.7
              }}
            >
              {otherUserCurrentLine.text}
              <span className="animate-pulse opacity-50">...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}