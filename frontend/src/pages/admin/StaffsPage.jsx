import { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, CheckCircle, XCircle, X, RotateCcw,
  KeyRound, ShieldCheck, Calendar, UserCheck
} from 'lucide-react';
import { toast } from 'react-toastify';
import { staffService } from '../../services/dataService';
import TableRowSkeleton from '../../components/common/TableRowSkeleton';

export default function StaffsPage() {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    dateOfBirth: '',
    roleName: 'ACADEMIC_AFFAIRS',
    isActive: true,
  });

  const loadStaffs = async () => {
    try {
      setLoading(true);
      const res = await staffService.getAll();
      setStaffs(res.data.data || []);
    } catch {
      toast.error('Lỗi khi tải danh sách cán bộ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffs();
  }, []);

  const handleOpenModal = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        username: staff.username || '',
        fullName: staff.fullName || '',
        email: staff.email || '',
        dateOfBirth: staff.dateOfBirth ? staff.dateOfBirth.substring(0, 10) : '',
        roleName: staff.role || 'ACADEMIC_AFFAIRS',
        isActive: staff.isActive !== false,
      });
    } else {
      setEditingStaff(null);
      setFormData({
        username: '',
        fullName: '',
        email: '',
        dateOfBirth: '',
        roleName: 'ACADEMIC_AFFAIRS',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.warning('Vui lòng nhập họ và tên');
      return;
    }
    if (!formData.email.trim()) {
      toast.warning('Vui lòng nhập email');
      return;
    }
    if (!formData.dateOfBirth) {
      toast.warning('Vui lòng chọn ngày tháng năm sinh');
      return;
    }

    try {
      setSubmitting(true);
      if (editingStaff) {
        await staffService.update(editingStaff.id, {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          dateOfBirth: formData.dateOfBirth,
          roleName: formData.roleName,
          isActive: formData.isActive,
        });
        toast.success('Cập nhật thông tin cán bộ thành công');
      } else {
        if (!formData.username.trim()) {
          toast.warning('Vui lòng nhập tên đăng nhập');
          setSubmitting(false);
          return;
        }
        const res = await staffService.create({
          username: formData.username.trim(),
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          dateOfBirth: formData.dateOfBirth,
          roleName: formData.roleName,
        });
        toast.success(res.data.message || 'Tạo cán bộ thành công!', { autoClose: 7000 });
      }
      handleCloseModal();
      loadStaffs();
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin cán bộ';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (staff) => {
    if (!staff.dateOfBirth) {
      toast.error(`Cán bộ ${staff.fullName || staff.username} chưa có ngày sinh. Vui lòng cập nhật ngày sinh trước!`);
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn cấp lại mật khẩu cho cán bộ "${staff.fullName || staff.username}" theo ngày sinh?`)) {
      return;
    }
    try {
      const res = await staffService.resetPassword(staff.id);
      toast.success(res.data.message || 'Đã cấp lại mật khẩu thành công!', { autoClose: 8000 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cấp lại mật khẩu');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return <span className="text-gray-400 italic">Chưa có</span>;
    const parts = dateStr.substring(0, 10).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const filteredStaffs = staffs.filter((s) => {
    const matchSearch =
      !search.trim() ||
      (s.fullName && s.fullName.toLowerCase().includes(search.toLowerCase())) ||
      (s.username && s.username.toLowerCase().includes(search.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase()));

    const matchRole = !selectedRole || s.role === selectedRole;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Quản trị viên</span>;
      case 'ACADEMIC_AFFAIRS':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Cán bộ Đào tạo</span>;
      case 'EXAMINATION_OFFICER':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">Cán bộ Khảo thí</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{role}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Quản lý Cán bộ & Nhân viên
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Danh sách nhân viên, cán bộ trường với chức danh và ngày tháng năm sinh (tự động cấp mật khẩu <code className="bg-indigo-50 text-indigo-700 px-1 rounded font-mono">ddmmyyyya@</code>)
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm Cán bộ mới
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả chức danh</option>
            <option value="ADMIN">Quản trị viên (Admin)</option>
            <option value="ACADEMIC_AFFAIRS">Cán bộ Đào tạo</option>
            <option value="EXAMINATION_OFFICER">Cán bộ Khảo thí</option>
          </select>

          <button
            onClick={() => { setSearch(''); setSelectedRole(''); loadStaffs(); }}
            title="Làm mới"
            className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-4">Tài khoản</th>
                <th className="py-3 px-4">Chức danh / Vai trò</th>
                <th className="py-3 px-4">Ngày sinh (DOB)</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} cols={8} />
                ))
              ) : filteredStaffs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    Không tìm thấy cán bộ / nhân viên nào
                  </td>
                </tr>
              ) : (
                filteredStaffs.map((staff, idx) => (
                  <tr key={staff.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-500" />
                      {staff.fullName || staff.username}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">{staff.username}</td>
                    <td className="py-3 px-4">{getRoleBadge(staff.role)}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-xs bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        {formatDate(staff.dateOfBirth)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{staff.email}</td>
                    <td className="py-3 px-4 text-center">
                      {staff.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <CheckCircle className="w-4 h-4" /> Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium">
                          <XCircle className="w-4 h-4" /> Bị khóa
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleResetPassword(staff)}
                          title="Cấp lại mật khẩu theo ngày sinh (ddmmyyyya@)"
                          className="px-2.5 py-1 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-700 rounded border border-amber-200 flex items-center gap-1 transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          Cấp lại MK
                        </button>
                        <button
                          onClick={() => handleOpenModal(staff)}
                          title="Chỉnh sửa cán bộ"
                          className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Sửa Cán bộ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-fadeIn">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                {editingStaff ? 'Cập nhật thông tin Cán bộ' : 'Thêm mới Cán bộ & Nhân viên'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editingStaff && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-800 leading-relaxed">
                  💡 <strong>Quy tắc bảo mật:</strong> Mật khẩu khởi tạo sẽ được hệ thống tự động sinh từ ngày sinh: <code className="bg-white px-1 py-0.5 rounded font-mono font-bold text-indigo-900">ddmmyyyya@</code> (Ví dụ: sinh ngày 15/05/1990 ➔ mật khẩu là <code className="font-bold">15051990a@</code>).
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Họ và Tên cán bộ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn Đào"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Tên đăng nhập (Username) {!editingStaff && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  required={!editingStaff}
                  disabled={!!editingStaff}
                  placeholder="Ví dụ: daotao02"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${editingStaff ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Ngày tháng năm sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Chức danh / Vai trò <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.roleName}
                    onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACADEMIC_AFFAIRS">Cán bộ Đào tạo</option>
                    <option value="EXAMINATION_OFFICER">Cán bộ Khảo thí</option>
                    <option value="ADMIN">Quản trị viên (Admin)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email liên hệ <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="cán bộ@sms.edu.vn"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {editingStaff && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveStaff"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActiveStaff" className="text-sm text-gray-700 font-medium">
                    Tài khoản đang hoạt động
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingStaff ? 'Cập nhật' : 'Tạo Cán bộ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
