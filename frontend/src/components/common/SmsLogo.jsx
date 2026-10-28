/**
 * SMS University Brand Emblem (Logo)
 * Triết lý thiết kế (Minimalist Academic Clean):
 * - Đơn giản, phẳng hiện đại, không màu mè hay gradient sặc sỡ.
 * - Nhận diện học thuật đặc trưng: Mũ cử nhân (Mortarboard) đặt trên nền tảng Cuốn sách tri thức mở.
 * - Nét vẽ 1.8px thanh thoát, tương thích hoàn hảo mọi chế độ hiển thị (Sáng / Tối).
 */
export default function SmsLogo({
  size = 36,
  showText = false,
  variant = 'badge', // 'badge' (khung viền xanh navy) | 'flat' (trong suốt)
  className = '',
  style = {},
}) {
  const isBadge = variant === 'badge';

  const iconSvg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 36 36"
      width={size}
      height={size}
      fill="none"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      {/* 1. Nền Huy Hiệu (nếu là variant 'badge') */}
      {isBadge && (
        <rect
          x="1"
          y="1"
          width="34"
          height="34"
          rx="8"
          fill="#1E3A8A"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="1.2"
        />
      )}

      {/* 2. Đỉnh Mũ Cử Nhân (Mortarboard Diamond Top) */}
      <polygon
        points="18,7 29,12.5 18,18 7,12.5"
        fill={isBadge ? '#FFFFFF' : '#2563EB'}
      />

      {/* 3. Thân Vòm Mũ Cử Nhân (Skull Cap Base) */}
      <path
        d="M11 15.5V19C11 21.2 13.8 22.5 18 22.5C22.2 22.5 25 21.2 25 19V15.5L18 19L11 15.5Z"
        fill={isBadge ? '#DBEAFE' : '#93C5FD'}
      />

      {/* 4. Dây Tua Rua Vàng Học Thuật (Golden Academic Tassel) */}
      <path
        d="M26.5 14V20C26.5 20.8 25.8 21.5 25 21.5"
        stroke="#F59E0B"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="25" cy="21.5" r="1.2" fill="#F59E0B" />

      {/* 5. Bệ Cuốn Sách Tri Thức Mở (Open Book Foundation) */}
      <path
        d="M8 25.5C11 24.2 14.5 24.2 18 25.6C21.5 24.2 25 24.2 28 25.5V28C25 26.8 21.5 26.8 18 28.2C14.5 26.8 11 26.8 8 28V25.5Z"
        fill={isBadge ? '#93C5FD' : '#3B82F6'}
      />
      <line
        x1="18"
        y1="25.6"
        x2="18"
        y2="28.2"
        stroke={isBadge ? '#1E3A8A' : '#1D4ED8'}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
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
