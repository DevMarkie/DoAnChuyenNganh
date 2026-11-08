import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { formatViDate } from '../common/WeekCalendarPicker';

// Mapping tên Thứ tiếng Việt sang JS Day (0: Chủ Nhật, 1: Thứ Hai, ..., 6: Thứ Bảy)
const VN_DAY_MAP = {
  'thứ hai': 1, 'thứ 2': 1, 't2': 1,
  'thứ ba': 2, 'thứ 3': 2, 't3': 2,
  'thứ tư': 3, 'thứ 4': 3, 't4': 3,
  'thứ năm': 4, 'thứ 5': 4, 't5': 4,
  'thứ sáu': 5, 'thứ 6': 5, 't6': 5,
  'thứ bảy': 6, 'thứ 7': 6, 't7': 6,
  'chủ nhật': 0, 'cn': 0,
};

const PERIOD_TIMES = {
  1: { start: '07:00', end: '07:45' },
  2: { start: '07:50', end: '08:35' },
  3: { start: '08:45', end: '09:30' },
  4: { start: '09:35', end: '10:20' },
  5: { start: '10:30', end: '11:15' },
  6: { start: '11:20', end: '12:05' },
  7: { start: '12:30', end: '13:15' },
  8: { start: '13:20', end: '14:05' },
  9: { start: '14:15', end: '15:00' },
  10: { start: '15:05', end: '15:50' },
  11: { start: '16:00', end: '16:45' },
  12: { start: '16:50', end: '17:35' },
};

/**
 * Phân tích chuỗi schedule của lớp học phần (vd: "Thứ Bảy (16:00-18:25)" hoặc "Thứ 4 (1-3)")
 */
function parseScheduleString(scheduleStr) {
  if (!scheduleStr) return [];
  const parts = scheduleStr.split(/[,;]/);
  const slots = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Pattern 1: Giờ cụ thể "Thứ Bảy (16:00-18:25)"
    const timeMatch = trimmed.match(
      /(thứ\s*[^\s(]+|[^\s(]+)\s*\(\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\s*\)/i
    );
    if (timeMatch) {
      const dayRaw = timeMatch[1].trim();
      const startMin = parseInt(timeMatch[2], 10) * 60 + parseInt(timeMatch[3], 10);
      const endMin = parseInt(timeMatch[4], 10) * 60 + parseInt(timeMatch[5], 10);
      const jsDay = VN_DAY_MAP[dayRaw.toLowerCase()] ?? 1;
      slots.push({
        dayName: dayRaw,
        jsDay,
        timeString: `${timeMatch[2].padStart(2, '0')}:${timeMatch[3]} - ${timeMatch[4].padStart(2, '0')}:${timeMatch[5]}`,
        startMin,
        endMin,
      });
      continue;
    }

    // Pattern 2: Tiết học "Thứ 4 (1-3)" hoặc "T4 (1-3)"
    const periodMatch = trimmed.match(
      /(thứ\s*\d+|t\d+|cn)\s*\(\s*(\d{1,2})\s*-\s*(\d{1,2})\s*\)/i
    );
    if (periodMatch) {
      const dayRaw = periodMatch[1].trim();
      const pStart = parseInt(periodMatch[2], 10);
      const pEnd = parseInt(periodMatch[3], 10);
      const jsDay = VN_DAY_MAP[dayRaw.toLowerCase()] ?? 1;
      const startTime = PERIOD_TIMES[pStart]?.start || `Tiết ${pStart}`;
      const endTime = PERIOD_TIMES[pEnd]?.end || `Tiết ${pEnd}`;
      slots.push({
        dayName: dayRaw,
        jsDay,
        timeString: `${startTime} - ${endTime} (Tiết ${pStart}-${pEnd})`,
        startMin: pStart * 50,
        endMin: pEnd * 50,
      });
      continue;
    }

    // Pattern 3: Fallback
    const dayOnlyMatch = trimmed.match(/(thứ\s*[^\s(]+|[^\s(]+)/i);
    if (dayOnlyMatch) {
      const dayRaw = dayOnlyMatch[1].trim();
      const jsDay = VN_DAY_MAP[dayRaw.toLowerCase()] ?? 1;
      slots.push({
        dayName: dayRaw,
        jsDay,
        timeString: trimmed,
        startMin: 0,
        endMin: 0,
      });
    }
  }

  return slots;
}

export default function SectionScheduleDetailModal({
  section,
  isOpen,
  onClose,
  isEnrolled = false,
  enrolledSections = [],
  onEnroll,
  onCancel,
  enrollmentId,
  isEnrolling = false,
  canRegister = true,
}) {
  // Xử lý phím Escape để đóng modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Kiểm tra trùng lịch với các môn đã chọn
  const conflictInfo = useMemo(() => {
    if (!section || isEnrolled) return null;
    const currentSlots = parseScheduleString(section.schedule);
    if (currentSlots.length === 0) return null;

    for (const enrolled of enrolledSections) {
      if (!enrolled || enrolled.id === section.id) continue;
      const otherSlots = parseScheduleString(enrolled.schedule);

      for (const cur of currentSlots) {
        for (const oth of otherSlots) {
          if (cur.jsDay === oth.jsDay) {
            const overlap = !(cur.endMin <= oth.startMin || cur.startMin >= oth.endMin);
            if (overlap) {
              return {
                conflictingSubject: enrolled.subject?.subjectName || enrolled.sectionCode,
                conflictingSectionCode: enrolled.sectionCode,
                dayName: cur.dayName,
                timeString: cur.timeString,
              };
            }
          }
        }
      }
    }
    return null;
  }, [section, isEnrolled, enrolledSections]);

  // CHỈ SINH LỊCH CHO ĐÚNG MÔN NÀY VÀ LỚP HỌC PHẦN NÀY
  const sessions = useMemo(() => {
    if (!section) return [];

    const slots = parseScheduleString(section.schedule);
    if (slots.length === 0) return [];

    const semester = section.semester || {};
    const startDateStr = semester.startDate;
    const endDateStr = semester.endDate;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Xác định khoảng thời gian học kỳ của riêng lớp này
    const semStart = startDateStr ? new Date(`${startDateStr}T00:00:00`) : new Date(today);
    const semEnd = endDateStr
      ? new Date(`${endDateStr}T23:59:59`)
      : new Date(semStart.getTime() + 15 * 7 * 86400000);

    const allSessions = [];

    slots.forEach((slot) => {
      let cur = new Date(semStart);
      // Tìm ngày đầu tiên trong kỳ khớp với Thứ của lớp
      while (cur.getDay() !== slot.jsDay && cur <= semEnd) {
        cur.setDate(cur.getDate() + 1);
      }

      // Lặp mỗi tuần 1 buổi cho đến khi kết thúc kỳ học
      while (cur <= semEnd) {
        allSessions.push({
          date: new Date(cur),
          dayName: slot.dayName,
          timeStr: slot.timeString,
          room: section.room || '—',
        });
        cur.setDate(cur.getDate() + 7);
      }
    });

    // Sắp xếp các buổi theo thứ tự thời gian tăng dần
    allSessions.sort((a, b) => a.date - b.date);

    let foundNext = false;
    return allSessions.map((s, idx) => {
      const itemDate = new Date(s.date);
      itemDate.setHours(0, 0, 0, 0);
      const isPast = itemDate < today;
      const isToday = itemDate.getTime() === today.getTime();
      let isNext = false;
      if (!foundNext && (isToday || itemDate > today)) {
        isNext = true;
        foundNext = true;
      }

      return {
        sessionNumber: idx + 1,
        date: s.date,
        formattedDate: formatViDate(s.date),
        dayName: s.dayName,
        timeStr: s.timeStr,
        room: s.room,
        isPast,
        isToday,
        isNext,
      };
    });
  }, [section]);

  if (!isOpen || !section) return null;

  const subject = section.subject || {};
  const lecturer = section.lecturer || {};
  const semester = section.semester || {};
  const isFull = (section.currentStudents || 0) >= (section.maxStudents || 40);

  return createPortal(
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle, #f8fafc)',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: 'var(--primary, #2563eb)',
                  backgroundColor: 'var(--primary-light, #eff6ff)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--primary-border, #bfdbfe)',
                }}
              >
                {section.sectionCode}
              </span>
              <span className="badge badge-info">{subject.credits || 3} Tín chỉ</span>
              {isEnrolled && (
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> Đã đăng ký
                </span>
              )}
            </div>

            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-main, #0f172a)',
                margin: '8px 0 4px',
                lineHeight: 1.3,
              }}
            >
              {subject.subjectName}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <span>Mã môn: <strong>{subject.subjectCode || '—'}</strong></span>
              <span>GV: <strong>{lecturer.fullName || 'Chưa phân công'}</strong></span>
              {semester.semesterName && <span>Học kỳ: <strong>{semester.semesterName}</strong></span>}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng popup"
            className="btn btn-outline"
            style={{
              padding: '6px',
              borderRadius: '8px',
              border: 'none',
              color: 'var(--text-muted, #64748b)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            flex: 1,
          }}
        >
          {/* Cảnh báo trùng lịch nếu có */}
          {conflictInfo && (
            <div
              style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#9f1239',
                padding: '12px 16px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <AlertTriangle size={22} style={{ color: '#e11d48', flexShrink: 0 }} />
              <div style={{ fontSize: '0.88rem', lineHeight: 1.4 }}>
                <strong>Cảnh báo trùng lịch học!</strong> Lớp học này bị trùng giờ vào{' '}
                <strong>{conflictInfo.dayName} ({conflictInfo.timeString})</strong> với môn đã chọn:{' '}
                <strong>{conflictInfo.conflictingSubject}</strong> ({conflictInfo.conflictingSectionCode}).
              </div>
            </div>
          )}

          {/* Bento Cards Tóm tắt */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Box 1: Khung giờ & Thứ */}
            <div
              style={{
                background: 'var(--bg-subtle, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '10px',
                padding: '12px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary, #2563eb)', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                <Clock size={16} />
                <span>Giờ học & Lịch tuần</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main, #0f172a)' }}>
                {section.schedule || 'Chưa cập nhật'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                Lặp hàng tuần ({sessions.length} buổi)
              </div>
            </div>

            {/* Box 2: Phòng học & Cơ sở */}
            <div
              style={{
                background: 'var(--bg-subtle, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '10px',
                padding: '12px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary, #2563eb)', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                <MapPin size={16} />
                <span>Địa điểm phòng học</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main, #0f172a)' }}>
                Phòng {section.room || 'Chưa xếp'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                Khu giảng đường chính
              </div>
            </div>

            {/* Box 3: Thời gian học kỳ */}
            <div
              style={{
                background: 'var(--bg-subtle, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '10px',
                padding: '12px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary, #2563eb)', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                <CalendarDays size={16} />
                <span>Thời gian học kỳ</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main, #0f172a)' }}>
                {semester.startDate && semester.endDate
                  ? `${formatViDate(new Date(semester.startDate))} - ${formatViDate(new Date(semester.endDate))}`
                  : 'Học kỳ chính'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                Sĩ số: <strong>{section.currentStudents || 0} / {section.maxStudents || 40}</strong> SV
              </div>
            </div>
          </div>

          {/* Danh sách chi tiết các buổi học trong kỳ */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} style={{ color: 'var(--primary, #2563eb)' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                  Danh Sách Các Ngày Học Của Lớp {section.sectionCode}
                </h3>
              </div>
              <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                Tổng số: {sessions.length} buổi học
              </span>
            </div>

            {sessions.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '30px 20px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  borderRadius: '10px',
                  color: 'var(--text-muted, #64748b)',
                  fontSize: '0.9rem',
                }}
              >
                Chưa có thông tin thời gian cụ thể cho lớp học phần này.
              </div>
            ) : (
              <div
                style={{
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  maxHeight: '320px',
                  overflowY: 'auto',
                }}
              >
                <table className="table" style={{ margin: 0, width: '100%', fontSize: '0.875rem' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--bg-subtle, #f8fafc)' }}>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Buổi</th>
                      <th>Thứ & Ngày học</th>
                      <th>Khung giờ & Tiết</th>
                      <th>Phòng học</th>
                      <th style={{ textAlign: 'center', width: '110px' }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((item) => (
                      <tr
                        key={item.sessionNumber}
                        style={{
                          backgroundColor: item.isToday
                            ? 'rgba(37, 99, 235, 0.08)'
                            : item.isNext
                            ? 'rgba(16, 185, 129, 0.06)'
                            : item.isPast
                            ? 'rgba(0, 0, 0, 0.02)'
                            : 'transparent',
                        }}
                      >
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)' }}>
                          #{item.sessionNumber}
                        </td>
                        <td style={{ fontWeight: item.isToday || item.isNext ? 700 : 500 }}>
                          <span style={{ color: 'var(--primary, #2563eb)', marginRight: '6px' }}>
                            {item.dayName}
                          </span>
                          <span style={{ color: item.isPast ? 'var(--text-muted)' : 'var(--text-main)' }}>
                            {item.formattedDate}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary, #475569)', fontVariantNumeric: 'tabular-nums' }}>
                          {item.timeStr}
                        </td>
                        <td>
                          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                            {item.room}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {item.isToday ? (
                            <span className="badge badge-primary" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                              Hôm nay
                            </span>
                          ) : item.isNext ? (
                            <span className="badge badge-success" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                              Kế tiếp
                            </span>
                          ) : item.isPast ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Đã học
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                              Sắp tới
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle, #f8fafc)',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {isEnrolled ? (
              <span style={{ color: 'var(--success, #16a34a)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <CheckCircle2 size={16} /> Bạn đã đăng ký môn học này
              </span>
            ) : isFull ? (
              <span style={{ color: 'var(--danger, #dc2626)', fontWeight: 600 }}>
                Lớp học phần đã hết chỗ ({section.currentStudents}/{section.maxStudents})
              </span>
            ) : conflictInfo ? (
              <span style={{ color: 'var(--warning, #d97706)', fontWeight: 600 }}>
                Trùng giờ với môn đã chọn trước
              </span>
            ) : (
              <span>Còn <strong>{(section.maxStudents || 40) - (section.currentStudents || 0)}</strong> chỗ trống</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              style={{ minWidth: '80px' }}
            >
              Đóng
            </button>

            {isEnrolled && onCancel ? (
              <button
                type="button"
                className="btn btn-outline"
                style={{ color: 'var(--danger, #dc2626)', borderColor: 'var(--danger, #dc2626)' }}
                disabled={isEnrolling}
                onClick={async () => {
                  await onCancel(enrollmentId, subject.subjectName);
                  onClose();
                }}
              >
                <Trash2 size={15} style={{ marginRight: '6px' }} />
                <span>{isEnrolling ? 'Đang hủy...' : 'Hủy đăng ký môn'}</span>
              </button>
            ) : onEnroll ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={isEnrolling || isFull || !canRegister}
                onClick={async () => {
                  await onEnroll(section.id);
                  onClose();
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={16} />
                <span>{isEnrolling ? 'Đang đăng ký...' : 'Đăng ký học phần này'}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
