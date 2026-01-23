import { format } from 'date-fns';
import { useState } from 'react';

interface Snapshot {
  id: string;
  lines: Array<{ text: string; color: string }>;
  timestamp: number;
}

interface SnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: Snapshot[];
  snapshotPreviewImage: string;
  deleteSnapshot: (id: string) => void;
}

export function SnapshotModal({ isOpen, onClose, snapshots, snapshotPreviewImage, deleteSnapshot }: SnapshotModalProps) {
  const [expandedSnapshotId, setExpandedSnapshotId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate wavy SVG path for sketch lines
  const generateWavyPath = (width: number, index: number) => {
    const seed = index * 123.456;
    const amplitude = 1.5 + (Math.sin(seed) * 0.5);
    const frequency = 0.05 + (Math.cos(seed) * 0.01);

    let path = `M 0 0`;
    for (let x = 0; x <= width; x += 2) {
      const y = Math.sin(x * frequency + seed) * amplitude;
      path += ` L ${x} ${y}`;
    }
    return path;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-start" onClick={onClose}>
      {/* Backdrop with light beige blur */}
      <div
        className="absolute inset-0 bg-[#f5f3ed]/95 backdrop-blur-sm"
      />

      {/* Modal - full screen, scrollable */}
      <div className="relative w-full h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="max-w-6xl mx-auto px-8 py-12">
          {/* Close button */}
          <button
            onClick={onClose}
            className="fixed top-8 right-8 text-gray-400 hover:text-gray-600 transition-colors text-sm font-mono"
          >
            close ✕
          </button>

          {/* Grid of snapshots */}
          <div className="grid grid-cols-3 gap-8">
            {snapshots.map((snapshot) => {
              const isExpanded = expandedSnapshotId === snapshot.id;

              return (
                <div
                  key={snapshot.id}
                  className="flex flex-col"
                >
                  {/* Snapshot card */}
                  <div
                    className="bg-white shadow-md rounded-sm p-8 mb-3 relative cursor-pointer hover:shadow-lg transition-shadow"
                    style={{ aspectRatio: '3/4' }}
                    onClick={() => setExpandedSnapshotId(isExpanded ? null : snapshot.id)}
                  >
                    {/* Delete button - shows only when expanded */}
                    {isExpanded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSnapshot(snapshot.id);
                          setExpandedSnapshotId(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded z-10"
                      >
                        delete
                      </button>
                    )}

                    {isExpanded ? (
                      // Show actual text when expanded
                      <div className="font-mono text-xs leading-tight" style={{
                        fontFamily: 'Courier Prime, monospace',
                        letterSpacing: '0.05em'
                      }}>
                        {snapshot.lines.map((line, i) => (
                          <div key={i} style={{ color: line.color, minHeight: '16px' }}>
                            {line.text || '\u00A0'}
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Show wavy sketch lines when not expanded
                      <div className="space-y-4">
                        {[...Array(8)].map((_, i) => {
                          const widthPercent = i % 3 === 0 ? 75 : i % 2 === 0 ? 85 : 65;
                          const actualWidth = (widthPercent / 100) * 200;

                          return (
                            <svg
                              key={i}
                              width={actualWidth}
                              height="6"
                              viewBox={`0 -3 ${actualWidth} 6`}
                              className="opacity-40"
                            >
                              <path
                                d={generateWavyPath(actualWidth, i)}
                                stroke="#9ca3af"
                                strokeWidth="1.5"
                                fill="none"
                                strokeLinecap="round"
                              />
                            </svg>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Timestamp below */}
                  <div className="text-xs text-gray-500 font-mono text-center">
                    {format(new Date(snapshot.timestamp), 'MMMM dd HH:mm')}
                  </div>
                </div>
              );
            })}
          </div>

          {snapshots.length === 0 && (
            <div className="text-center text-gray-400 py-24 font-mono text-sm">
              No snapshots yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
