import { useState, useEffect } from 'react';
import { Award, AlertTriangle, User, ShieldAlert, Phone, Edit3, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { studentService, studentConductService } from '../../services/dataService';
import {
  genderLabel,
  studentStatusLabel,
  studentStatusBadgeClass,
  conductTypeLabel,
  conductTypeBadgeClass,
  trainingRankLabel,
  trainingRankBadgeClass,
} from '../../utils/labels';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [trainingPoints, setTrainingPoints] = useState([]);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'achievements' | 'training'
  const [loading, setLoading] = useState(true);
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ phone: '', address: '' });
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    if (profile) {
      setContactForm({
        phone: profile.phone || '',
        address: profile.address || '',
      });
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

  useEffect(() => {
    let ignore = false;
    Promise.all([
      studentService.getMe(),
      studentConductService.getMyAchievements(),
      studentConductService.getMyTrainingPoints(),
    ])
      .then(([resProfile, resAch, resTrn]) => {
        if (!ignore) {
          setProfile(resProfile.data?.data || null);
          setAchievements(resAch.data?.data || []);
          setTrainingPoints(resTrn.data?.data || []);
        }
      })
      .catch(() => {
        toast.error('Lỗi khi tải thông tin sinh viên');
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
          <h1>Hồ Sơ Sinh Viên</h1>
          <p>
            Lý lịch sinh viên chính quy, thông tin liên lạc khẩn cấp, khen thưởng, kỷ luật và kết quả rèn luyện
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <button
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('profile')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <User size={16} />
          <span>Lý Lịch Cá Nhân</span>
        </button>
        <button
          className={`btn ${activeTab === 'achievements' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('achievements')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Award size={16} />
          <span>Khen Thưởng & Kỷ Luật ({achievements.length})</span>
        </button>
        <button
          className={`btn ${activeTab === 'training' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('training')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <AlertTriangle size={16} />
          <span>Điểm Rèn Luyện ({trainingPoints.length})</span>
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div style={{ maxWidth: '850px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                  <label className="form-label">Số CCCD / CMND</label>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                    {profile?.citizenId || 'Chưa cập nhật'}
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
                  <label className="form-label">Số điện thoại</label>
                  {!editingContact ? (
                    <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>{profile?.phone || 'Chưa cập nhật'}</div>
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
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} style={{ color: 'var(--warning)' }} />
              <h3>Thông tin liên lạc khẩn cấp (Phụ huynh / Người thân)</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label className="form-label">Họ tên người liên hệ</label>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {profile?.emergencyContactName || 'Chưa đăng ký'}
                  </div>
                </div>
                <div>
                  <label className="form-label">Mối quan hệ</label>
                  <div style={{ color: 'var(--text-main)' }}>
                    {profile?.emergencyContactRelationship || 'Bố/Mẹ'}
                  </div>
                </div>
                <div>
                  <label className="form-label">Số điện thoại khẩn cấp</label>
                  <div style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} />
                    <span>{profile?.emergencyContactPhone || 'Chưa đăng ký'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Achievements & Disciplines */}
      {activeTab === 'achievements' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <h3>Hồ sơ Khen thưởng & Quyết định Kỷ luật</h3>
          </div>
          <div className="table-container">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Phân loại</th>
                  <th>Số quyết định</th>
                  <th>Ngày ban hành</th>
                  <th>Tiêu đề & Nội dung</th>
                  <th>Cấp quyết định</th>
                  <th>Học kỳ</th>
                </tr>
              </thead>
              <tbody>
                {achievements.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      Bạn chưa có ghi nhận khen thưởng hoặc kỷ luật nào.
                    </td>
                  </tr>
                ) : (
                  achievements.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className={`badge ${conductTypeBadgeClass(item.type)}`}>
                          {conductTypeLabel(item.type)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.decisionNumber}</span>
                      </td>
                      <td>{item.issueDate}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.title}</div>
                        {item.description && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-neutral">{item.level || 'TRUONG'}</span>
                      </td>
                      <td>{item.semester?.semesterName || 'Toàn khóa'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Training Points */}
      {activeTab === 'training' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <h3>Bảng Điểm Rèn Luyện Theo Từng Học Kỳ</h3>
          </div>
          <div className="table-container">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Học kỳ</th>
                  <th>Năm học</th>
                  <th>Điểm rèn luyện</th>
                  <th>Xếp loại rèn luyện</th>
                  <th>Nhận xét / Hoạt động</th>
                </tr>
              </thead>
              <tbody>
                {trainingPoints.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      Chưa có dữ liệu điểm rèn luyện học kỳ.
                    </td>
                  </tr>
                ) : (
                  trainingPoints.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {item.semester?.semesterName}
                      </td>
                      <td>{item.semester?.academicYear}</td>
                      <td>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                          {item.score}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> / 100</span>
                      </td>
                      <td>
                        <span className={`badge ${trainingRankBadgeClass(item.evaluationGrade)}`}>
                          {trainingRankLabel(item.evaluationGrade)}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {item.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
