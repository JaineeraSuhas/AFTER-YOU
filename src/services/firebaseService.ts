import { database } from '@/config/firebase';
import { ref, set, get, remove, onValue, off, onDisconnect, push, serverTimestamp } from 'firebase/database';

interface TextLine {
    text: string;
    color: string;
}

interface Snapshot {
    id: string;
    lines: TextLine[];
    timestamp: number;
}

interface PaperContent {
    content: TextLine[];
    inkColor: string;
    carriagePosition: number;
}

interface TypingStatus {
    isTyping: boolean;
    userId: string;
    userName: string;
    timestamp: number;
}

interface CurrentLineBuffer {
    text: string;
    color: string;
    userId: string;
    timestamp: number;
}

// Database references
const paperRef = ref(database, 'paper');
const carriageRef = ref(database, 'paper/carriagePosition');
const snapshotsRef = ref(database, 'snapshots');
const typingRef = ref(database, 'paper/typing');
const currentLineRef = ref(database, 'paper/currentLine');

/**
 * Get paper content with real-time updates
 * @param callback Function to call when paper content changes
 * @returns Unsubscribe function to stop listening
 */
export const subscribeToPaper = (callback: (data: PaperContent) => void): (() => void) => {
    const listener = onValue(paperRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            callback({
                content: data.content || [],
                inkColor: data.inkColor || 'black',
                carriagePosition: data.carriagePosition || 100
            });
        } else {
            // Initialize with empty paper if no data exists
            callback({
                content: [],
                inkColor: 'black',
                carriagePosition: 100
            });
        }
    });

    // Return unsubscribe function
    return () => off(paperRef, 'value', listener);
};

/**
 * Update carriage position only
 */
export const updateCarriagePosition = async (position: number): Promise<void> => {
    try {
        await set(carriageRef, position);
    } catch (error) {
        console.error('Error updating carriage position:', error);
    }
};

/**
 * Update paper content
 */
export const updatePaperContent = async (
    content: TextLine[],
    inkColor: string,
    carriagePosition: number
): Promise<void> => {
    try {
        await set(paperRef, {
            content,
            inkColor,
            carriagePosition,
            updatedAt: Date.now()
        });
    } catch (error) {
        console.error('Error updating paper content:', error);
        throw error;
    }
};

/**
 * Get paper content once (without real-time updates)
 */
export const getPaperContent = async (): Promise<PaperContent> => {
    try {
        const snapshot = await get(paperRef);
        const data = snapshot.val();

        if (data) {
            return {
                content: data.content || [],
                inkColor: data.inkColor || 'black',
                carriagePosition: data.carriagePosition || 100
            };
        }

        return {
            content: [],
            inkColor: 'black',
            carriagePosition: 100
        };
    } catch (error) {
        console.error('Error fetching paper content:', error);
        throw error;
    }
};

/**
 * Subscribe to snapshots with real-time updates
 * @param callback Function to call when snapshots change
 * @returns Unsubscribe function to stop listening
 */
export const subscribeToSnapshots = (callback: (snapshots: Snapshot[]) => void): (() => void) => {
    const listener = onValue(snapshotsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Convert object to array and sort by timestamp (newest first)
            const snapshotsArray = Object.values(data) as Snapshot[];
            snapshotsArray.sort((a, b) => b.timestamp - a.timestamp);
            callback(snapshotsArray);
        } else {
            callback([]);
        }
    });

    // Return unsubscribe function
    return () => off(snapshotsRef, 'value', listener);
};

/**
 * Get all snapshots once (without real-time updates)
 */
export const getSnapshots = async (): Promise<Snapshot[]> => {
    try {
        const snapshot = await get(snapshotsRef);
        const data = snapshot.val();

        if (data) {
            const snapshotsArray = Object.values(data) as Snapshot[];
            snapshotsArray.sort((a, b) => b.timestamp - a.timestamp);
            return snapshotsArray;
        }

        return [];
    } catch (error) {
        console.error('Error fetching snapshots:', error);
        throw error;
    }
};

/**
 * Create a new snapshot
 */
export const createSnapshot = async (lines: TextLine[], timestamp: number): Promise<void> => {
    try {
        const snapshotId = timestamp.toString();
        const snapshotRef = ref(database, `snapshots/${snapshotId}`);

        await set(snapshotRef, {
            id: snapshotId,
            lines,
            timestamp
        });
    } catch (error) {
        console.error('Error creating snapshot:', error);
        throw error;
    }
};

/**
 * Delete a snapshot
 */
export const deleteSnapshot = async (id: string): Promise<void> => {
    try {
        const snapshotRef = ref(database, `snapshots/${id}`);
        await remove(snapshotRef);
    } catch (error) {
        console.error('Error deleting snapshot:', error);
        throw error;
    }
};

/**
 * Test Firebase connection
 */
export const testConnection = async (): Promise<boolean> => {
    try {
        await get(paperRef);
        return true;
    } catch (error) {
        console.error('Firebase connection test failed:', error);
        return false;
    }
};

/**
 * Update typing status
 */
export const updateTypingStatus = async (
    isTyping: boolean,
    userId: string,
    userName: string
): Promise<void> => {
    try {
        await set(typingRef, {
            isTyping,
            userId,
            userName,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Error updating typing status:', error);
    }
};

/**
 * Subscribe to typing status
 */
export const subscribeToTypingStatus = (
    callback: (data: TypingStatus | null) => void
): (() => void) => {
    const listener = onValue(typingRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.isTyping) {
            callback(data as TypingStatus);
        } else {
            callback(null);
        }
    });

    return () => off(typingRef, 'value', listener);
};

/**
 * Update current line buffer (real-time character sync)
 */
export const updateCurrentLineBuffer = async (
    text: string,
    color: string,
    userId: string
): Promise<void> => {
    try {
        if (text.length === 0) {
            // Clear buffer if empty
            await remove(currentLineRef);
        } else {
            await set(currentLineRef, {
                text,
                color,
                userId,
                timestamp: Date.now()
            });
        }
    } catch (error) {
        console.error('Error updating current line buffer:', error);
    }
};

/**
 * Subscribe to current line buffer
 */
export const subscribeToCurrentLine = (
    callback: (data: CurrentLineBuffer | null) => void
): (() => void) => {
    const listener = onValue(currentLineRef, (snapshot) => {
        const data = snapshot.val();
        callback(data as CurrentLineBuffer | null);
    });

    return () => off(currentLineRef, 'value', listener);
};

/**
 * Clear current line buffer
 */
export const clearCurrentLineBuffer = async (): Promise<void> => {
    try {
        await remove(currentLineRef);
    } catch (error) {
        console.error('Error clearing current line buffer:', error);
    }
};

/**
 * Initialize presence system for a user
 */
export const initializePresence = (userId: string): void => {
    try {
        const connectedRef = ref(database, '.info/connected');
        const userPresenceRef = ref(database, `presence/${userId}`);

        onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                // We're connected (or reconnected)! Do anything here that should happen when the client connects.

                // When I disconnect, remove this device
                onDisconnect(userPresenceRef).remove();

                // Add this device to my connections list
                // this value could contain info about the device or a timestamp too
                set(userPresenceRef, {
                    timestamp: serverTimestamp(),
                    userId: userId
                });
            }
        });
    } catch (error) {
        console.error('Error initializing presence:', error);
    }
};

/**
 * Subscribe to active users count
 */
export const subscribeToActiveUsers = (callback: (count: number) => void): (() => void) => {
    const presenceRef = ref(database, 'presence');

    const listener = onValue(presenceRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Count number of active connections
            callback(Object.keys(data).length);
        } else {
            callback(0);
        }
    });

    return () => off(presenceRef, 'value', listener);
};

// Export types for use in components
export type { TextLine, Snapshot, PaperContent, TypingStatus, CurrentLineBuffer };
