import { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export const PERIOD_END_TIMES = {
  1: '07:45', 2: '08:40', 3: '09:35',
  4: '10:30', 5: '11:25', 6: '12:20',
  7: '13:45', 8: '14:40', 9: '15:35',
  10: '16:30', 11: '17:25', 12: '18:20',
};

export const getMonday = (inputDate) => {
  const d = new Date(inputDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const formatIsoDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatViDate = (d) => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const getWeekDays = (monday) => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return {
      date: d,
      iso: formatIsoDate(d),
      dayOfWeek: i === 6 ? 8 : i + 2, // 2..8 (Thứ 2..Chủ Nhật)
      shortDate: `${day}/${month}`,
      fullDate: formatViDate(d),
    };
  });
};

export const getCourseEndInfo = (endDateStr, refDate = new Date()) => {
  if (!endDateStr) return null;
  const end = new Date(endDateStr);
  const ref = new Date(refDate);
  end.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);
  const diffDays = Math.round((end - ref) / (1000 * 60 * 60 * 24));
  const formatted = formatViDate(end);

  if (diffDays < 0) {
    return { isCompleted: true, text: `Học xong (${formatted})`, badge: 'Đã hoàn thành', weeksLeft: 0 };
  }
  const weeksLeft = Math.ceil(diffDays / 7);
  return {
    isCompleted: false,
    text: `Học xong: ${formatted}`,
    badge: weeksLeft <= 1 ? 'Tuần cuối' : `Còn ${weeksLeft} tuần`,
    weeksLeft,
  };
};

export default function WeekCalendarPicker({
  selectedDate,
  onChangeDate,
  semesterStartDate,
  className = '',
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const popoverRef = useRef(null);

  const activeDate = useMemo(() => new Date(selectedDate || new Date()), [selectedDate]);
  const currentMonday = useMemo(() => getMonday(activeDate), [activeDate]);
  const weekDays = useMemo(() => getWeekDays(currentMonday), [currentMonday]);

  // Mini calendar month state (viewing month/year)
  const [viewYear, setViewYear] = useState(() => activeDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => activeDate.getMonth());

  useEffect(() => {
    setViewYear(activeDate.getFullYear());
    setViewMonth(activeDate.getMonth());
  }, [activeDate]);

  // Close calendar popup when clicking outside
  useEffect(() => {
    if (!showCalendar) return;
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  // Semester week calculation
  const weekNumber = useMemo(() => {
    if (!semesterStartDate) return 1;
    const semStart = new Date(semesterStartDate);
    const semMonday = getMonday(semStart);
    const diffDays = Math.round((currentMonday - semMonday) / (1000 * 60 * 60 * 24));
    const no = Math.floor(diffDays / 7) + 1;
    return no > 0 ? no : 1;
  }, [currentMonday, semesterStartDate]);

  const handlePrevWeek = () => {
    const prev = new Date(activeDate);
    prev.setDate(prev.getDate() - 7);
    onChangeDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(activeDate);
    next.setDate(next.getDate() + 7);
    onChangeDate(next);
  };

  const handleToday = () => {
    onChangeDate(new Date());
  };

  // Mini calendar cells calculation
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const jsDay = firstDayOfMonth.getDay(); // 0: Sun, 1: Mon...
    const shift = jsDay === 0 ? 6 : jsDay - 1; // 0..6 days before 1st

    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells = [];
    // Previous month padding
    for (let i = shift - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, daysInPrevMonth - i);
      cells.push({ date: d, dayNum: d.getDate(), isCurrentMonth: false });
    }
    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateObj = new Date(viewYear, viewMonth, d);
      cells.push({ date: dateObj, dayNum: d, isCurrentMonth: true });
    }
    // Next month padding (total cells to multiple of 7, up to 35 or 42)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(viewYear, viewMonth + 1, d);
      cells.push({ date: dateObj, dayNum: d, isCurrentMonth: false });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const todayIso = formatIsoDate(new Date());
  const selectedIso = formatIsoDate(activeDate);

  const prevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        marginBottom: '16px',
        position: 'relative',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Navigation Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handlePrevWeek}
          title="Tuần trước"
          style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <ChevronLeft size={16} /> Tuần trước
        </button>

        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={handleToday}
          title="Về ngày hôm nay"
          style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <RotateCcw size={14} /> Hôm nay
        </button>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleNextWeek}
          title="Tuần sau"
          style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          Tuần sau <ChevronRight size={16} />
        </button>
      </div>

      {/* Week label & Calendar Popover button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }} ref={popoverRef}>
        <div
          onClick={() => setShowCalendar(!showCalendar)}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-light)',
            border: '1px solid var(--primary-border)',
            color: 'var(--primary)',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
          title="Nhấn để mở lịch chọn ngày"
        >
          <CalendarIcon size={16} />
          <span>Tuần {weekNumber}</span>
          <span style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            ({weekDays[0].shortDate} - {weekDays[6].shortDate}/{weekDays[6].date.getFullYear()})
          </span>
        </div>

        {/* Mini Calendar Popup */}
        {showCalendar && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              zIndex: 999,
              width: '280px',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            {/* Header matches user's uploaded image: blue header with Tháng MM-YYYY and < > */}
            <div
              style={{
                background: '#2563eb',
                color: '#ffffff',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: '0.95rem',
              }}
            >
              <span>
                Tháng {viewMonth + 1}-{viewYear}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={prevMonth}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Tháng trước"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Tháng sau"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Days header: T2 T3 T4 T5 T6 T7 Cn */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                textAlign: 'center',
                padding: '10px 10px 6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#64748b',
              }}
            >
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'Cn'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                padding: '0 10px 12px',
                gap: '2px',
              }}
            >
              {calendarCells.map((cell, idx) => {
                const cellIso = formatIsoDate(cell.date);
                const isSelected = cellIso === selectedIso;
                const isToday = cellIso === todayIso;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onChangeDate(cell.date);
                      setShowCalendar(false);
                    }}
                    style={{
                      background: isSelected || isToday ? '#c2410c' : 'transparent',
                      color:
                        isSelected || isToday
                          ? '#ffffff'
                          : cell.isCurrentMonth
                          ? '#1e293b'
                          : '#cbd5e1',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      margin: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.825rem',
                      fontWeight: isSelected || isToday ? 700 : cell.isCurrentMonth ? 500 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cell.dayNum}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
