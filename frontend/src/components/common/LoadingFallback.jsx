import { Loader2 } from 'lucide-react';

export default function LoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '380px',
        padding: '40px 20px',
        color: 'var(--text-muted, #64748b)',
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'var(--primary-light, #eff6ff)',
          color: 'var(--primary, #1d4ed8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.12)',
        }}
      >
        <Loader2
          size={22}
          style={{
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>

      <div
        style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-main, #0f172a)',
          letterSpacing: '-0.01em',
        }}
      >
        Đang nạp phân hệ...
      </div>

      <div
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-light, #94a3b8)',
          marginTop: '4px',
        }}
      >
        Tối ưu hóa tải trang thông minh
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
