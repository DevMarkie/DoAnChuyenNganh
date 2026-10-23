import { useState, useMemo } from 'react';
import {
  Palette,
  Layers,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Moon,
  Sun,
  ArrowUpRight,
  Search,
  Filter,
  Download,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  Copy,
  RefreshCw,
  Code2,
  Sparkles,
  Zap,
  Flame
} from 'lucide-react';
import {
  ResponsiveContainer,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import './DesignSystemDemo.css';

// Mock Academic Performance Data for Recharts with Aurora styling
const GPA_TREND_DATA = [
  { term: 'HK1 (22-23)', gpa: 3.25, cpa: 3.25, target: 3.20 },
  { term: 'HK2 (22-23)', gpa: 3.42, cpa: 3.34, target: 3.20 },
  { term: 'HK3 (Hè 23)', gpa: 3.60, cpa: 3.39, target: 3.20 },
  { term: 'HK1 (23-24)', gpa: 3.55, cpa: 3.44, target: 3.20 },
  { term: 'HK2 (23-24)', gpa: 3.78, cpa: 3.52, target: 3.20 },
  { term: 'HK1 (24-25)', gpa: 3.82, cpa: 3.58, target: 3.20 },
  { term: 'HK2 (24-25)', gpa: 3.90, cpa: 3.64, target: 3.20 },
];

const GRADE_DISTRIBUTION_DATA = [
  { grade: 'A+ (9.0-10)', count: 12, color: '#10b981' },
  { grade: 'A (8.5-8.9)', count: 18, color: '#06b6d4' },
  { grade: 'B+ (8.0-8.4)', count: 14, color: '#6366f1' },
  { grade: 'B (7.0-7.9)', count: 8, color: '#8b5cf6' },
  { grade: 'C+ (6.5-6.9)', count: 4, color: '#f59e0b' },
  { grade: 'C (5.5-6.4)', count: 2, color: '#f97316' },
  { grade: 'D/F (<5.5)', count: 0, color: '#f43f5e' },
];

const SAMPLE_COURSES = [
  { code: 'IT4010', name: 'Kiến trúc Phần mềm Tiên tiến', credits: 3, midterm: 8.5, final: 9.2, total: 8.9, letter: 'A', status: 'Passed', semester: 'HK1 2024-2025' },
  { code: 'IT4025', name: 'Trí tuệ Nhân tạo & Học máy', credits: 4, midterm: 9.0, final: 9.5, total: 9.3, letter: 'A+', status: 'Passed', semester: 'HK1 2024-2025' },
  { code: 'SE3012', name: 'Thiết kế Trải nghiệm Người dùng (UI/UX)', credits: 3, midterm: 9.5, final: 9.8, total: 9.7, letter: 'A+', status: 'Passed', semester: 'HK1 2024-2025' },
  { code: 'IT3080', name: 'Mạng Máy tính Chuyên sâu', credits: 3, midterm: 7.5, final: 8.0, total: 7.8, letter: 'B', status: 'Passed', semester: 'HK1 2024-2025' },
  { code: 'IT4990', name: 'Đồ án Chuyên ngành Công nghệ Thông tin', credits: 4, midterm: 9.0, final: 9.0, total: 9.0, letter: 'A', status: 'Passed', semester: 'HK1 2024-2025' },
];

export default function DesignSystemDemo() {
  const [theme, setTheme] = useState('dark'); // Default to sleek Dark Glass mode!
  const [accent, setAccent] = useState('default');
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedColor, setCopiedColor] = useState(null);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [sampleToast, setSampleToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [compareMode, setCompareMode] = useState('split');

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(key);
    setTimeout(() => setCopiedColor(null), 1800);
  };

  const triggerToast = (type, title, msg) => {
    setSampleToast({ type, title, msg, id: Date.now() });
    setTimeout(() => setSampleToast(null), 4000);
  };

  const filteredCourses = useMemo(() => {
    if (!searchTerm) return SAMPLE_COURSES;
    return SAMPLE_COURSES.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="ds-wrapper" data-theme={theme} data-accent={accent}>
      {/* AMBIENT AURORA GLOW ORBS IN BACKGROUND */}
      <div className="ds-aurora-bg" aria-hidden="true">
        <div className="ds-orb ds-orb-1" />
        <div className="ds-orb ds-orb-2" />
        <div className="ds-orb ds-orb-3" />
        <div className="ds-orb ds-orb-4" />
      </div>

      {/* 1. FROSTED GLASS HEADER */}
      <header className="ds-header">
        <div className="ds-brand">
          <div className="ds-logo-badge">PK</div>
          <div>
            <h1 className="ds-brand-title">
              Phenikaa SMS Vision OS
              <span className="ds-version-pill">v2.5 Glassmorphism</span>
            </h1>
            <p className="ds-brand-subtitle">
              Apple Optical Glass • Aurora Mesh Glow • VisionOS Squircle Design System
            </p>
          </div>
        </div>

        <div className="ds-header-actions">
          {/* Luminous Accent Theme Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ds-text-muted)' }}>Aurora Accent:</span>
            {[
              { id: 'default', color: '#6366f1', title: 'Electric Iris' },
              { id: 'cyan', color: '#06b6d4', title: 'Cyber Cyan' },
              { id: 'emerald', color: '#10b981', title: 'Luminous Emerald' },
              { id: 'magenta', color: '#ec4899', title: 'Sunset Magenta' },
            ].map((acc) => (
              <button
                key={acc.id}
                title={acc.title}
                onClick={() => setAccent(acc.id)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: acc.color,
                  border: accent === acc.id ? '2px solid #ffffff' : '2px solid transparent',
                  cursor: 'pointer',
                  transform: accent === acc.id ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: accent === acc.id ? `0 0 12px ${acc.color}` : 'none',
                  transition: 'all 0.2s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Theme Toggle (Light / Dark Glass) */}
          <button
            className="ds-btn ds-btn-glass ds-btn-sm"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title="Chuyển chế độ sáng/tối"
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            <span>{theme === 'light' ? 'Dark Glass' : 'Light Glass'}</span>
          </button>

          <a href="#/student/transcript" className="ds-btn ds-btn-primary ds-btn-sm">
            <GraduationCap size={15} />
            <span>Vào Cổng Sinh Viên</span>
          </a>
        </div>
      </header>

      {/* 2. HERO / SHOWCASE BANNER */}
      <section className="ds-hero-banner">
        <div className="ds-hero-content">
          <div className="ds-hero-tag">
            <Sparkles size={14} />
            <span>Apple Vision & Aurora Glassmorphism Interface</span>
          </div>

          <h2 className="ds-hero-title">
            Trải Nghiệm Cổng Đào Tạo Đỉnh Cao với <span>Kính Mờ Xuyên Thấu & Ánh Sáng Aurora</span>
          </h2>

          <p className="ds-hero-desc">
            Xóa bỏ hoàn toàn định kiến về các cổng thông tin đại học cũ kỹ, nặng nề. Bản thiết kế <strong>Apple Glassmorphism v2.5</strong> mang đến
            vật liệu kính quang học (Optical Glass) trong suốt, phản chiếu ánh sáng gradient huyền ảo, bo góc Squircle 18px mềm mại,
            tạo cảm giác cực kỳ sang trọng, công nghệ và hiện đại như macOS Sonoma & visionOS.
          </p>

          <div className="ds-hero-stats">
            <div className="ds-stat-chip">
              <span className="ds-stat-num">24px</span>
              <span className="ds-stat-label">Backdrop Blur Quang Học</span>
            </div>
            <div className="ds-stat-chip">
              <span className="ds-stat-num">18px</span>
              <span className="ds-stat-label">VisionOS Squircle Radii</span>
            </div>
            <div className="ds-stat-chip">
              <span className="ds-stat-num">6.8:1</span>
              <span className="ds-stat-label">Tương Phản Kính Đạt Chuẩn</span>
            </div>
            <div className="ds-stat-chip">
              <span className="ds-stat-num">Aurora</span>
              <span className="ds-stat-label">Mesh Gradient Tinh Xảo</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. NAVIGATION TABS */}
      <nav className="ds-nav-tabs-bar">
        <div className="ds-nav-tabs-inner">
          {[
            { id: 'overview', label: 'Vật Liệu Kính & Triết Lý', icon: <Layers size={16} /> },
            { id: 'tokens', label: 'Bảng Màu Aurora & Glass Tokens', icon: <Palette size={16} /> },
            { id: 'components', label: 'Linh Kiện Kính Tương Tác', icon: <Sliders size={16} /> },
            { id: 'data-viz', label: 'Biểu Đồ Luminous Recharts', icon: <TrendingUp size={16} /> },
            { id: 'prototype-student', label: 'Bản Demo: Bảng Điểm Kính Mờ', icon: <GraduationCap size={16} /> },
            { id: 'prototype-admin', label: 'Bản Demo: Điều Hành Quản Trị', icon: <ShieldCheck size={16} /> },
            { id: 'comparison', label: 'So Sánh: Cũ vs Apple Glass', icon: <RefreshCw size={16} /> },
            { id: 'export', label: 'Mã CSS Tokens Export', icon: <Code2 size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`ds-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 4. MAIN CONTENT TABS */}
      <main className="ds-container">
        {/* ============================================================
            TAB 1: OVERVIEW & PHILOSOPHY
            ============================================================ */}
        {activeTab === 'overview' && (
          <div className="ds-section">
            <div className="ds-section-header">
              <h3 className="ds-section-title">
                <Sparkles size={22} color="var(--ds-primary)" />
                Triết Lý Thiết Kế: Apple Optical Glass & Aurora Mesh
              </h3>
              <p className="ds-section-desc">
                Sự phối hợp tinh tế giữa vật liệu kính trong suốt (frosted glass) và ánh sáng nền cực quang đa tầng (aurora mesh glows).
              </p>
            </div>

            <div className="ds-bento-grid">
              <div className="ds-card ds-col-4">
                <div className="ds-card-header">
                  <div className="ds-kpi-icon" style={{ background: 'var(--ds-primary-light)', color: 'var(--ds-primary)' }}>
                    <Layers size={22} />
                  </div>
                  <span className="ds-badge ds-badge-info">Optical Glass</span>
                </div>
                <h4 className="ds-card-title">1. Vật Liệu Kính Quang Học</h4>
                <p style={{ fontSize: '13.5px', color: 'var(--ds-text-body)', lineHeight: '1.65', marginTop: '10px' }}>
                  Sử dụng <code>backdrop-filter: blur(24px) saturate(180%)</code> giúp bề mặt kính làm nhòe và hội tụ ánh sáng từ nền,
                  mang lại cảm giác bồng bềnh, tinh khiết mà không gây nhiễu loạn chữ đọc.
                </p>
              </div>

              <div className="ds-card ds-col-4">
                <div className="ds-card-header">
                  <div className="ds-kpi-icon" style={{ background: 'var(--ds-success-bg)', color: 'var(--ds-success)' }}>
                    <Flame size={22} />
                  </div>
                  <span className="ds-badge ds-badge-success">Aurora Luminous</span>
                </div>
                <h4 className="ds-card-title">2. Ánh Sáng Cực Quang Năng Động</h4>
                <p style={{ fontSize: '13.5px', color: 'var(--ds-text-body)', lineHeight: '1.65', marginTop: '10px' }}>
                  Từ bỏ màu xanh navy tối tăm cổ lỗ. Chúng tôi sử dụng các quả cầu sáng Aurora mềm mại (Electric Iris, Cyber Cyan, Magenta),
                  chuyển động nhẹ nhàng tạo nên không gian có chiều sâu như đang trải nghiệm kính Apple Vision Pro.
                </p>
              </div>

              <div className="ds-card ds-col-4">
                <div className="ds-card-header">
                  <div className="ds-kpi-icon" style={{ background: 'var(--ds-warning-bg)', color: 'var(--ds-warning)' }}>
                    <Zap size={22} />
                  </div>
                  <span className="ds-badge ds-badge-warning">Specular Borders</span>
                </div>
                <h4 className="ds-card-title">3. Viền Phản Chiếu Ánh Sáng</h4>
                <p style={{ fontSize: '13.5px', color: 'var(--ds-text-body)', lineHeight: '1.65', marginTop: '10px' }}>
                  Mỗi tấm thẻ kính đều có viền mảnh <code>1px solid rgba(255,255,255,0.65)</code> kết hợp bóng sáng nổi trong lòng
                  (<code>inset 0 1px 1px</code>) mô phỏng chính xác khúc xạ cạnh mép của một tấm kính vật lý thật.
                </p>
              </div>

              {/* Bento Feature Highlight */}
              <div className="ds-card ds-col-8">
                <div className="ds-card-header">
                  <h4 className="ds-card-title">Trải Nghiệm Đọc Điểm Số Chuẩn VisionOS</h4>
                  <span className="ds-badge ds-badge-purple">VisionOS 2.0</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                  <div style={{ padding: '16px', background: 'var(--ds-glass-bg-subtle)', borderRadius: 'var(--ds-radius-md)', border: '1px solid var(--ds-glass-border-subtle)' }}>
                    <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--ds-text-title)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={16} color="var(--ds-primary)" /> Điểm GPA Phát Sáng:
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--ds-text-muted)', lineHeight: 1.6 }}>
                      Điểm tích lũy và kết quả học tập được làm nổi bật với font JetBrains Mono sắc sảo, màu chữ có hiệu ứng gradient phát quang tinh tế.
                    </p>
                  </div>
                  <div style={{ padding: '16px', background: 'var(--ds-glass-bg-subtle)', borderRadius: 'var(--ds-radius-md)', border: '1px solid var(--ds-glass-border-subtle)' }}>
                    <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--ds-text-title)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} color="var(--ds-success)" /> Chống Mỏi Mắt Tuyệt Đối:
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--ds-text-muted)', lineHeight: 1.6 }}>
                      Dù là sinh viên tra cứu TKB ban ngày hay thức khuya ôn thi xem điểm, chế độ Dark Glass làm dịu mắt hoàn toàn với độ tương phản văn bản 6.8:1.
                    </p>
                  </div>
                </div>
              </div>

              <div className="ds-card ds-col-4">
                <div className="ds-card-header">
                  <h4 className="ds-card-title">Bộ Nhận Diện Aurora v2.5</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ds-text-title)' }}>Electric Iris (#6366F1)</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ds-text-muted)' }}>Màu của công nghệ tương lai & AI</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ds-text-title)' }}>Cyber Cyan (#06B6D4)</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ds-text-muted)' }}>Màu số hóa đại học & dữ liệu sáng tạo</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ds-text-title)' }}>Fluorescent Emerald (#10B981)</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ds-text-muted)' }}>Màu thành tựu học thuật xuất sắc</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 2: AURORA & GLASS TOKENS
            ============================================================ */}
        {activeTab === 'tokens' && (
          <div className="ds-section">
            <div className="ds-section-header">
              <h3 className="ds-section-title">
                <Palette size={22} color="var(--ds-primary)" />
                Bảng Màu Aurora & Glass Tokens Tiêu Chuẩn
              </h3>
              <p className="ds-section-desc">
                Nhấp vào từng ô để copy giá trị màu và mã biến CSS Token vào bộ nhớ tạm.
              </p>
            </div>

            {/* Aurora Palette */}
            <div className="ds-card">
              <h4 className="ds-card-title" style={{ marginBottom: '16px' }}>
                1. Bảng Màu Aurora Cực Quang (Trẻ Trung, Hiện Đại, Đậm Chất Công Nghệ)
              </h4>
              <div className="ds-swatch-grid">
                {[
                  { name: 'Electric Iris 500', hex: '#6366f1', var: '--ds-primary' },
                  { name: 'Electric Iris 600', hex: '#4f46e5', var: '--ds-primary-hover' },
                  { name: 'Cyber Cyan 500', hex: '#06b6d4', var: '--ds-accent' },
                  { name: 'Sky Azure 400', hex: '#38bdf8', var: '--ds-info' },
                  { name: 'Aurora Magenta', hex: '#ec4899', var: '--ds-purple' },
                  { name: 'Luminous Violet', hex: '#8b5cf6', var: '--ds-purple' },
                  { name: 'Fluorescent Mint', hex: '#10b981', var: '--ds-success' },
                  { name: 'Radiant Amber', hex: '#f59e0b', var: '--ds-warning' },
                ].map((c) => (
                  <button
                    key={c.name}
                    className="ds-swatch-card"
                    onClick={() => copyToClipboard(c.hex, c.name)}
                  >
                    <div className="ds-swatch-preview" style={{ background: c.hex }} />
                    <div className="ds-swatch-info">
                      <div className="ds-swatch-name">{c.name}</div>
                      <div className="ds-swatch-hex">
                        {copiedColor === c.name ? '✓ Đã copy!' : c.hex}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Glass Material Tokens */}
            <div className="ds-card">
              <h4 className="ds-card-title" style={{ marginBottom: '16px' }}>
                2. Thông Số Vật Liệu Kính (Optical Glass Specifications)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'var(--ds-glass-bg)', borderRadius: 'var(--ds-radius-lg)', border: '1px solid var(--ds-glass-border)', boxShadow: 'var(--ds-shadow-glass)' }}>
                  <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--ds-text-title)' }}>Light Glass Surface</div>
                  <div style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '12px', color: 'var(--ds-primary)', marginTop: '6px' }}>
                    background: rgba(255, 255, 255, 0.72);<br />
                    backdrop-filter: blur(20px) saturate(180%);<br />
                    border: 1px solid rgba(255, 255, 255, 0.65);
                  </div>
                </div>

                <div style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.75)', borderRadius: 'var(--ds-radius-lg)', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', color: '#ffffff' }}>
                  <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#f8fafc' }}>Dark Glass Surface</div>
                  <div style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '12px', color: '#818cf8', marginTop: '6px' }}>
                    background: rgba(15, 23, 42, 0.65);<br />
                    backdrop-filter: blur(24px) saturate(190%);<br />
                    border: 1px solid rgba(255, 255, 255, 0.12);
                  </div>
                </div>

                <div style={{ padding: '16px', background: 'var(--ds-glass-bg)', borderRadius: 'var(--ds-radius-lg)', border: '1px solid var(--ds-glass-border)', boxShadow: 'var(--ds-shadow-glass)' }}>
                  <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--ds-text-title)' }}>Specular Highlight Inset</div>
                  <div style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '12px', color: 'var(--ds-primary)', marginTop: '6px' }}>
                    box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.85);<br />
                    border-radius: 18px (Squircle);
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="ds-card">
              <h4 className="ds-card-title" style={{ marginBottom: '16px' }}>
                3. Thang Đo Kiểu Chữ (Plus Jakarta Sans + JetBrains Mono)
              </h4>
              <div className="ds-type-row">
                <div className="ds-type-meta">Display / H1 • 36px • 800</div>
                <h1 className="ds-type-sample" style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1px' }}>
                  Học Kỳ 1 Năm Học 2024-2025
                </h1>
                <div className="ds-type-meta">Outfit / Jakarta</div>
              </div>
              <div className="ds-type-row">
                <div className="ds-type-meta">Section / H2 • 24px • 750</div>
                <h2 className="ds-type-sample" style={{ fontSize: '24px', fontWeight: 750, letterSpacing: '-0.5px' }}>
                  Bảng Điểm & Kết Quả Học Vụ Toàn Khóa
                </h2>
                <div className="ds-type-meta">Outfit / Jakarta</div>
              </div>
              <div className="ds-type-row">
                <div className="ds-type-meta">Mono Code / GPA • 15px • 700</div>
                <div className="ds-type-sample" style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: 700, color: 'var(--ds-primary)' }}>
                  MSV: 21010839 | GPA: 3.90 | CPA: 3.64 | SE3012-01
                </div>
                <div className="ds-type-meta">JetBrains Mono</div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 3: COMPONENT LIBRARY
            ============================================================ */}
        {activeTab === 'components' && (
          <div className="ds-section">
            <div className="ds-section-header">
              <h3 className="ds-section-title">
                <Sliders size={22} color="var(--ds-primary)" />
                Thư Viện Thành Phần Kính Tương Tác (Liquid Glass Components)
              </h3>
              <p className="ds-section-desc">
                Trải nghiệm cảm giác xúc giác (tactile feedback) và chuyển động đàn hồi của từng thành phần.
              </p>
            </div>

            <div className="ds-bento-grid">
              {/* Liquid Buttons */}
              <div className="ds-card ds-col-6">
                <h4 className="ds-card-title">1. Nút Bấm Kính & Gradient (Liquid Glass Buttons)</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                  <button className="ds-btn ds-btn-primary">
                    <Sparkles size={16} />
                    <span>Nút Gradient Chính</span>
                  </button>
                  <button className="ds-btn ds-btn-aurora">
                    <Flame size={16} />
                    <span>Nút Aurora Luminous</span>
                  </button>
                  <button className="ds-btn ds-btn-glass">
                    <span>Nút Kính Mờ (Glass)</span>
                  </button>
                  <button className="ds-btn ds-btn-ghost">
                    <span>Nút Ghost</span>
                  </button>
                  <button className="ds-btn ds-btn-danger">
                    <XCircle size={16} />
                    <span>Hủy Môn</span>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '18px', alignItems: 'center' }}>
                  <button className="ds-btn ds-btn-primary ds-btn-sm">Size SM</button>
                  <button className="ds-btn ds-btn-primary">Size MD</button>
                  <button className="ds-btn ds-btn-primary ds-btn-lg">Size LG Squircle</button>
                </div>
              </div>

              {/* Status Badges */}
              <div className="ds-card ds-col-6">
                <h4 className="ds-card-title">2. Neon Glass Status Pills (Thẻ Trạng Thái Học Vụ)</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
                  <span className="ds-badge ds-badge-success">
                    <span className="ds-badge-dot" /> Đã qua môn (Passed)
                  </span>
                  <span className="ds-badge ds-badge-warning">
                    <span className="ds-badge-dot" /> Đang chờ duyệt phúc khảo
                  </span>
                  <span className="ds-badge ds-badge-danger">
                    <span className="ds-badge-dot" /> Chưa đạt / Học lại
                  </span>
                  <span className="ds-badge ds-badge-info">
                    <span className="ds-badge-dot" /> Đợt đăng ký đang mở
                  </span>
                  <span className="ds-badge ds-badge-purple">
                    <span className="ds-badge-dot" /> Học bổng Xuất Sắc Top 5%
                  </span>
                </div>
              </div>

              {/* Glass Form Inputs */}
              <div className="ds-card ds-col-6">
                <h4 className="ds-card-title">3. Ô Nhập Liệu Kính Xuyên Thấu (Glass Inputs)</h4>
                <div style={{ marginTop: '16px' }}>
                  <div className="ds-input-group">
                    <label className="ds-label">Tìm kiếm học phần hoặc giảng viên</label>
                    <div className="ds-input-wrapper">
                      <Search size={16} className="ds-input-icon" />
                      <input
                        type="text"
                        className="ds-input has-icon"
                        placeholder="Nhập mã môn (VD: IT4010) hoặc tên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ds-input-group">
                    <label className="ds-label">Chọn học kỳ học tập</label>
                    <select className="ds-input ds-select">
                      <option>Học kỳ 1 (2024 - 2025) - Đang diễn ra</option>
                      <option>Học kỳ 2 (2023 - 2024)</option>
                      <option>Học kỳ 1 (2023 - 2024)</option>
                      <option>Toàn bộ các học kỳ</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Toast & Modal Trigger */}
              <div className="ds-card ds-col-6">
                <h4 className="ds-card-title">4. Thông Báo & Modal Thủy Tinh (Glass Dialogs)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="ds-btn ds-btn-glass ds-btn-sm"
                      onClick={() => triggerToast('success', 'Thành Công', 'Đã lưu đăng ký học phần SE3012 vào hệ thống!')}
                    >
                      Bật Toast Thành Công
                    </button>
                    <button
                      className="ds-btn ds-btn-glass ds-btn-sm"
                      onClick={() => triggerToast('warning', 'Nhắc Nhở', 'Hạn nộp học phí đến hết ngày 30/10/2026.')}
                    >
                      Bật Toast Nhắc Nhở
                    </button>
                    <button
                      className="ds-btn ds-btn-aurora ds-btn-sm"
                      onClick={() => setShowSampleModal(true)}
                    >
                      Mở Modal Kính Mờ
                    </button>
                  </div>

                  {sampleToast && (
                    <div
                      style={{
                        padding: '14px 18px',
                        borderRadius: 'var(--ds-radius-md)',
                        background: sampleToast.type === 'success' ? 'var(--ds-success-bg)' : 'var(--ds-warning-bg)',
                        border: `1px solid ${sampleToast.type === 'success' ? 'var(--ds-success-border)' : 'var(--ds-warning-border)'}`,
                        color: sampleToast.type === 'success' ? 'var(--ds-success-text)' : 'var(--ds-warning-text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backdropFilter: 'blur(12px)',
                        animation: 'dsFadeIn 0.25s ease',
                      }}
                    >
                      {sampleToast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '13.5px' }}>{sampleToast.title}</div>
                        <div style={{ fontSize: '12.5px' }}>{sampleToast.msg}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 4: LUMINOUS RECHARTS DATA VIZ
            ============================================================ */}
        {activeTab === 'data-viz' && (
          <div className="ds-section">
            <div className="ds-section-header">
              <h3 className="ds-section-title">
                <TrendingUp size={22} color="var(--ds-primary)" />
                Trực Quan Hóa Dữ Liệu Học Vụ Luminous (Recharts)
              </h3>
              <p className="ds-section-desc">
                Biểu đồ phân tích tiến trình GPA và phổ phân bố điểm với dải màu phát sáng sống động.
              </p>
            </div>

            <div className="ds-bento-grid">
              {/* GPA Trend Chart */}
              <div className="ds-card ds-col-8">
                <div className="ds-card-header">
                  <div>
                    <h4 className="ds-card-title">Tiến Trình Điểm Trung Bình GPA & CPA (7 Học Kỳ)</h4>
                    <p className="ds-card-subtitle">Đường cong mượt mà phản chiếu qua bề mặt kính mờ</p>
                  </div>
                  <span className="ds-badge ds-badge-success">
                    <ArrowUpRight size={14} /> Tăng trưởng +0.65
                  </span>
                </div>
                <div style={{ height: '320px', width: '100%', marginTop: '12px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={GPA_TREND_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gpaAurora" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ds-glass-border-subtle)" />
                      <XAxis dataKey="term" stroke="var(--ds-text-muted)" fontSize={12} tickLine={false} />
                      <YAxis domain={[2.5, 4.0]} stroke="var(--ds-text-muted)" fontSize={12} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--ds-glass-bg)',
                          backdropFilter: 'blur(16px)',
                          borderColor: 'var(--ds-glass-border)',
                          borderRadius: '12px',
                          color: 'var(--ds-text-title)',
                          boxShadow: 'var(--ds-shadow-glass)',
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="gpa"
                        name="GPA Học Kỳ"
                        stroke="#6366f1"
                        strokeWidth={3.5}
                        fillOpacity={1}
                        fill="url(#gpaAurora)"
                        dot={{ r: 5, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                        activeDot={{ r: 8, fill: '#06b6d4' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cpa"
                        name="CPA Tích Lũy"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        strokeDasharray="4 4"
                        dot={{ r: 4, fill: '#10b981' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Grade Distribution */}
              <div className="ds-card ds-col-4">
                <div className="ds-card-header">
                  <div>
                    <h4 className="ds-card-title">Phổ Điểm Học Tập</h4>
                    <p className="ds-card-subtitle">58 môn học đã tích lũy</p>
                  </div>
                </div>
                <div style={{ height: '320px', width: '100%', marginTop: '12px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={GRADE_DISTRIBUTION_DATA} layout="vertical" margin={{ top: 5, right: 20, left: 15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ds-glass-border-subtle)" horizontal={false} />
                      <XAxis type="number" stroke="var(--ds-text-muted)" fontSize={11} tickLine={false} />
                      <YAxis dataKey="grade" type="category" stroke="var(--ds-text-muted)" fontSize={11} tickLine={false} width={80} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--ds-glass-bg)',
                          backdropFilter: 'blur(16px)',
                          borderColor: 'var(--ds-glass-border)',
                          borderRadius: '12px',
                          color: 'var(--ds-text-title)',
                        }}
                      />
                      <Bar dataKey="count" name="Số lượng môn" radius={[0, 8, 8, 0]}>
                        {GRADE_DISTRIBUTION_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 5: REDESIGNED STUDENT TRANSCRIPT PROTOTYPE
            ============================================================ */}
        {activeTab === 'prototype-student' && (
          <div className="ds-section">
            <div className="ds-section-header">
              <h3 className="ds-section-title">
                <GraduationCap size={22} color="var(--ds-primary)" />
                Bản Demo Trực Tiếp: Bảng Điểm Kính Mờ & Học Vụ Sinh Viên
              </h3>
              <p className="ds-section-desc">
                Thiết kế lại hoàn toàn theo chuẩn Bento Grid Squircle với các tấm kính nổi trên nền Aurora mesh glow.
              </p>
            </div>

            {/* Bento KPI Glass Cards */}
            <div className="ds-bento-grid">
              <div className="ds-card ds-col-3">
                <div className="ds-kpi-card">
                  <div className="ds-kpi-top">
                    <span className="ds-kpi-label">CPA TÍCH LŨY</span>
                    <span className="ds-badge ds-badge-success">
                      <ArrowUpRight size={12} /> +0.06
                    </span>
                  </div>
                  <div className="ds-kpi-value" style={{ background: 'var(--ds-primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    3.64 / 4.0
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ds-text-muted)', fontWeight: 600 }}>
                    Xếp loại: <strong>Xuất Sắc</strong> (Top 5% Khoa)
                  </div>
                </div>
              </div>

              <div className="ds-card ds-col-3">
                <div className="ds-kpi-card">
                  <div className="ds-kpi-top">
                    <span className="ds-kpi-label">TÍN CHỈ TÍCH LŨY</span>
                    <span className="ds-badge ds-badge-info">90% Tiến độ</span>
                  </div>
                  <div className="ds-kpi-value">135 / 150</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ds-text-muted)', fontWeight: 600 }}>
                    Còn <strong>15 tín chỉ</strong> (Đồ án tốt nghiệp)
                  </div>
                </div>
              </div>

              <div className="ds-card ds-col-3">
                <div className="ds-kpi-card">
                  <div className="ds-kpi-top">
                    <span className="ds-kpi-label">ĐIỂM RÈN LUYỆN</span>
                    <span className="ds-badge ds-badge-purple">Xuất sắc</span>
                  </div>
                  <div className="ds-kpi-value">92 / 100</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ds-text-muted)', fontWeight: 600 }}>
                    Cộng <strong>5 điểm</strong> NCKH cấp Trường
                  </div>
                </div>
              </div>

              <div className="ds-card ds-col-3">
                <div className="ds-kpi-card">
                  <div className="ds-kpi-top">
                    <span className="ds-kpi-label">TRẠNG THÁI HỌC VỤ</span>
                    <span className="ds-badge ds-badge-success">An toàn</span>
                  </div>
                  <div className="ds-kpi-value" style={{ fontSize: '22px', color: 'var(--ds-success)' }}>
                    Bình Thường (Mức 0)
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ds-text-muted)', fontWeight: 600 }}>
                    Không có cảnh báo học tập nào
                  </div>
                </div>
              </div>
            </div>

            {/* Transcript Table */}
            <div className="ds-card" style={{ marginTop: '20px' }}>
              <div className="ds-card-header">
                <div>
                  <h4 className="ds-card-title">Kết Quả Học Tập Học Kỳ 1 (2024 - 2025)</h4>
                  <p className="ds-card-subtitle">Hiển thị danh sách môn học, điểm chi tiết và xếp loại chữ</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="ds-btn ds-btn-glass ds-btn-sm">
                    <Filter size={14} /> Lọc Kỳ
                  </button>
                  <button className="ds-btn ds-btn-primary ds-btn-sm">
                    <Download size={14} /> Xuất Bảng Điểm (PDF)
                  </button>
                </div>
              </div>

              <div className="ds-table-container">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Mã Môn</th>
                      <th>Tên Môn Học</th>
                      <th>Số Tín Chỉ</th>
                      <th>Điểm Quá Trình (40%)</th>
                      <th>Điểm Thi (60%)</th>
                      <th>Tổng Kết (Hệ 10)</th>
                      <th>Điểm Chữ</th>
                      <th>Trạng Thái</th>
                      <th>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((c) => (
                      <tr key={c.code}>
                        <td className="ds-code-cell">{c.code}</td>
                        <td style={{ fontWeight: 700, color: 'var(--ds-text-title)' }}>{c.name}</td>
                        <td style={{ fontFamily: 'var(--ds-font-mono)' }}>{c.credits}</td>
                        <td style={{ fontFamily: 'var(--ds-font-mono)' }}>{c.midterm}</td>
                        <td style={{ fontFamily: 'var(--ds-font-mono)' }}>{c.final}</td>
                        <td style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: 800, color: 'var(--ds-primary)' }}>
                          {c.total}
                        </td>
                        <td>
                          <span
                            className="ds-badge"
                            style={{
                              background: c.letter.startsWith('A') ? 'var(--ds-success-bg)' : 'var(--ds-accent-light)',
                              color: c.letter.startsWith('A') ? 'var(--ds-success-text)' : 'var(--ds-accent)',
                              fontFamily: 'var(--ds-font-mono)',
                              fontWeight: 800,
                            }}
                          >
                            {c.letter}
                          </span>
                        </td>
                        <td>
                          <span className="ds-badge ds-badge-success">
                            <span className="ds-badge-dot" /> Đạt
                          </span>
                        </td>
                        <td>
                          <button
                            className="ds-btn ds-btn-ghost ds-btn-sm"
                            onClick={() => triggerToast('info', 'Phúc khảo môn học', `Đang chuẩn bị hồ sơ phúc khảo môn ${c.name}`)}
                          >
                            Phúc khảo
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 6: ADMIN OPERATIONS PROTOTYPE
            ============================================================ */}
        {activeTab === 'prototype-admin' && (
          <div className="ds-section">
            <div className="ds-section-header">
              <h3 className="ds-section-title">
                <ShieldCheck size={22} color="var(--ds-primary)" />
                Bản Demo Trực Tiếp: Bảng Điều Hành Quản Trị Viên (Admin Console)
              </h3>
              <p className="ds-section-desc">
                Trung tâm giám sát toàn diện với giao diện kính quang học cao cấp dành cho Phòng đào tạo.
              </p>
            </div>

            <div className="ds-bento-grid">
              <div className="ds-card ds-col-3">
                <div className="ds-kpi-card">
                  <span className="ds-kpi-label">TỔNG SINH VIÊN</span>
                  <div className="ds-kpi-value">14,820</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ds-success)', fontWeight: 600 }}>● 98.4% Đang theo học</div>
                </div>
              </div>
              <div className="ds-card ds-col-3">
                <div className="ds-kpi-card">
                  <span className="ds-kpi-label">LỚP HỌC PHẦN MỞ</span>
                  <div className="ds-kpi-value">648</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ds-text-muted)' }}>HK1 2024-2025</div>
                </div>
              </div>
              <div className="ds-card ds-col-3">
                <div className="ds-kpi-card">
                  <span className="ds-kpi-label">CẢNH BÁO HỌC VỤ</span>
                  <div className="ds-kpi-value" style={{ color: 'var(--ds-danger)' }}>42</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ds-danger)', fontWeight: 600 }}>Cần hội đồng xử lý</div>
                </div>
              </div>
              <div className="ds-card ds-col-3">
                <div className="ds-kpi-card">
                  <span className="ds-kpi-label">ĐƠN PHÚC KHẢO</span>
                  <div className="ds-kpi-value" style={{ color: 'var(--ds-warning)' }}>18</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ds-text-muted)' }}>6 đơn mới trong ngày</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div
              className="ds-card"
              style={{
                marginTop: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--ds-text-title)' }}>Thao Tác Nhanh:</span>
                <button className="ds-btn ds-btn-primary ds-btn-sm">+ Tạo Học Kỳ Mới</button>
                <button className="ds-btn ds-btn-glass ds-btn-sm">Khóa Bảng Điểm Hàng Loạt</button>
                <button className="ds-btn ds-btn-glass ds-btn-sm">Tự Động Sinh Thời Khóa Biểu</button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="ds-badge ds-badge-info">Cổng Đào Tạo: Online</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 7: BEFORE & AFTER COMPARISON
            ============================================================ */}
        {activeTab === 'comparison' && (
          <div className="ds-section">
            <div className="ds-section-header">
              <h3 className="ds-section-title">
                <RefreshCw size={22} color="var(--ds-primary)" />
                So Sánh Trực Quan: Bản Cổ Điển vs Apple Glassmorphism v2.5 Mới
              </h3>
              <p className="ds-section-desc">
                Minh chứng rõ nét vì sao phong cách Kính Mờ & Aurora vượt trội hoàn toàn so với phong cách Navy cũ.
              </p>
            </div>

            <div className="ds-compare-box">
              <div className="ds-compare-toolbar">
                <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--ds-text-title)' }}>
                  Chế độ so sánh:
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`ds-btn ds-btn-sm ${compareMode === 'split' ? 'ds-btn-primary' : 'ds-btn-glass'}`}
                    onClick={() => setCompareMode('split')}
                  >
                    Chia Đôi (Split View)
                  </button>
                  <button
                    className={`ds-btn ds-btn-sm ${compareMode === 'before' ? 'ds-btn-primary' : 'ds-btn-glass'}`}
                    onClick={() => setCompareMode('before')}
                  >
                    Bản Cũ (Navy Cổ Điển)
                  </button>
                  <button
                    className={`ds-btn ds-btn-sm ${compareMode === 'after' ? 'ds-btn-primary' : 'ds-btn-glass'}`}
                    onClick={() => setCompareMode('after')}
                  >
                    Bản Mới (Apple Glass v2.5)
                  </button>
                </div>
              </div>

              <div
                className="ds-compare-split"
                style={{
                  gridTemplateColumns: compareMode === 'split' ? '1fr 1fr' : '1fr',
                }}
              >
                {/* Legacy Side */}
                {(compareMode === 'split' || compareMode === 'before') && (
                  <div className="ds-compare-side legacy">
                    <span className="ds-side-tag legacy-tag">BẢN THIẾT KẾ CŨ (NAVY CỔ ĐIỂN - BỊ CHÊ GIÀ)</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ border: '1px solid #cbd5e1', padding: '16px', background: '#ffffff', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#1e3a5f', fontWeight: 700, textTransform: 'uppercase' }}>CPA Tích Lũy</div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#1e3a5f' }}>3.64 / 4.0</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>Tone xanh đậm + vàng nâu hơi u tối</div>
                      </div>

                      <div style={{ border: '1px solid #cbd5e1', background: '#ffffff', padding: '14px', borderRadius: '4px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px', color: '#1e3a5f' }}>Bảng Điểm Môn Học</div>
                        <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.8 }}>
                          • IT4010 - Kiến trúc PM: 8.9 (A) - Đạt<br />
                          • IT4025 - Trí tuệ Nhân tạo: 9.3 (A+) - Đạt<br />
                          • SE3012 - UI/UX Pro Max: 9.7 (A+) - Đạt
                        </div>
                      </div>

                      <div style={{ fontSize: '12.5px', color: '#b45309', background: '#fef3c7', padding: '12px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                        ❌ Hạn chế bản cũ: Tone xanh Navy (#1E3A5F) và vàng nâu (#D97706) tạo cảm giác như trang web hành chính thập niên 2010,
                        thiếu ánh sáng, các góc bo vuông vức tạo cảm giác gò bó và nặng nề.
                      </div>
                    </div>
                  </div>
                )}

                {/* Modern Apple Glass Side */}
                {(compareMode === 'split' || compareMode === 'after') && (
                  <div className="ds-compare-side modern">
                    <span className="ds-side-tag modern-tag">BẢN MỚI: APPLE VISION & AURORA GLASSMORPHISM</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div className="ds-card" style={{ padding: '18px' }}>
                        <div className="ds-kpi-top">
                          <span className="ds-kpi-label">CPA TÍCH LŨY TOÀN KHÓA</span>
                          <span className="ds-badge ds-badge-success">Top 5% Khoa</span>
                        </div>
                        <div className="ds-kpi-value" style={{ background: 'var(--ds-primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                          3.64 / 4.0
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--ds-text-muted)', fontWeight: 600 }}>
                          Học lực: <strong>Xuất Sắc</strong> • Tích lũy <strong>135/150</strong> tín chỉ
                        </div>
                      </div>

                      <div className="ds-table-container">
                        <table className="ds-table">
                          <thead>
                            <tr>
                              <th>Mã Môn</th>
                              <th>Tên Môn Học</th>
                              <th>Điểm</th>
                              <th>Trạng Thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="ds-code-cell">IT4010</td>
                              <td style={{ fontWeight: 700 }}>Kiến trúc Phần mềm Tiên tiến</td>
                              <td><span className="ds-badge ds-badge-success">A</span></td>
                              <td><span className="ds-badge ds-badge-success"><span className="ds-badge-dot" /> Đạt</span></td>
                            </tr>
                            <tr>
                              <td className="ds-code-cell">SE3012</td>
                              <td style={{ fontWeight: 700 }}>Thiết kế UI/UX Apple Glass</td>
                              <td><span className="ds-badge ds-badge-purple">A+</span></td>
                              <td><span className="ds-badge ds-badge-success"><span className="ds-badge-dot" /> Đạt</span></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div style={{ fontSize: '12.5px', color: 'var(--ds-success-text)', background: 'var(--ds-success-bg)', padding: '12px', borderRadius: 'var(--ds-radius-md)', border: '1px solid var(--ds-success-border)' }}>
                        ✨ Đột phá v2.5: Bề mặt kính mờ quang học xuyên thấu, ánh sáng cực quang Aurora lung linh, bo tròn Squircle 18px mềm mại,
                        chuẩn mực macOS & visionOS, mang lại trải nghiệm hào hứng và tự hào cho sinh viên.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 8: CODE EXPORT
            ============================================================ */}
        {activeTab === 'export' && (
          <div className="ds-section">
            <div className="ds-section-header">
              <h3 className="ds-section-title">
                <Code2 size={22} color="var(--ds-primary)" />
                Mã Nguồn CSS Apple Glassmorphism Tokens Sẵn Sàng Triển Khai
              </h3>
              <p className="ds-section-desc">
                Chỉ cần sao chép các biến bên dưới và thay vào <code>index.css</code> khi bạn sẵn sàng duyệt triển khai code.
              </p>
            </div>

            <div className="ds-card">
              <div className="ds-card-header">
                <h4 className="ds-card-title">:root & [data-theme='dark'] Apple Glass Tokens</h4>
                <button
                  className="ds-btn ds-btn-primary ds-btn-sm"
                  onClick={() =>
                    copyToClipboard(
`:root {
  /* Apple Vision & Aurora Glass Tokens */
  --font-sans: 'Plus Jakarta Sans', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-blur: blur(20px) saturate(180%);
  --glass-border: rgba(255, 255, 255, 0.65);
  --glass-inset-shine: inset 0 1px 1px 0 rgba(255, 255, 255, 0.85);
  
  --primary: #6366f1;
  --primary-gradient: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
  --accent: #06b6d4;
  --radius-lg: 18px;
}

[data-theme='dark'] {
  --glass-bg: rgba(15, 23, 42, 0.65);
  --glass-blur: blur(24px) saturate(190%);
  --glass-border: rgba(255, 255, 255, 0.12);
  --primary: #818cf8;
  --bg-app: #080d1a;
}`,
                      'css-export'
                    )
                  }
                >
                  <Copy size={14} />
                  <span>{copiedColor === 'css-export' ? 'Đã copy mã!' : 'Sao Chép CSS Tokens'}</span>
                </button>
              </div>

              <pre className="ds-code-block">
                <code>{`/* PHENIKAA SMS - APPLE VISION & AURORA GLASSMORPHISM TOKENS */
:root {
  /* Fonts */
  --font-sans: 'Plus Jakarta Sans', 'Outfit', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Optical Glass Material (Light) */
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-blur: blur(20px) saturate(180%);
  --glass-border: rgba(255, 255, 255, 0.65);
  --glass-inset-shine: inset 0 1px 1px 0 rgba(255, 255, 255, 0.85);

  /* Luminous Aurora Brand */
  --primary: #6366f1;           /* Electric Iris */
  --primary-gradient: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
  --aurora-gradient: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  --accent: #06b6d4;            /* Cyber Cyan */
  --success: #10b981;           /* Luminous Emerald */
  --warning: #f59e0b;           /* Radiant Amber */
  --danger: #f43f5e;            /* Vivid Rose */

  /* VisionOS Squircle Radii */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 24px;
}

[data-theme='dark'] {
  /* Optical Glass Material (Dark) */
  --bg-app: #080d1a;
  --glass-bg: rgba(15, 23, 42, 0.65);
  --glass-blur: blur(24px) saturate(190%);
  --glass-border: rgba(255, 255, 255, 0.12);
  --glass-inset-shine: inset 0 1px 1px 0 rgba(255, 255, 255, 0.18);
  --primary: #818cf8;
}`}</code>
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* SAMPLE GLASS MODAL */}
      {showSampleModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(8, 13, 26, 0.65)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'dsFadeIn 0.25s ease',
          }}
          onClick={() => setShowSampleModal(false)}
        >
          <div
            className="ds-card"
            style={{
              maxWidth: '540px',
              width: '100%',
              background: 'var(--ds-glass-bg)',
              boxShadow: 'var(--ds-shadow-glass-hover)',
              border: '1px solid var(--ds-glass-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ds-card-header">
              <h4 className="ds-card-title">
                <Sparkles size={18} color="var(--ds-primary)" />
                Chi Tiết Đơn Phúc Khảo (Glass Dialog)
              </h4>
              <button
                className="ds-btn ds-btn-ghost ds-btn-sm"
                onClick={() => setShowSampleModal(false)}
              >
                <XCircle size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--ds-text-body)', lineHeight: 1.65 }}>
              Hệ thống sẽ chuyển đơn phúc khảo điểm thi cuối kỳ môn <strong>IT4010 - Kiến trúc Phần mềm</strong> tới Trưởng Bộ môn
              và Giảng viên phụ trách chấm thi trong vòng 48 giờ làm việc.
            </p>

            <div style={{ padding: '14px', background: 'var(--ds-glass-bg-subtle)', borderRadius: 'var(--ds-radius-md)', margin: '16px 0', border: '1px solid var(--ds-glass-border-subtle)' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ds-text-title)' }}>
                Lệ phí phúc khảo: 50,000 VNĐ / bài thi
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ds-text-muted)' }}>
                (Hoàn lại 100% nếu phát hiện sai lệch làm tăng điểm số)
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
              <button className="ds-btn ds-btn-glass" onClick={() => setShowSampleModal(false)}>
                Hủy Bỏ
              </button>
              <button
                className="ds-btn ds-btn-aurora"
                onClick={() => {
                  setShowSampleModal(false);
                  triggerToast('success', 'Đã Gửi Đơn', 'Đơn phúc khảo đã được ghi nhận trên hệ thống.');
                }}
              >
                Xác Nhận Nộp Đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
