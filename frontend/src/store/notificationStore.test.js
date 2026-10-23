import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotificationStore } from './notificationStore';

vi.mock('../services/dataService', () => ({
  notificationService: {
    getMyNotifications: vi.fn().mockResolvedValue({
      data: {
        data: [
          { id: 1, title: 'Điểm mới', message: 'Đã có điểm', isRead: false },
          { id: 2, title: 'Chốt điểm', message: 'Đã chốt điểm', isRead: true },
        ],
      },
    }),
    getUnreadCount: vi.fn().mockResolvedValue({ data: { data: 3 } }),
    markAsRead: vi.fn().mockResolvedValue({ data: { success: true } }),
    markAllAsRead: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

describe('notificationStore.js', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      isOpen: false,
      eventSource: null,
    });
  });

  it('manages dropdown open/close state', () => {
    expect(useNotificationStore.getState().isOpen).toBe(false);

    useNotificationStore.getState().toggleIsOpen();
    expect(useNotificationStore.getState().isOpen).toBe(true);

    useNotificationStore.getState().setIsOpen(false);
    expect(useNotificationStore.getState().isOpen).toBe(false);
  });

  it('fetches unread count and notifications', async () => {
    await useNotificationStore.getState().fetchUnreadCount();
    expect(useNotificationStore.getState().unreadCount).toBe(3);

    await useNotificationStore.getState().fetchNotifications();
    expect(useNotificationStore.getState().notifications.length).toBe(2);
    expect(useNotificationStore.getState().notifications[0].title).toBe('Điểm mới');
  });

  it('marks a single notification as read and decrements unreadCount', async () => {
    useNotificationStore.setState({
      notifications: [
        { id: 10, title: 'Thông báo A', isRead: false },
        { id: 11, title: 'Thông báo B', isRead: false },
      ],
      unreadCount: 2,
    });

    await useNotificationStore.getState().markAsRead(10);

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(1);
    expect(state.notifications.find((n) => n.id === 10).isRead).toBe(true);
    expect(state.notifications.find((n) => n.id === 11).isRead).toBe(false);
  });

  it('marks all notifications as read', async () => {
    useNotificationStore.setState({
      notifications: [
        { id: 1, isRead: false },
        { id: 2, isRead: false },
      ],
      unreadCount: 2,
    });

    await useNotificationStore.getState().markAllAsRead();

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.notifications.every((n) => n.isRead)).toBe(true);
  });
});
