/**
 * Minimalist Academic Icon System for SMS University Portal
 * Triết lý thiết kế (Design System v2.0 - Minimalist Academic):
 * - Tối giản, thanh lịch, chuẩn mực đại học, không màu mè hay chói mắt.
 * - Nét vẽ đồng bộ strokeWidth = 1.8px (mặc định), bo góc round mềm mại.
 * - Tự động kế thừa currentColor để tương thích hoàn hảo 100% Light & Dark mode.
 */

// Helper generator for standard SVG props
const baseProps = (size, color, strokeWidth, className, style) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: strokeWidth,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: className,
  style: { display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }
});

// ==========================================
// 1. CỔNG 3 PHÂN HỆ (PORTAL HUB DOORS)
// ==========================================

/** Cổng Sinh Viên: Mũ cử nhân tối giản với thân mũ bo vòm & dây tua rua */
export function PortalStudentIcon({ size = 28, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <polygon points="12 3 22 8 12 13 2 8" />
      <path d="M6 10.5V15.5C6 17.5 8.7 19 12 19C15.3 19 18 17.5 18 15.5V10.5" />
      <path d="M20 9V16C20 16.8 19.3 17.5 18.5 17.5" />
    </svg>
  );
}

/** Cổng Giảng Viên & Cán Bộ: Cuốn sách mở trên bục giảng đường đại học */
export function PortalLecturerIcon({ size = 28, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <path d="M4 19.5C6.5 18 9.5 18 12 19.5C14.5 18 17.5 18 20 19.5V6.5C17.5 5 14.5 5 12 6.5C9.5 5 6.5 5 4 6.5V19.5Z" />
      <path d="M12 6.5V19.5" />
      <path d="M8 22H16M12 19.5V22" />
    </svg>
  );
}

/** Cổng Phòng Đào Tạo & Quản Trị: Khiên học viện lồng giảng đường cột Hy Lạp */
export function PortalAdminIcon({ size = 28, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <path d="M12 2L20 5.5V12C20 17 16.5 21 12 22C7.5 21 4 17 4 12V5.5L12 2Z" />
      <polygon points="12 7 16 9.5 8 9.5" />
      <line x1="8" y1="11" x2="8" y2="15" />
      <line x1="12" y1="11" x2="12" y2="15" />
      <line x1="16" y1="11" x2="16" y2="15" />
      <line x1="7" y1="15" x2="17" y2="15" />
    </svg>
  );
}

// ==========================================
// 2. THANH ĐIỀU HƯỚNG & HỆ THỐNG MENU (SIDEBAR)
// ==========================================

/** Bảng Tổng Quan (Dashboard): 4 ô Bento tỉ lệ vàng */
export function DashboardIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <rect x="3" y="3" width="7" height="9" rx="2" />
      <rect x="14" y="3" width="7" height="5" rx="2" />
      <rect x="14" y="12" width="7" height="9" rx="2" />
      <rect x="3" y="16" width="7" height="5" rx="2" />
    </svg>
  );
}

/** Quản lý Sinh Viên (Students): Sinh viên đội mũ cử nhân & người đồng học */
export function StudentsIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <polygon points="9 3 15 6 9 9 3 6" />
      <path d="M5 7.5V10C5 11.5 6.8 12.5 9 12.5C11.2 12.5 13 11.5 13 10V7.5" />
      <path d="M2 18C2 15 5 13.5 9 13.5C13 13.5 16 15 16 18" />
      <path d="M16 12C18 12.3 20 13.5 20 16" />
      <circle cx="17.5" cy="8.5" r="2.5" />
    </svg>
  );
}

/** Giảng Viên & Cán Bộ (Lecturers): Thẻ cán bộ nhận diện + cà vạt học thuật */
export function LecturersIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <circle cx="10" cy="7" r="3.5" />
      <path d="M3 19C3 15.5 6 14 10 14C14 14 17 15.5 17 19" />
      <path d="M10 14V17.5L8.5 19H11.5L10 17.5" />
      <rect x="15" y="10" width="6" height="8" rx="1.5" />
      <line x1="17" y1="13" x2="19" y2="13" />
    </svg>
  );
}

/** Khoa / Viện (Departments): Giảng đường đại học với 4 cột trụ và mái tam giác */
export function DepartmentsIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <polygon points="12 3 21 8 3 8" />
      <line x1="2" y1="8" x2="22" y2="8" />
      <line x1="5.5" y1="9" x2="5.5" y2="18" />
      <line x1="10" y1="9" x2="10" y2="18" />
      <line x1="14" y1="9" x2="14" y2="18" />
      <line x1="18.5" y1="9" x2="18.5" y2="18" />
      <rect x="3" y="18" width="18" height="3" rx="1" />
    </svg>
  );
}

/** Lớp Sinh Hoạt (Classes): Bảng lớp học và các thành viên */
export function ClassesIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <line x1="3" y1="13" x2="21" y2="13" />
      <path d="M7 20L9 17H15L17 20" />
      <circle cx="8" cy="8.5" r="1.5" />
      <circle cx="12" cy="8.5" r="1.5" />
      <circle cx="16" cy="8.5" r="1.5" />
    </svg>
  );
}

/** Môn Học (Subjects): Giáo trình tri thức mở */
export function SubjectsIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <path d="M4 19.5C6.5 18 9.5 18 12 19.5C14.5 18 17.5 18 20 19.5V5.5C17.5 4 14.5 4 12 5.5C9.5 4 6.5 4 4 5.5V19.5Z" />
      <line x1="12" y1="5.5" x2="12" y2="19.5" />
      <line x1="7" y1="9" x2="10" y2="9" />
      <line x1="7" y1="13" x2="10" y2="13" />
    </svg>
  );
}

/** Học Kỳ & Đợt ĐK (Semesters): Cuốn lịch tín chỉ thông minh với chấm đếm nhịp */
export function SemestersIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <rect x="3" y="4" width="18" height="17" rx="3" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="2" x2="8" y2="5" />
      <line x1="16" y1="2" x2="16" y2="5" />
      <circle cx="8" cy="13.5" r="1.2" />
      <circle cx="12" cy="13.5" r="1.2" />
      <circle cx="16" cy="13.5" r="1.2" />
      <line x1="7" y1="17" x2="13" y2="17" />
    </svg>
  );
}

/** Thu Ngân & Học Phí (Tuition): Thẻ chip bảo mật tài chính */
export function TuitionIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <rect x="2" y="4" width="20" height="14" rx="3" />
      <line x1="2" y1="9" x2="22" y2="9" />
      <rect x="5" y="12" width="3.5" height="2.5" rx="0.8" />
      <circle cx="17.5" cy="13.5" r="1.5" />
    </svg>
  );
}

/** Lớp Học Phần (Course Sections): Các khối xếp tầng đa chiều */
export function CourseSectionsIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <polygon points="12 2 21 7 12 12 3 7" />
      <path d="M3 12L12 17L21 12" />
      <path d="M3 17L12 22L21 17" />
    </svg>
  );
}

/** Xếp Lớp Cho SV (Assign Enrollments): Thêm sinh viên vào lớp học phần */
export function AssignEnrollmentsIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <circle cx="9" cy="7" r="4" />
      <path d="M2 20C2 16.5 5 15 9 15C13 15 16 16.5 16 20" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="16" y1="11" x2="22" y2="11" />
    </svg>
  );
}

/** Lịch Học & Xếp Lịch (Schedules): Lịch biểu với đồng hồ điều phối */
export function SchedulesIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <rect x="3" y="4" width="18" height="17" rx="3" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="2" x2="8" y2="5" />
      <line x1="16" y1="2" x2="16" y2="5" />
      <circle cx="14" cy="15" r="3.5" />
      <polyline points="14 13.5 14 15 15.5 15" />
    </svg>
  );
}

/** Sổ Điểm Toàn Trường / Kết Quả Học Tập (Grades): Văn bằng kèm xu hướng điểm số */
export function GradesIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <path d="M5 3C5 2.4 5.4 2 6 2H14L19 7V21C19 21.6 18.6 22 18 22H6C5.4 22 5 21.6 5 21V3Z" />
      <polygon points="14 2 14 7 19 7" />
      <path d="M8 15L10.5 12.5L12.5 14L15.5 10.5" />
      <line x1="8" y1="18" x2="16" y2="18" />
    </svg>
  );
}

/** Cảnh Báo Học Vụ (Academic Warnings): Tam giác bo góc mềm dứt khoát */
export function AcademicWarningsIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <path d="M10.3 3.6C11.1 2.3 12.9 2.3 13.7 3.6L21.4 17.2C22.2 18.5 21.2 20.2 19.7 20.2H4.3C2.8 20.2 1.8 18.5 2.6 17.2L10.3 3.6Z" />
      <line x1="12" y1="8.5" x2="12" y2="13.5" />
      <circle cx="12" cy="16.5" r="1" />
    </svg>
  );
}

/** Duyệt Phúc Khảo (Grade Appeals): Biên bản kiểm định kèm con dấu xác thực */
export function GradeAppealsIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <line x1="8" y1="7.5" x2="16" y2="7.5" />
      <line x1="8" y1="11.5" x2="13" y2="11.5" />
      <circle cx="15.5" cy="15.5" r="3.5" />
      <path d="M14 15.5L15 16.5L17 14.5" />
    </svg>
  );
}

/** Yêu Cầu Cấp Lại Mật Khẩu (Password Resets): Khiên an ninh & Chìa khóa bảo mật */
export function PasswordResetsIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <path d="M12 2L20 5.5V12C20 17 16.5 21 12 22C7.5 21 4 17 4 12V5.5L12 2Z" />
      <circle cx="12" cy="9.5" r="2.5" />
      <path d="M12 12V17M12 14.5H14M12 16.5H13.5" />
    </svg>
  );
}

/** Đăng Ký Học Phần (Enroll): Sách tín chỉ có ruy-băng & nút cộng */
export function EnrollIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <path d="M4 4C4 2.8 5 2 6.5 2H18V18H6.5C5.2 18 4 19 4 20.2V4Z" />
      <path d="M4 18.5C4.8 17.8 5.8 17.5 7 17.5H18V22H6.5C5 22 4 21 4 19.5V18.5Z" />
      <path d="M10 2V9L13 7.5L16 9V2" />
      <line x1="11" y1="13" x2="15" y2="13" />
      <line x1="13" y1="11" x2="13" y2="15" />
    </svg>
  );
}

/** Bảng Điểm Tích Lũy / CPA (Transcript): Mũ cử nhân kèm dấu A+ */
export function TranscriptIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <polygon points="12 3 21 7.5 12 12 3 7.5" />
      <path d="M6 10V15C6 17 8.5 18.5 12 18.5C15.5 18.5 18 17 18 15V10" />
      <circle cx="19" cy="18" r="3.5" />
      <path d="M18 19L19 17.5L20 19M18.5 18.5H19.5" />
    </svg>
  );
}

/** Chương Trình Đào Tạo (Curriculum Roadmap): Các mốc nối nhau + cờ đích */
export function CurriculumIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <path d="M4 18C8 18 8 6 12 6C16 6 16 18 20 18" />
      <circle cx="4" cy="18" r="2.5" />
      <circle cx="12" cy="6" r="2.5" />
      <circle cx="20" cy="18" r="2.5" />
      <path d="M12 6V2L15.5 3.5L12 5" />
    </svg>
  );
}

// ==========================================
// 3. THẺ THỐNG KÊ DASHBOARD & TIỆN ÍCH HỌC VỤ
// ==========================================

/** Đã Tốt Nghiệp / Khen Thưởng (Award): Huy chương cúp vinh danh cử nhân */
export function AwardIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.4 13.5L18 21L12 17.5L6 21L8.6 13.5" />
      <circle cx="12" cy="8" r="2.5" />
    </svg>
  );
}

/** Mũ Cử Nhân Độc Lập (GraduationCap): Biểu tượng học vụ vạn năng */
export function GraduationCapIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <polygon points="12 3 22 8 12 13 2 8" />
      <path d="M6 10.5V15.5C6 17.5 8.7 19 12 19C15.3 19 18 17.5 18 15.5V10.5" />
      <path d="M22 8.5V15" />
    </svg>
  );
}

/** Giáo Trình Mở Độc Lập (BookOpen): Sách bài giảng & học phần */
export function BookOpenIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <path d="M2 3H8C10.2 3 12 4.8 12 7V21C12 19.3 10.2 18 8 18H2V3Z" />
      <path d="M22 3H16C13.8 3 12 4.8 12 7V21C12 19.3 13.8 18 16 18H22V3Z" />
    </svg>
  );
}

/** Khiên Bảo Mật Xác Thực (ShieldCheck): Dùng cho quyền quản trị & an toàn thông tin */
export function ShieldCheckIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <path d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

/** Xu Hướng Điểm Tăng Trưởng (TrendingUp): Dùng cho phân tích GPA/CPA */
export function TrendingUpIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, ...props }) {
  return (
    <svg {...baseProps(size, color, strokeWidth, className, style)} {...props}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
