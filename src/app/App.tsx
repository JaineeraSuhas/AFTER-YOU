import { useState, useEffect, useRef, useCallback } from 'react';
import { Typewriter } from '@/app/components/Typewriter';
import { Paper } from '@/app/components/Paper';
import { SnapshotModal } from '@/app/components/SnapshotModal';
import { TypingIndicator } from '@/app/components/TypingIndicator';
import { Notification, NotificationType } from '@/app/components/Notification';
import LandingPage from '@/app/components/LandingPage';
import {
  subscribeToPaper,
  updatePaperContent,
  subscribeToSnapshots,
  createSnapshot as createSnapshotService,
  deleteSnapshot as deleteSnapshotService,
  testConnection,
  updateTypingStatus,
  subscribeToTypingStatus,
  updateCurrentLineBuffer,
  subscribeToCurrentLine,
  clearCurrentLineBuffer,
  initializePresence,
  subscribeToActiveUsers,
  updateCarriagePosition,
  type TypingStatus,
  type CurrentLineBuffer
} from '@/services/firebaseService';
import { getUserIdAndName } from '@/utils/userUtils';
import baseLayerImage from '@/assets/7c301c99ee76cb072e596dd4c73d276ffb9ed475.png';
import carriageLayerImage from '@/assets/d1a079c25d1b23a5a2a1886434e252d7fef3fdf9.png';
import snapshotPreviewImage from '@/assets/d90f2fa73917d01cbcb8ae5b710c60decb1af234.png';

interface TextLine {
  text: string;
  color: string;
}

interface Snapshot {
  id: string;
  lines: TextLine[];
  timestamp: number;
}

export default function App() {
  const [lines, setLines] = useState<TextLine[]>([]);
  const [currentLine, setCurrentLine] = useState('');
  const [inkColor, setInkColor] = useState<'black' | 'red'>('black');
  const [carriageOffset, setCarriageOffset] = useState(100);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [snapshotFilter, setSnapshotFilter] = useState<'black' | 'red' | 'all'>('all');
  const [paperVibrate, setPaperVibrate] = useState(false);

  // New state for enhanced features
  const [typingStatus, setTypingStatus] = useState<TypingStatus | null>(null);
  const [otherUserCurrentLine, setOtherUserCurrentLine] = useState<CurrentLineBuffer | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: NotificationType; icon?: string } | null>(null);
  const [activeUsers, setActiveUsers] = useState(1);
  const [snapshotFlash, setSnapshotFlash] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // User identity
  const { userId, userName } = getUserIdAndName();

  // Refs
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastTypeTimeRef = useRef<number>(0);

  const CHARS_PER_LINE = 30;
  const MAX_LINES_PER_PAPER = 11; // 11 lines per paper

  // Count total words on paper
  const getTotalWords = () => {
    const allText = [...lines.map(l => l.text), currentLine].join(' ');
    return allText.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Test Firebase connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await testConnection();
        if (connected) {
          console.log('✓ Firebase connected - real-time features enabled');
          setBackendAvailable(true);
        } else {
          console.log('→ Running in local mode');
          setBackendAvailable(false);
        }
      } catch (error) {
        console.log('→ Running in local mode - your typing will work but won\'t sync with others');
        setBackendAvailable(false);
      }
    };

    checkConnection();
  }, []);

  // Subscribe to paper content with real-time updates
  useEffect(() => {
    if (!backendAvailable) {
      setIsInitialized(true);
      return;
    }

    // Subscribe to real-time updates
    const unsubscribe = subscribeToPaper((data) => {
      setLines(data.content || []);
      setInkColor((data.inkColor as 'black' | 'red') || 'black');

      // Only update carriage from server if we haven't typed recently (prevent glitching)
      const timeSinceLastType = Date.now() - lastTypeTimeRef.current;
      if (timeSinceLastType > 2000) {
        setCarriageOffset(data.carriagePosition || 100);
      }

      setIsInitialized(true);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [backendAvailable]);

  // Subscribe to snapshots with real-time updates
  useEffect(() => {
    if (!backendAvailable) return;

    // Subscribe to real-time snapshot updates
    const unsubscribe = subscribeToSnapshots((data) => {
      setSnapshots(data);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [backendAvailable]);

  // Subscribe to typing status
  useEffect(() => {
    if (!backendAvailable) return;

    const unsubscribe = subscribeToTypingStatus((data) => {
      // Only show typing indicator if it's not the current user
      if (data && data.userId !== userId) {
        setTypingStatus(data);
      } else {
        setTypingStatus(null);
      }
    });

    return () => unsubscribe();
  }, [backendAvailable, userId]);

  // Subscribe to current line buffer (real-time character sync)
  useEffect(() => {
    if (!backendAvailable) return;

    const unsubscribe = subscribeToCurrentLine((data) => {
      // Only show other user's current line
      if (data && data.userId !== userId) {
        setOtherUserCurrentLine(data);
      } else {
        setOtherUserCurrentLine(null);
      }
    });

    return () => unsubscribe();
  }, [backendAvailable, userId]);

  // Cleanup typing status on unmount
  useEffect(() => {
    return () => {
      if (backendAvailable) {
        updateTypingStatus(false, userId, userName);
        clearCurrentLineBuffer();
      }
    };
  }, [backendAvailable, userId, userName]);

  // Initialize presence and subscribe to active users
  useEffect(() => {
    if (!backendAvailable) return;

    // Initialize my presence
    initializePresence(userId);

    // Subscribe to count
    const unsubscribe = subscribeToActiveUsers((count) => {
      setActiveUsers(count);
    });

    return () => unsubscribe();
  }, [backendAvailable, userId]);

  // Save paper content to Firebase
  const savePaper = async (newLines: TextLine[], newInkColor: string, newCarriagePos: number) => {
    if (!backendAvailable) return;

    try {
      await updatePaperContent(newLines, newInkColor, newCarriagePos);
    } catch (error) {
      console.error('Error saving paper:', error);
    }
  };

  const handleType = (char: string) => {
    // Check if paper is full (11 lines + trying to type on a new line)
    if (lines.length >= MAX_LINES_PER_PAPER && currentLine.length === 0) {
      // VIBRATE THE PAPER to indicate it's full!
      setPaperVibrate(true);
      setTimeout(() => setPaperVibrate(false), 300);
      return;
    }

    if (currentLine.length >= CHARS_PER_LINE) {
      // VIBRATE THE CARRIAGE when trying to type past the line limit!
      setCarriageOffset(carriageOffset - 5);
      setTimeout(() => setCarriageOffset(carriageOffset + 5), 50);
      setTimeout(() => setCarriageOffset(carriageOffset - 5), 100);
      setTimeout(() => setCarriageOffset(carriageOffset), 150);
      return;
    }

    const newLine = currentLine + char;
    setCurrentLine(newLine);

    // Move carriage left as we type
    const newOffset = carriageOffset - 8;
    setCarriageOffset(newOffset);



    // Real-time character sync to Firebase
    if (backendAvailable) {
      const now = Date.now();
      // Throttle updates to every 100ms
      if (now - lastTypeTimeRef.current > 100) {
        updateCurrentLineBuffer(newLine, inkColor, userId);
        updateCarriagePosition(newOffset);
        lastTypeTimeRef.current = now;
      }

      updateTypingStatus(true, userId, userName);

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to clear typing status after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(false, userId, userName);
      }, 2000);
    }
  };

  const handleBackspace = () => {
    // ONLY allow backspace on current line, NOT on previous lines!
    if (currentLine.length === 0) {
      // Vibrate to indicate you can't delete previous text
      setCarriageOffset(carriageOffset + 3);
      setTimeout(() => setCarriageOffset(carriageOffset - 3), 50);
      setTimeout(() => setCarriageOffset(carriageOffset), 100);
      return;
    }

    const newLine = currentLine.slice(0, -1);
    setCurrentLine(newLine);

    // Move carriage right as we delete
    const newOffset = carriageOffset + 8;
    setCarriageOffset(newOffset);

    // Real-time character sync to Firebase
    if (backendAvailable) {
      updateCurrentLineBuffer(newLine, inkColor, userId);
      updateCarriagePosition(newOffset);
      updateTypingStatus(true, userId, userName);

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to clear typing status
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(false, userId, userName);
      }, 2000);
    }
  };

  const handleReturn = async () => {
    // Commit current line
    const newLines = [...lines, { text: currentLine, color: inkColor }];

    setLines(newLines);
    setCurrentLine('');

    // Reset carriage to starting position (right)
    const newOffset = 100;
    setCarriageOffset(newOffset);

    // Scroll paper up
    setScrollPosition(scrollPosition + 20);

    if (backendAvailable) {
      updateCarriagePosition(newOffset);
    }

    console.log('📤 Saving to Firebase:', newLines.length, 'lines');

    // Clear current line buffer and typing status
    if (backendAvailable) {
      await clearCurrentLineBuffer();
      updateTypingStatus(false, userId, userName);

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    // Check if page is full (11 lines) - AUTO-SNAPSHOT!
    if (newLines.length === MAX_LINES_PER_PAPER) {
      // Trigger flash animation
      setSnapshotFlash(true);
      setTimeout(() => setSnapshotFlash(false), 800);

      // Take snapshot automatically
      await takeSnapshot();

      // Wait a moment, then clear paper
      setTimeout(async () => {
        await useNewPaper();
      }, 1500);

      return; // Don't save the full page
    }

    // Save to backend
    savePaper(newLines, inkColor, newOffset);
  };

  const handleCarriageMove = (offset: number) => {
    setCarriageOffset(offset);
  };

  const toggleInkColor = () => {
    const newColor = inkColor === 'black' ? 'red' : 'black';
    setInkColor(newColor);
    savePaper(lines, newColor, carriageOffset);
  };

  const deleteSnapshot = async (id: string) => {
    if (!backendAvailable) {
      // Local mode - delete from state
      setSnapshots(snapshots.filter(s => s.id !== id));
      return;
    }

    try {
      await deleteSnapshotService(id);
      // Firebase real-time listener will automatically update the state
    } catch (error) {
      console.error('Error deleting snapshot:', error);
    }
  };

  const takeSnapshot = async () => {
    // Capture last 15 lines
    const allLines = [...lines, { text: currentLine, color: inkColor }];
    const last15Lines = allLines.slice(-15);

    const timestamp = Date.now();

    if (!backendAvailable) {
      // Local mode - store in state only
      const newSnapshot: Snapshot = {
        id: timestamp.toString(),
        lines: last15Lines,
        timestamp
      };
      setSnapshots([newSnapshot, ...snapshots]);
      // DON'T open modal - just save the snapshot
      return;
    }

    try {
      await createSnapshotService(last15Lines, timestamp);
      // Firebase real-time listener will automatically update the state
    } catch (error) {
      console.error('Error taking snapshot:', error);
    }
  };

  const useNewPaper = async () => {
    // Clear all content and start fresh
    setLines([]);
    setCurrentLine('');
    setScrollPosition(0);
    setCarriageOffset(100);

    // Save empty paper to backend
    if (backendAvailable) {
      await savePaper([], inkColor, 100);
    }
  };

  // Preload images for smooth transition
  useEffect(() => {
    const preloadImages = () => {
      const images = [baseLayerImage, carriageLayerImage];
      images.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    };
    preloadImages();
  }, []);

  const handleEnterApp = () => {
    setIsTransitioning(true);
    // Wait for fade out, then switch and fade in
    setTimeout(() => {
      setShowLanding(false);
      setIsTransitioning(false);
    }, 600);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (showLanding) {
    return (
      <div className={`transition-opacity duration-600 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <LandingPage
          onEnter={handleEnterApp}
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white animate-fadeIn">
      <div className="container mx-auto px-8 py-12 relative">
        {/* Theme Toggle Button for Main App */}

        <div className="grid grid-cols-12 gap-12">
          {/* Left Column */}
          <div className="col-span-4 flex flex-col" style={{ paddingBottom: '48px' }}>
            <div className="mb-8">
              <h1 className="text-6xl mb-4 tracking-tight text-black" style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>After You</h1>
              <p className="text-gray-600 leading-relaxed font-normal">
                Type as if someone will come after you.<br />
                Write a line, leave a thought, or finish someone else's sentence.<br />
                What you type stays, waiting for the next person.<br /><br />
                Use your keyboard like a typewriter.
              </p>
            </div>

            {/* Snapshot Previews - positioned to match bottom spacing */}
            <div className="mt-auto">
              <button
                onClick={() => setIsModalOpen(true)}
                className="font-limoncello text-sm mb-4 flex items-center gap-1 hover:opacity-70 transition-opacity"
              >
                snapshots <span>&gt;</span>
              </button>

              <div className="relative">
                <img
                  src={snapshotPreviewImage}
                  alt="Snapshot previews"
                  className="w-full cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setIsModalOpen(true)}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Typewriter */}
          <div className="col-span-8 relative" style={{ minHeight: '600px' }}>
            <Typewriter
              onType={handleType}
              onBackspace={handleBackspace}
              onReturn={handleReturn}
              carriageOffset={carriageOffset}
              onCarriageMove={handleCarriageMove}
              baseLayerImageUrl={baseLayerImage}
              carriageLayerImageUrl={carriageLayerImage}
            >
              {/* Paper goes inside typewriter */}
              <Paper
                lines={lines}
                currentLine={currentLine}
                currentColor={inkColor}
                scrollPosition={scrollPosition}
                onScroll={setScrollPosition}
                vibrate={paperVibrate}
                otherUserCurrentLine={otherUserCurrentLine ? {
                  text: otherUserCurrentLine.text,
                  color: otherUserCurrentLine.color
                } : null}
              >
                {/* Buttons on paper */}
                <button
                  onClick={takeSnapshot}
                  className="px-3 py-1.5 bg-white/90 hover:bg-white border border-gray-300 rounded transition-colors font-limoncello text-xs shadow-sm"
                >
                  take a snapshot
                </button>

                <button
                  onClick={toggleInkColor}
                  className="px-3 py-1.5 bg-white/90 hover:bg-white border border-gray-300 rounded transition-colors font-limoncello text-xs flex items-center gap-2 shadow-sm"
                >
                  ink ribbon:
                  <span
                    className="inline-block rounded-full"
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: inkColor
                    }}
                  />
                </button>
              </Paper>
            </Typewriter>

            {/* Typing Indicator - Below typewriter */}
            {typingStatus && typingStatus.userId !== userId && (
              <div className="mt-4">
                <TypingIndicator userName={typingStatus.userName} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          icon={notification.icon}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Snapshot Modal */}
      <SnapshotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        snapshots={snapshots}
        snapshotPreviewImage={snapshotPreviewImage}
        deleteSnapshot={deleteSnapshot}
      />



      {/* Snapshot Flash Animation - Full screen white overlay */}
      {snapshotFlash && (
        <div className="fixed inset-0 z-[100] bg-white pointer-events-none animate-flash-fade" />
      )}
    </div>
  );
}