import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import type { Notification as NotificationType } from '@/types';
import { CheckIcon, CloseIcon, InfoIcon } from '@/components/icons';

interface ToastProps {
  notification: NotificationType;
  onDismiss: (id: string) => void;
}

const typeStyles = {
  success: { bg: 'border-accent-green/30 bg-accent-green/8', icon: 'text-accent-green', label: 'Cleared' },
  error: { bg: 'border-accent-red/30 bg-accent-red/8', icon: 'text-accent-red', label: 'Interrupted' },
  warning: { bg: 'border-yellow-500/30 bg-yellow-500/8', icon: 'text-yellow-400', label: 'Review' },
  info: { bg: 'border-teal/30 bg-teal/8', icon: 'text-teal', label: 'Notice' },
  pending: { bg: 'border-amber-500/30 bg-amber-500/8', icon: 'text-amber-400', label: 'Signing' },
};

export default function Toast({ notification, onDismiss }: ToastProps) {
  useEffect(() => {
    // Pending toasts stay until updated — no auto-dismiss
    if (notification.type === 'pending') return;
    const duration = notification.link ? 12000 : 5000;
    const timer = setTimeout(() => onDismiss(notification.id), duration);
    return () => clearTimeout(timer);
  }, [notification.id, notification.type, notification.link, onDismiss]);

  const style = typeStyles[notification.type] ?? typeStyles.info;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      className={`flex items-start gap-3 rounded-3xl border p-4 shadow-card backdrop-blur-xl ${style.bg}`}
    >
      <div className={style.icon}>
        {notification.type === 'pending' ? (
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : notification.type === 'success' ? (
          <CheckIcon className="w-5 h-5" />
        ) : (
          <InfoIcon className="w-5 h-5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-smoke/55">{style.label}</p>
        <p className="mt-1 text-sm font-medium text-white">{notification.title}</p>
        <p className="mt-1 text-xs leading-5 text-smoke/70">{notification.message}</p>
        {notification.link && (
          <a
            href={notification.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-teal underline underline-offset-2 hover:text-teal/80"
          >
            {notification.linkLabel || 'Open receipt'} ↗
          </a>
        )}
      </div>
      <button onClick={() => onDismiss(notification.id)} className="text-smoke/45 transition-colors hover:text-white">
        <CloseIcon className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastContainer({
  notifications,
  onDismiss,
}: {
  notifications: NotificationType[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
      <AnimatePresence>
        {notifications.map((n) => (
          <Toast key={n.id} notification={n} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
