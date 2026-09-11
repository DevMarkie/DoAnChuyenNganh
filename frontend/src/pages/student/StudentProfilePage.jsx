import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, School, KeyRound, ShieldCheck, GraduationCap } from 'lucide-react';
import { toast } from 'react-toastify';
import { studentService, authService } from '../../services/dataService';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passData, setPassData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await studentService.getMe();
      setProfile(res.data.data);
    } catch {
      toast.error('Lỗi khi tải thông tin sinh viên');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      toast.warning('Mật khẩu mới không trùng khớp!');
      return;
    }
    try {
      await authService.changePassword({
        oldPassword: passData.oldPassword,
        newPassword: passData.newPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Đang tải thông tin hồ sơ sinh viên...
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'SV';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hồ Sơ Sinh Viên & Bảo Mật</h1>
          <p>
            Thông tin lý lịch sinh viên chính quy, lớp sinh hoạt và thiết lập an toàn tài khoản
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Information */}
        <div className="card">
          <div className="card-header">
            <h3>Thông tin lý lịch học viên</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {getInitials(profile?.fullName)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {profile?.fullName}
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: 'var(--primary)',
                      backgroundColor: 'var(--primary-light)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--primary-border)'
                    }}
                  >
                    {profile?.studentCode}
                  </span>
                  <span className="badge badge-success">
                    {profile?.status === 'STUDYING' || profile?.status === 'ACTIVE' ? 'Đang học' : profile?.status}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="form-label">Lớp sinh hoạt</label>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {profile?.classEntity?.name || profile?.classEntity?.code || '—'}
                </div>
              </div>
              <div>
                <label className="form-label">Khoa đào tạo</label>
                <div style={{ color: 'var(--text-main)' }}>{profile?.classEntity?.department?.name || '—'}</div>
              </div>
              <div>
                <label className="form-label">Khóa tuyển sinh</label>
                <div style={{ color: 'var(--text-main)' }}>{profile?.classEntity?.academicYear || 'K18'}</div>
              </div>
              <div>
                <label className="form-label">Ngày sinh</label>
                <div style={{ color: 'var(--text-main)' }}>
                  {profile?.dateOfBirth ? profile.dateOfBirth.substring(0, 10) : '—'}
                </div>
              </div>
              <div>
                <label className="form-label">Giới tính</label>
                <div>
                  <span className="badge badge-neutral">{profile?.gender || 'Nam'}</span>
                </div>
              </div>
              <div>
                <label className="form-label">Số điện thoại</label>
                <div style={{ color: 'var(--text-main)' }}>{profile?.phone || 'Chưa cập nhật'}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Email học viện</label>
                <div style={{ color: 'var(--text-main)' }}>{profile?.email}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Địa chỉ liên hệ</label>
                <div style={{ color: 'var(--text-secondary)' }}>{profile?.address || 'Chưa cập nhật địa chỉ cư trú'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="card">
          <div className="card-header">
            <h3>Đổi mật khẩu tài khoản</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Mật khẩu hiện tại *</label>
                <input
                  type="password"
                  required
                  value={passData.oldPassword}
                  onChange={(e) => setPassData({ ...passData, oldPassword: e.target.value })}
                  className="form-control"
                  placeholder="Nhập mật khẩu đang sử dụng"
                />
              </div>
              <div>
                <label className="form-label">Mật khẩu mới *</label>
                <input
                  type="password"
                  required
                  value={passData.newPassword}
                  onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                  className="form-control"
                  placeholder="Mật khẩu ít nhất 6 ký tự"
                />
              </div>
              <div>
                <label className="form-label">Xác nhận mật khẩu mới *</label>
                <input
                  type="password"
                  required
                  value={passData.confirmPassword}
                  onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                  className="form-control"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
                <KeyRound size={16} />
                <span>Cập nhật mật khẩu</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
