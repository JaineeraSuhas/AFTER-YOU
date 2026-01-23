import { motion, AnimatePresence } from 'motion/react';

interface TypingIndicatorProps {
    userName: string;
}

export function TypingIndicator({ userName }: TypingIndicatorProps) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-2 text-xs text-gray-500 italic"
            >
                <span>✍️ {userName} is typing</span>
                <div className="flex gap-0.5">
                    <motion.div
                        className="w-1 h-1 bg-gray-400 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                        className="w-1 h-1 bg-gray-400 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                        className="w-1 h-1 bg-gray-400 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
