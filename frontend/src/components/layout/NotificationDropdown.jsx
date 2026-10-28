import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/notificationStore';
import { Bell, BellOff, CheckCheck, ExternalLink } from 'lucide-react';
import { GraduationCapIcon, AwardIcon } from '../icons';

function formatNotificationTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isOpen = useNotificationStore((state) => state.isOpen);
  const setIsOpen = useNotificationStore((state) => state.setIsOpen);
  const toggleIsOpen = useNotificationStore((state) => state.toggleIsOpen);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    toggleIsOpen();
  };

  const handleItemClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.type === 'GRADE_UPDATED' || notif.type === 'GRADE_FINALIZED') {
      navigate('/student/transcript');
    }
  };

  return (
    <div className="notification-dropdown-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        className="btn-icon"
        onClick={handleToggle}
        title="Thông báo học vụ"
        aria-label="Thông báo học vụ"
        style={{
          border: '1px solid var(--border-color)',
          width: '36px',
          height: '36px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: 'var(--danger, #ef4444)',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 700,
              minWidth: '18px',
              height: '18px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 0 2px var(--bg-card, #ffffff)',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Danh sách thông báo"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '360px',
            maxWidth: '90vw',
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: 'var(--radius-lg, 12px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-color, #e2e8f0)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-subtle, #f8fafc)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main, #1e293b)' }}>
                Thông báo
              </span>
              {unreadCount > 0 && (
                <span className="badge badge-danger" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                className="btn btn-outline btn-sm"
                onClick={markAllAsRead}
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--primary, #2563eb)',
                }}
                title="Đánh dấu tất cả là đã đọc"
              >
                <CheckCheck size={14} />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* List */}
          <div
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--text-muted, #64748b)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <BellOff size={32} opacity={0.4} />
                <span style={{ fontSize: '0.875rem' }}>Bạn chưa có thông báo nào</span>
              </div>
            ) : (
              notifications.map((n) => {
                const isFinalized = n.type === 'GRADE_FINALIZED';
                const isGrade = isFinalized || n.type === 'GRADE_UPDATED';

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      gap: '12px',
                      borderBottom: '1px solid var(--border-color, #f1f5f9)',
                      backgroundColor: n.isRead ? 'transparent' : 'var(--bg-subtle, #f0f7ff)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover, #e2e8f0)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = n.isRead ? 'transparent' : 'var(--bg-subtle, #f0f7ff)';
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: 'var(--radius-full, 999px)',
                        backgroundColor: isFinalized
                          ? 'rgba(147, 51, 234, 0.12)'
                          : isGrade
                          ? 'rgba(37, 99, 235, 0.12)'
                          : 'rgba(100, 116, 139, 0.12)',
                        color: isFinalized
                          ? '#9333ea'
                          : isGrade
                          ? '#2563eb'
                          : 'var(--text-muted, #64748b)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isFinalized ? (
                        <GraduationCapIcon size={18} />
                      ) : isGrade ? (
                        <AwardIcon size={18} />
                      ) : (
                        <Bell size={18} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: n.isRead ? 600 : 700,
                          fontSize: '0.85rem',
                          color: 'var(--text-main, #1e293b)',
                          marginBottom: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary, #2563eb)',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-muted, #475569)',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          marginBottom: '4px',
                        }}
                      >
                        {n.message}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                        {formatNotificationTime(n.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--border-color, #e2e8f0)',
              backgroundColor: 'var(--bg-subtle, #f8fafc)',
              textAlign: 'center',
            }}
          >
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/student/transcript');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary, #2563eb)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>Xem kết quả học tập & Bảng điểm</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
