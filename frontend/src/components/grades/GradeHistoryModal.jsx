import { useState, useEffect } from 'react';
import { X, History, ShieldAlert, User, Clock, ArrowRight, Laptop } from 'lucide-react';
import { gradeService } from '../../services/dataService';

export default function GradeHistoryModal({ grade, student, section, isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !grade?.id) return;
    let isMounted = true;
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await gradeService.getGradeAuditLogs(grade.id);
        if (isMounted) {
          setLogs(res.data?.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Không thể tải nhật ký sửa điểm');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLogs();
    return () => { isMounted = false; };
  }, [isOpen, grade?.id]);

  if (!isOpen) return null;

  const formatDateTime = (dt) => {
    if (!dt) return '—';
    try {
      const d = new Date(dt);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return dt;
    }
  };

  const getComponentBadge = (comp) => {
    switch (comp) {
      case 'CC1':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Chuyên cần</span>;
      case 'CC2':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">Bài tập/Thảo luận</span>;
      case 'MIDTERM':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Giữa kỳ</span>;
      case 'FINAL':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Cuối kỳ (Khảo thí)</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">{comp}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                Nhật ký Kiểm toán Sửa điểm (BR-Grade09)
              </h3>
              <p className="text-xs text-gray-500">
                Sinh viên: <span className="font-semibold text-gray-700">{student?.fullName || grade?.enrollment?.student?.fullName || '—'}</span> ({student?.studentCode || grade?.enrollment?.student?.studentCode || '—'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Đang tải lịch sử kiểm toán...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2 text-sm">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <History className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="font-medium text-gray-700">Chưa có lịch sử sửa điểm</p>
              <p className="text-xs text-gray-400 mt-1">Điểm số hiện tại là điểm nhập gốc lần đầu hoặc chưa từng bị điều chỉnh.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div
                  key={log.id || index}
                  className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:border-indigo-200 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getComponentBadge(log.component)}
                      <div className="flex items-center gap-1.5 font-bold text-sm">
                        <span className="text-gray-500 line-through">
                          {log.oldScore != null ? Number(log.oldScore).toFixed(1) : (log.oldSpecialGrade || '—')}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className={`font-semibold ${Number(log.newScore) >= Number(log.oldScore) ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {log.newScore != null ? Number(log.newScore).toFixed(1) : (log.newSpecialGrade || '—')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDateTime(log.createdAt)}</span>
                    </div>
                  </div>

                  {/* Lý do */}
                  <div className="text-sm text-gray-700 bg-slate-50 p-2.5 rounded border border-gray-100 mb-2">
                    <span className="font-semibold text-gray-600 text-xs uppercase tracking-wider block mb-0.5">Lý do điều chỉnh:</span>
                    <span>{log.reason || 'Không ghi lý do'}</span>
                  </div>

                  {/* Người sửa & IP */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Người sửa: <strong className="text-gray-700">{log.changedByUsername || 'Hệ thống'}</strong> {log.changedByRole && `(${log.changedByRole})`}</span>
                    </div>
                    {log.ipAddress && (
                      <div className="flex items-center gap-1 text-gray-400">
                        <Laptop className="w-3.5 h-3.5" />
                        <span>IP: {log.ipAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
