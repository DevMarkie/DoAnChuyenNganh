import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.hash = '#/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-app, #f8fafc)',
            padding: '24px',
            fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: 'var(--bg-surface, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--border-color, #e2e8f0)',
              padding: '36px 32px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-main, #0f172a)',
                marginBottom: '8px',
              }}
            >
              Đã Xảy Ra Lỗi Bất Ngờ
            </h2>

            <p
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-muted, #64748b)',
                lineHeight: 1.5,
                marginBottom: '24px',
              }}
            >
              Hệ thống đã ghi nhận lỗi giao diện. Vui lòng thử tải lại trang hoặc quay về trang chủ để tiếp tục làm việc.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: 'var(--bg-subtle, #f1f5f9)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '0.775rem',
                  color: 'var(--danger-text, #991b1b)',
                  fontFamily: 'monospace',
                  textAlign: 'left',
                  marginBottom: '24px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  fontSize: '0.9rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'var(--primary, #1d4ed8)',
                  color: '#fff',
                  fontWeight: 600,
                }}
              >
                <RotateCcw size={16} /> Tải lại trang
              </button>

              <button
                onClick={this.handleGoHome}
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  fontSize: '0.9rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  background: 'transparent',
                  color: 'var(--text-main, #0f172a)',
                  fontWeight: 600,
                }}
              >
                <Home size={16} /> Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
