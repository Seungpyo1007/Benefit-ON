import React, { useEffect } from 'react';
import { NotificationMessage } from '../types';

interface NotificationToastProps {
  notification: NotificationMessage | null;
  onDismiss: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onDismiss }) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  if (!notification) return null;

  const baseClasses = "fixed bottom-5 right-5 p-4 rounded-xl shadow-xl text-white max-w-sm z-50 glass-panel animate-toastIn";
  const typeClasses = {
    success: "bg-green-500/30",
    error: "bg-red-500/30",
    info: "bg-blue-500/30",
  };
  const iconClasses = {
    success: "fas fa-check-circle text-green-300",
    error: "fas fa-exclamation-circle text-red-300",
    info: "fas fa-info-circle text-blue-300",
  }

  return (
    <div className={`${baseClasses} ${typeClasses[notification.type]}`}>
      <div className="flex items-center">
        <i className={`${iconClasses[notification.type]} mr-3 text-xl`}></i>
        <span className="text-white/90">{notification.message}</span>
        <button onClick={onDismiss} className="ml-auto text-xl text-white/50 hover:text-white/90 transition-colors">
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;