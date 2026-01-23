import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key === 'Tab') return;

      e.preventDefault();

      const key = e.key;

      if (key.length === 1 || key === ' ') {
        setPressedKey(key.toUpperCase());
        setTimeout(() => setPressedKey(null), 200);

        onType(key);
      } else if (key === 'Backspace') {
        onBackspace();
      } else if (key === 'Enter') {
        // Trigger return (commit line and reset carriage)
        onReturn();
        onCarriageMove(100);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onType, onBackspace, onReturn, onCarriageMove]);

  useEffect(() => {
    console.log('Typewriter: setting dragX to', carriageOffset);
    dragX.set(carriageOffset);
  }, [carriageOffset, dragX]);

  return (
    <div className="relative w-full mt-12" style={{ height: '600px' }}>
      {/* Paper Layer (STATIONARY - does NOT move) - Centered and narrower */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10 pointer-events-auto" style={{ top: '0%', height: '50%', width: '280px' }}>
        {children}
      </div>

      {/* Drag instruction - STATIONARY */}
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
        {/* Carriage Layer (z-20 - middle, roller mechanism) */}
        {carriageLayerImageUrl && (
          <div className="absolute inset-0 z-20 w-full h-full pointer-events-none transform scale-90 origin-top">
            <TransparentImage
              src={carriageLayerImageUrl}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </motion.div>

      {/* Base Layer (z-30 - front, stationary keyboard) */}
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
  );
}