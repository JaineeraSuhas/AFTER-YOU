import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';

export type NotificationType = 'info' | 'success' | 'snapshot' | 'warning';

interface NotificationProps {
    message: string;
    type?: NotificationType;
    icon?: string;
    duration?: number;
    onClose?: () => void;
}

const typeStyles: Record<NotificationType, string> = {
    info: 'border-blue-500 bg-blue-50',
    success: 'border-green-500 bg-green-50',
    snapshot: 'border-purple-500 bg-purple-50',
    warning: 'border-orange-500 bg-orange-50'
};

const defaultIcons: Record<NotificationType, string> = {
    info: 'ℹ️',
    success: '✅',
    snapshot: '📸',
    warning: '⚠️'
};

export function Notification({
    message,
    type = 'info',
    icon,
    duration = 3000,
    onClose
}: NotificationProps) {
    useEffect(() => {
        if (duration > 0 && onClose) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className={`fixed top-4 right-4 border-2 px-6 py-3 rounded-lg shadow-xl z-50 ${typeStyles[type]}`}
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{icon || defaultIcons[type]}</span>
                    <span className="font-mono text-sm font-medium">{message}</span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
