/**
 * SMS University Brand Emblem (Logo)
 * Triết lý thiết kế (UI/UX Pro Max x Ponytail):
 * - Đơn giản, phẳng hiện đại (Flat Modernism), không gradient màu mè.
 * - Ý nghĩa học thuật sâu sắc: Mũ cử nhân (Mortarboard) đặt trên nền tảng
 *   Cuốn sách tri thức & tín chỉ mở (Open Book Foundation).
 * - Palette chính quy: Academic Navy (#1E3A8A) + White (#FFFFFF) + Ice Blue (#DBEAFE) + Điểm nhấn Tassel Vàng (#F59E0B).
 */
export default function SmsLogo({
  size = 36,
  showText = false,
  variant = 'badge', // 'badge' (có nền navy) | 'flat' (trong suốt)
  className = '',
  style = {},
}) {
  const isBadge = variant === 'badge';

  const iconSvg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      {/* 1. Nền Huy hiệu Học viện (Academic Badge Shield) */}
      {isBadge && (
        <>
          <rect width="40" height="40" rx="9" fill="#1E3A8A" />
          <rect x="0.75" y="0.75" width="38.5" height="38.5" rx="8.25" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
        </>
      )}

      {/* 2. Đỉnh Mũ Cử Nhân (Graduation Cap Diamond Top) */}
      <polygon
        points="20,8.5 32.5,14.5 20,20.5 7.5,14.5"
        fill="#FFFFFF"
      />

      {/* 3. Thân Mũ Cử Nhân & Nơ Vòm (Skull Cap Layer) */}
      <path
        d="M12.5 17.5V21.5C12.5 24.2 15.8 25.8 20 25.8C24.2 25.8 27.5 24.2 27.5 21.5V17.5L20 21.2L12.5 17.5Z"
        fill={isBadge ? '#DBEAFE' : '#2563EB'}
      />

      {/* 4. Tua Rua Cử Nhân Vàng Học Thuật (Golden Academic Tassel) */}
      <path
        d="M29.5 16V22.5C29.5 23.3 28.8 24 28 24"
        stroke="#F59E0B"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="28" cy="24" r="1.3" fill="#F59E0B" />

      {/* 5. Đôi Cánh Sách Tín Chỉ Mở (Open Book / Knowledge Foundation) */}
      {/* Trang trái */}
      <path
        d="M9.5 27.2C13.2 25.8 16.8 26.2 20 27.6V31C16.8 29.6 13.2 29.2 9.5 30.6V27.2Z"
        fill="#FFFFFF"
      />
      {/* Trang phải */}
      <path
        d="M30.5 27.2C26.8 25.8 23.2 26.2 20 27.6V31C23.2 29.6 26.8 29.2 30.5 30.6V27.2Z"
        fill={isBadge ? '#BFDBFE' : '#93C5FD'}
      />
      {/* Gáy sách trung tâm */}
      <line x1="20" y1="27.6" x2="20" y2="31" stroke={isBadge ? '#1E3A8A' : '#1E40AF'} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );

  if (!showText) return iconSvg;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      {iconSvg}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <span style={{
          fontWeight: 800,
          fontSize: '0.98rem',
          letterSpacing: '-0.02em',
          color: 'var(--text-main, #0F172A)',
        }}>
          SMS PORTAL
        </span>
        <span style={{
          fontSize: '0.68rem',
          fontWeight: 600,
          color: '#2563EB',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          Quản Lý Đào Tạo
        </span>
      </div>
    </div>
  );
}
