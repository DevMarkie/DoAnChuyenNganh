import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Search, Filter, RotateCcw, ChevronLeft, ChevronRight,
  ArrowRight, Clock, User, Laptop, Calendar, CheckCircle2, AlertCircle
} from 'lucide-react';
import { gradeService } from '../../services/dataService';

export default function GradeAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentCode, setStudentCode] = useState('');
  const [component, setComponent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 15;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: pageSize,
      };
      if (studentCode.trim()) params.studentCode = studentCode.trim();
      if (component) params.component = component;
      if (startDate) params.startDate = `${startDate}T00:00:00`;
      if (endDate) params.endDate = `${endDate}T23:59:59`;

      const res = await gradeService.searchAdminAuditLogs(params);
      const data = res.data?.data;
      if (data) {
        setLogs(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      console.error('Failed to fetch grade audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, studentCode, component, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchLogs();
  };

  const handleReset = () => {
    setStudentCode('');
    setComponent('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

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
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">CC1 (Chuyên cần)</span>;
      case 'CC2':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">CC2 (Bài tập)</span>;
      case 'MIDTERM':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Giữa kỳ</span>;
      case 'FINAL':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Cuối kỳ (Khảo thí)</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">{comp}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Nhật ký Kiểm toán Sửa điểm (Grade Audit Trail)
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Quy chuẩn kiểm toán BR-Grade09: Giám sát toàn vẹn mọi lịch sử sửa đổi điểm số của sinh viên
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium text-slate-700">
            Tổng số bản ghi kiểm toán: <strong className="text-indigo-600">{totalElements}</strong>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearch} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* MSSV */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Mã sinh viên (MSSV)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Nhập MSSV..."
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Thành phần điểm */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Đầu điểm
            </label>
            <select
              value={component}
              onChange={(e) => setComponent(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition"
            >
              <option value="">Tất cả đầu điểm</option>
              <option value="CC1">CC1 (Chuyên cần)</option>
              <option value="CC2">CC2 (Bài tập/Phát biểu)</option>
              <option value="MIDTERM">Giữa kỳ</option>
              <option value="FINAL">Cuối kỳ (Khảo thí)</option>
            </select>
          </div>

          {/* Từ ngày */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Từ ngày
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition"
            />
          </div>

          {/* Đến ngày */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Đặt lại</span>
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
          >
            <Filter className="w-4 h-4" />
            <span>Lọc kiểm toán</span>
          </button>
        </div>
      </form>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Thời điểm</th>
                <th className="px-5 py-3.5">Sinh viên</th>
                <th className="px-5 py-3.5">Học phần</th>
                <th className="px-5 py-3.5">Đầu điểm</th>
                <th className="px-5 py-3.5">Biến động điểm</th>
                <th className="px-5 py-3.5">Lý do sửa</th>
                <th className="px-5 py-3.5">Người thực hiện</th>
                <th className="px-5 py-3.5">Địa chỉ IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải nhật ký kiểm toán...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-16 text-center text-gray-500">
                    <AlertCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-medium text-gray-700">Không tìm thấy bản ghi kiểm toán nào</p>
                    <p className="text-xs text-gray-400 mt-1">Hãy thử thay đổi điều kiện lọc tìm kiếm.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isIncrease = Number(log.newScore) >= Number(log.oldScore);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      {/* Thời điểm */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-500 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatDateTime(log.createdAt)}</span>
                        </div>
                      </td>

                      {/* Sinh viên */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-gray-900">{log.studentName || '—'}</div>
                        <div className="text-xs text-indigo-600 font-mono">{log.studentCode || '—'}</div>
                      </td>

                      {/* Học phần */}
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-800">{log.subjectName || log.sectionCode || '—'}</div>
                        <div className="text-xs text-gray-400">{log.sectionCode}</div>
                      </td>

                      {/* Đầu điểm */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {getComponentBadge(log.component)}
                      </td>

                      {/* Biến động điểm */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200">
                          <span className="font-mono text-gray-400 line-through text-xs">
                            {log.oldScore != null ? Number(log.oldScore).toFixed(1) : (log.oldSpecialGrade || '—')}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                          <span className={`font-mono font-bold text-sm ${isIncrease ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {log.newScore != null ? Number(log.newScore).toFixed(1) : (log.newSpecialGrade || '—')}
                          </span>
                        </div>
                      </td>

                      {/* Lý do */}
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="text-xs text-gray-700 truncate hover:whitespace-normal transition-all" title={log.reason}>
                          {log.reason || '—'}
                        </p>
                      </td>

                      {/* Người thực hiện */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-semibold">{log.changedByUsername || 'Hệ thống'}</span>
                        </div>
                        {log.changedByRole && (
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                            {log.changedByRole}
                          </span>
                        )}
                      </td>

                      {/* IP */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-400 font-mono">
                        <div className="flex items-center gap-1">
                          <Laptop className="w-3.5 h-3.5" />
                          <span>{log.ipAddress || '—'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 bg-slate-50 flex items-center justify-between text-xs text-gray-500">
            <div>
              Hiển thị trang <strong>{page + 1}</strong> / <strong>{totalPages}</strong> (Tổng {totalElements} bản ghi)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
