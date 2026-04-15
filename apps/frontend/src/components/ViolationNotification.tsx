import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

interface ViolationNotificationProps {
  message: string;
  candidateName: string;
  type: 'warning' | 'critical';
  onClose?: () => void;
  autoCloseDuration?: number;
}

export function ViolationNotification({
  message,
  candidateName,
  type,
  onClose,
  autoCloseDuration = 5000,
}: ViolationNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoCloseDuration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }
  }, [autoCloseDuration, onClose]);

  if (!isVisible) return null;

  const bgColor = type === 'critical' ? 'bg-rose-500' : 'bg-pink-500';

  return (
    <div
      className={`fixed top-0 left-0 right-0 ${bgColor} px-4 py-3 text-white text-sm font-medium shadow-lg`}
      style={{ zIndex: 99999 }}
    >
      Restricted shortcut blocked. Violation recorded for {candidateName}
    </div>
  );
}

// Context for managing multiple notifications

interface NotificationState {
  id: string;
  message: string;
  candidateName: string;
  type: 'warning' | 'critical';
}

interface NotificationContextType {
  notifications: NotificationState[];
  addNotification: (notification: Omit<NotificationState, 'id'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  const addNotification = useCallback((notification: Omit<NotificationState, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { ...notification, id }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {/* Only show the most recent notification */}
      {notifications.length > 0 && (
        <ViolationNotification
          key={notifications[notifications.length - 1].id}
          message={notifications[notifications.length - 1].message}
          candidateName={notifications[notifications.length - 1].candidateName}
          type={notifications[notifications.length - 1].type}
          onClose={() => removeNotification(notifications[notifications.length - 1].id)}
          autoCloseDuration={5000}
        />
      )}
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}
