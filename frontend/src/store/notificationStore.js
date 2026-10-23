import { create } from 'zustand';
import { notificationService } from '../services/dataService';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  eventSource: null,

  setIsOpen: (isOpen) => set({ isOpen }),
  toggleIsOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  fetchNotifications: async () => {
    try {
      const res = await notificationService.getMyNotifications(30);
      set({ notifications: res.data?.data || [] });
    } catch {
      // Ignored if unauthenticated or student endpoint not available
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await notificationService.getUnreadCount();
      set({ unreadCount: res.data?.data || 0 });
    } catch {
      // Ignored
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationService.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // Ignored
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
      // Ignored
    }
  },

  initSse: (token, onNotificationReceived) => {
    const currentEs = get().eventSource;
    if (currentEs) {
      try {
        currentEs.close();
      } catch {}
    }

    if (!token) return;

    try {
      const es = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`);

      es.addEventListener('INIT', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.unreadCount !== undefined) {
            set({ unreadCount: Number(data.unreadCount) || 0 });
          }
        } catch {}
      });

      es.addEventListener('NOTIFICATION', (event) => {
        try {
          const notif = JSON.parse(event.data);
          set((state) => ({
            notifications: [notif, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }));

          if (onNotificationReceived) {
            onNotificationReceived(notif);
          }
        } catch {}
      });

      es.onerror = () => {
        // Browser's native EventSource automatically reconnects.
      };

      set({ eventSource: es });
    } catch {
      // EventSource creation failed (e.g. invalid environment)
    }
  },

  disconnectSse: () => {
    const es = get().eventSource;
    if (es) {
      try {
        es.close();
      } catch {}
      set({ eventSource: null });
    }
  },
}));
