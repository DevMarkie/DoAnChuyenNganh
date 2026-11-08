import { useState, useEffect } from 'react';
import { ShieldAlert, Phone, Edit3, Check, KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { studentService, authService } from '../../services/dataService';
import {
  genderLabel,
  studentStatusLabel,
  studentStatusBadgeClass,
} from '../../utils/labels';
import { maskCitizenId, maskPhone } from '../../utils/security';

function getPasswordStrength(pwd) {
  if (!pwd) return { level: 0, label: '', color: 'transparent', percent: '0%' };
  if (pwd.length < 6) return { level: 1, label: 'Yếu (Tối thiểu 6 ký tự)', color: '#ef4444', percent: '25%' };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score >= 3) return { level: 3, label: 'Mạnh', color: '#10b981', percent: '100%' };
  if (score >= 1) return { level: 2, label: 'Trung bình', color: '#f59e0b', percent: '65%' };
  return { level: 1, label: 'Yếu', color: '#ef4444', percent: '35%' };
}

const STANDARD_RELATIONSHIPS = ['Bố', 'Mẹ', 'Anh/Chị/Em', 'Ông/Bà', 'Người giám hộ'];

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ phone: '', address: '' });
  const [savingContact, setSavingContact] = useState(false);
  const [showCccd, setShowCccd] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  // Trạng thái liên hệ khẩn cấp
  const [editingEmergency, setEditingEmergency] = useState(false);
  const [savingEmergency, setSavingEmergency] = useState(false);
  const [showEmergencyPhone, setShowEmergencyPhone] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    name: '',
    relationship: 'Bố',
    customRelationship: '',
    phone: '',
  });

  // Trạng thái đổi mật khẩu
  const [passData, setPassData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const strength = getPasswordStrength(passData.newPassword);
  const isDuplicatePass = Boolean(passData.newPassword && passData.oldPassword && passData.newPassword === passData.oldPassword);
  const isMatchedPass = Boolean(passData.confirmPassword && passData.newPassword === passData.confirmPassword);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passData.oldPassword || !passData.newPassword || !passData.confirmPassword) {
      toast.warning('Vui lòng nhập đầy đủ các trường mật khẩu!');
      return;
    }
    if (passData.newPassword.length < 6) {
      toast.warning('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    if (passData.newPassword !== passData.confirmPassword) {
      toast.warning('Mật khẩu mới và xác nhận không khớp!');
      return;
    }
    if (passData.newPassword === passData.oldPassword) {
      toast.warning('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
      return;
    }
    try {
      setChangingPass(true);
      await authService.changePassword({
        oldPassword: passData.oldPassword,
        newPassword: passData.newPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowOld(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setChangingPass(false);
    }
  };

  const initEmergencyForm = (currProfile = profile) => {
    if (!currProfile) return;
    const rel = currProfile.emergencyContactRelationship || '';
    const isStandard = STANDARD_RELATIONSHIPS.includes(rel);
    setEmergencyForm({
      name: currProfile.emergencyContactName || '',
      relationship: isStandard ? rel : (rel ? 'Khác' : 'Bố'),
      customRelationship: isStandard ? '' : rel,
      phone: currProfile.emergencyContactPhone || '',
    });
  };

  useEffect(() => {
    if (profile) {
      setContactForm({
        phone: profile.phone || '',
        address: profile.address || '',
      });
      initEmergencyForm(profile);
    }
  }, [profile]);

  const handleSaveContact = async (e) => {
    e?.preventDefault();
    try {
      setSavingContact(true);
      const res = await studentService.updateMyContact(contactForm);
      toast.success('Cập nhật thông tin liên lạc thành công!');
      setProfile((prev) => ({ ...prev, ...res.data?.data, phone: contactForm.phone, address: contactForm.address }));
      setEditingContact(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật thông tin liên lạc');
    } finally {
      setSavingContact(false);
    }
  };

  const handleSaveEmergency = async (e) => {
    e?.preventDefault();
    const name = (emergencyForm.name || '').trim();
    const rel = emergencyForm.relationship === 'Khác'
      ? (emergencyForm.customRelationship || '').trim()
      : (emergencyForm.relationship || '').trim();
    const phone = (emergencyForm.phone || '').trim();

    if (!name) {
      toast.warning('Vui lòng nhập họ tên người liên hệ khẩn cấp');
      return;
    }
    if (!rel) {
      toast.warning('Vui lòng chọn hoặc nhập mối quan hệ');
      return;
    }
    if (!phone) {
      toast.warning('Vui lòng nhập số điện thoại khẩn cấp');
      return;
    }
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone)) {
      toast.warning('Số điện thoại khẩn cấp không đúng định dạng Việt Nam (10 chữ số, bắt đầu bằng số 0)');
      return;
    }

    try {
      setSavingEmergency(true);
      const res = await studentService.updateMyContact({
        emergencyContactName: name,
        emergencyContactRelationship: rel,
        emergencyContactPhone: phone,
      });
      toast.success('Cập nhật thông tin liên lạc khẩn cấp thành công!');
      setProfile((prev) => ({
        ...prev,
        ...res.data?.data,
        emergencyContactName: name,
        emergencyContactRelationship: rel,
        emergencyContactPhone: phone,
      }));
      setEditingEmergency(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật thông tin liên lạc khẩn cấp');
    } finally {
      setSavingEmergency(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    studentService.getMe()
      .then((resProfile) => {
        if (!ignore) {
          setProfile(resProfile.data?.data || null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          toast.error(err.response?.data?.message || 'Lỗi khi tải thông tin sinh viên');
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

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
          <h1>Hồ Sơ Sinh Viên & Tài Khoản</h1>
          <p>
            Lý lịch sinh viên chính quy, thông tin liên lạc khẩn cấp và thiết lập an toàn thông tin
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Cột trái: Thông tin học viên & Liên hệ khẩn cấp */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Thông tin lý lịch học viên</h3>
              {!editingContact ? (
                <button
                  type="button"
                  onClick={() => setEditingContact(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent', cursor: 'pointer', fontWeight: '600' }}
                >
                  <Edit3 size={14} />
                  <span>Cập nhật liên lạc</span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setEditingContact(false)}
                    style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveContact}
                    disabled={savingContact}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: '600' }}
                  >
                    <Check size={14} />
                    <span>{savingContact ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </button>
                </div>
              )}
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
                    boxShadow: 'var(--shadow-sm)',
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
                        border: '1px solid var(--primary-border)',
                      }}
                    >
                      {profile?.studentCode}
                    </span>
                    <span className={`badge ${studentStatusBadgeClass(profile?.status)}`}>
                      {studentStatusLabel(profile?.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label className="form-label">Số CCCD / CMND (Bảo mật PII)</label>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{showCccd ? profile?.citizenId : maskCitizenId(profile?.citizenId)}</span>
                    {profile?.citizenId && (
                      <button
                        type="button"
                        onClick={() => setShowCccd(!showCccd)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-secondary)' }}
                        title={showCccd ? 'Ẩn bớt số CCCD' : 'Xem đầy đủ số CCCD'}
                        aria-label={showCccd ? 'Ẩn bớt số CCCD' : 'Xem đầy đủ số CCCD'}
                      >
                        {showCccd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                </div>
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
                    <span className="badge badge-neutral">{genderLabel(profile?.gender)}</span>
                  </div>
                </div>
                <div>
                  <label className="form-label">Số điện thoại (Bảo mật PII)</label>
                  {!editingContact ? (
                    <div style={{ color: 'var(--text-main)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{showPhone ? profile?.phone : maskPhone(profile?.phone)}</span>
                      {profile?.phone && (
                        <button
                          type="button"
                          onClick={() => setShowPhone(!showPhone)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-secondary)' }}
                          title={showPhone ? 'Ẩn bớt số điện thoại' : 'Xem đầy đủ số điện thoại'}
                          aria-label={showPhone ? 'Ẩn bớt số điện thoại' : 'Xem đầy đủ số điện thoại'}
                        >
                          {showPhone ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="Nhập số điện thoại..."
                      style={{ width: '100%', padding: '6px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  )}
                </div>
                <div>
                  <label className="form-label">Quê quán</label>
                  <div style={{ color: 'var(--text-main)' }}>{profile?.hometown || 'Chưa cập nhật'}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Email học viện</label>
                  <div style={{ color: 'var(--text-main)' }}>{profile?.email}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Địa chỉ liên hệ</label>
                  {!editingContact ? (
                    <div style={{ color: 'var(--text-secondary)' }}>{profile?.address || 'Chưa cập nhật địa chỉ cư trú'}</div>
                  ) : (
                    <input
                      type="text"
                      value={contactForm.address}
                      onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                      placeholder="Nhập địa chỉ cư trú..."
                      style={{ width: '100%', padding: '6px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Khối liên hệ khẩn cấp */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} style={{ color: 'var(--warning)' }} />
                <h3 style={{ margin: 0 }}>Thông tin liên lạc khẩn cấp (Phụ huynh / Người thân)</h3>
              </div>
              {!editingEmergency ? (
                <button
                  type="button"
                  onClick={() => {
                    initEmergencyForm();
                    setEditingEmergency(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--primary)',
                    color: 'var(--primary)',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  <Edit3 size={14} />
                  <span>Cập nhật</span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEmergency(false);
                      initEmergencyForm();
                    }}
                    style={{
                      fontSize: '12px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEmergency}
                    disabled={savingEmergency}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'var(--primary)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                  >
                    <Check size={14} />
                    <span>{savingEmergency ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </button>
                </div>
              )}
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label className="form-label">
                    Họ tên người liên hệ {editingEmergency && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  {!editingEmergency ? (
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {profile?.emergencyContactName || 'Chưa đăng ký'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={emergencyForm.name}
                      onChange={(e) => setEmergencyForm({ ...emergencyForm, name: e.target.value })}
                      placeholder="Họ tên phụ huynh / người thân..."
                      style={{ width: '100%', padding: '6px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  )}
                </div>

                <div>
                  <label className="form-label">
                    Mối quan hệ {editingEmergency && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  {!editingEmergency ? (
                    <div style={{ color: 'var(--text-main)' }}>
                      {profile?.emergencyContactRelationship || 'Chưa cập nhật'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <select
                        value={emergencyForm.relationship}
                        onChange={(e) => setEmergencyForm({ ...emergencyForm, relationship: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                      >
                        {STANDARD_RELATIONSHIPS.map((rel) => (
                          <option key={rel} value={rel}>{rel}</option>
                        ))}
                        <option value="Khác">Khác (Tự nhập)</option>
                      </select>
                      {emergencyForm.relationship === 'Khác' && (
                        <input
                          type="text"
                          value={emergencyForm.customRelationship}
                          onChange={(e) => setEmergencyForm({ ...emergencyForm, customRelationship: e.target.value })}
                          placeholder="Nhập mối quan hệ (VD: Chú, Bác, Cậu...)"
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    Số điện thoại khẩn cấp {editingEmergency && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  {!editingEmergency ? (
                    <div style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} />
                        <span>{showEmergencyPhone ? (profile?.emergencyContactPhone || 'Chưa cập nhật') : maskPhone(profile?.emergencyContactPhone)}</span>
                      </div>
                      {profile?.emergencyContactPhone && (
                        <button
                          type="button"
                          onClick={() => setShowEmergencyPhone(!showEmergencyPhone)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-secondary)' }}
                          title={showEmergencyPhone ? 'Ẩn bớt số điện thoại' : 'Xem đầy đủ số điện thoại'}
                          aria-label={showEmergencyPhone ? 'Ẩn bớt số điện thoại' : 'Xem đầy đủ số điện thoại'}
                        >
                          {showEmergencyPhone ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                    </div>
                  ) : (
                    <input
                      type="tel"
                      value={emergencyForm.phone}
                      onChange={(e) => setEmergencyForm({ ...emergencyForm, phone: e.target.value })}
                      placeholder="VD: 0987654321 (10 chữ số)"
                      style={{ width: '100%', padding: '6px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Bảo mật & Đổi mật khẩu */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
            <h3>Bảo mật & Đổi mật khẩu</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Mật khẩu hiện tại */}
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Mật khẩu hiện tại <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input
                    type={showOld ? 'text' : 'password'}
                    required
                    value={passData.oldPassword}
                    onChange={(e) => setPassData({ ...passData, oldPassword: e.target.value })}
                    placeholder="Nhập mật khẩu đang sử dụng"
                    className="form-control"
                    style={{ paddingLeft: '38px', paddingRight: '42px' }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld((v) => !v)}
                    title={showOld ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-label={showOld ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex' }}
                  >
                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Mật khẩu mới <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={passData.newPassword}
                    onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                    placeholder="Tối thiểu 6 ký tự"
                    className="form-control"
                    style={{ paddingLeft: '38px', paddingRight: '42px' }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    title={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex' }}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Thanh đo độ mạnh mật khẩu */}
                {passData.newPassword && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>
                      <span>Độ mạnh: <strong style={{ color: strength.color }}>{strength.label}</strong></span>
                    </div>
                    <div style={{ height: '4px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: strength.percent, height: '100%', backgroundColor: strength.color, transition: 'all 0.3s ease' }} />
                    </div>
                  </div>
                )}

                {/* Cảnh báo trùng mật khẩu cũ */}
                {isDuplicatePass && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.78rem', color: '#ef4444' }}>
                    <AlertTriangle size={14} />
                    <span>Mật khẩu mới không được trùng với mật khẩu hiện tại.</span>
                  </div>
                )}
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Xác nhận mật khẩu mới <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={passData.confirmPassword}
                    onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                    placeholder="Nhập lại mật khẩu mới"
                    className="form-control"
                    style={{ paddingLeft: '38px', paddingRight: '42px' }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    title={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex' }}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {isMatchedPass && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.78rem', color: '#10b981' }}>
                    <CheckCircle2 size={14} />
                    <span>Mật khẩu xác nhận đã trùng khớp.</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={changingPass}
                className="btn btn-primary"
                style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <KeyRound size={16} />
                <span>{changingPass ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
