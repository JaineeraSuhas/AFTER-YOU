import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { TransparentImage } from '@/app/components/TransparentImage';

interface TypewriterProps {
  onType: (char: string) => void;
  onReturn: () => void;
  onBackspace: () => void;
  carriageOffset: number;
  onCarriageMove: (offset: number) => void;
  baseLayerImageUrl?: string;
  carriageLayerImageUrl?: string;
  children?: React.ReactNode;
}

export function Typewriter({
  onType,
  onReturn,
  onBackspace,
  carriageOffset,
  onCarriageMove,
  baseLayerImageUrl,
  carriageLayerImageUrl,
  children
}: TypewriterProps) {
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const dragX = useMotionValue(carriageOffset);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus the hidden input on mount and keep it focused
  useEffect(() => {
    const focusInput = () => {
      // Prevent scrolling when focusing
      inputRef.current?.focus({ preventScroll: true });
    };

    focusInput();
    window.addEventListener('click', focusInput);
    return () => window.removeEventListener('click', focusInput);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length > 0) {
      const char = value.slice(-1);
      // Only process if it's a valid character (simple logic)
      if (char.length === 1) {
        setPressedKey(char.toUpperCase());
        setTimeout(() => setPressedKey(null), 200);
        onType(char);
      }
    }
    // Always clear the input to keep it ready for next char
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Stop propagation to prevent double handling if we had window listeners (though we'll remove/adjust them)
    e.stopPropagation();

    const key = e.key;

    if (key === 'Backspace') {
      onBackspace();
    } else if (key === 'Enter') {
      onReturn();
      onCarriageMove(100);
    }
  };

  // Keep legacy window listener for desktop-like behavior if focus is lost? 
  // Actually, the hidden input approach is robust for both if we keep focus.
  // But let's keep a window listener as backup for non-focused interactions if needed, 
  // OR rely solely on the input which is safer for mobile. 
  // Let's rely on the input and the click-to-focus behavior.

  useEffect(() => {
    console.log('Typewriter: setting dragX to', carriageOffset);
    dragX.set(carriageOffset);
  }, [carriageOffset, dragX]);

  return (
    <div
      className="relative w-full mt-12 flex justify-center overflow-hidden"
      style={{ height: '600px', touchAction: 'none' }}
      onClick={() => inputRef.current?.focus({ preventScroll: true })}
    >
      {/* Hidden Input for Mobile Keyboard */}
      <textarea
        ref={inputRef}
        className="opacity-0 absolute top-0 left-0 h-0 w-0 z-0"
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        autoFocus
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />

      {/* Scaled Container for Mobile/Desktop Responsiveness */}
      {/* We use a fixed size container that scales down on small screens */}
      <div className="relative w-[800px] h-[600px] origin-top transform scale-[0.45] sm:scale-75 md:scale-100 transition-transform duration-300">

        {/* Paper Layer (STATIONARY) */}
        <div className="absolute left-1/2 -translate-x-1/2 z-10 pointer-events-auto" style={{ top: '0%', height: '50%', width: '280px' }}>
          {children}
        </div>

        {/* Drag instruction */}
        <div className="absolute -top-2 left-8 text-[10px] text-gray-400 font-mono z-50">
          drag carriage to return
        </div>

        {/* Moving container - ONLY Carriage moves */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -350, right: 150 }}
          dragElastic={0.05}
          dragMomentum={false}
          style={{ x: dragX }}
          onDragEnd={(_, info) => {
            const newOffset = dragX.get();

            if (info.offset.x > 50) {
              onReturn();
              onCarriageMove(100);
            } else {
              onCarriageMove(newOffset);
            }
          }}
          className="absolute inset-0"
        >
          {/* Carriage Layer */}
          {carriageLayerImageUrl && (
            <div className="absolute inset-0 z-20 w-full h-full pointer-events-none transform scale-80 origin-top translate-y-8">
              <TransparentImage
                src={carriageLayerImageUrl}
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </motion.div>

        {/* Base Layer */}
        <div className="absolute inset-0 z-30 pointer-events-none" style={{ top: '35%' }}>
          {baseLayerImageUrl && (
            <TransparentImage
              src={baseLayerImageUrl}
              alt=""
              className="w-full h-full object-contain"
            />
          )}

          {/* Key press effect */}
          {pressedKey && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ top: '55%' }}>
              <motion.div
                key={pressedKey}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 0.15, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-12 h-12 rounded-full bg-gray-600"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}