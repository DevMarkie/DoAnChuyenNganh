import { useState, useEffect } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { gradeAmendmentService } from '../../services/dataService';

const COMPONENT_OPTIONS = [
  { value: 'CC1', label: 'Chuyên cần 1 (5%)', field: 'cc1Score' },
  { value: 'CC2', label: 'Chuyên cần 2 / Bài tập (5%)', field: 'cc2Score' },
  { value: 'MIDTERM', label: 'Điểm Giữa kỳ (30%)', field: 'midtermScore' },
  { value: 'FINAL', label: 'Điểm Cuối kỳ (60%)', field: 'finalScore' },
];

export default function GradeAmendmentModal({
  isOpen,
  onClose,
  section,
  student,
  grades = [],
  onSuccess,
}) {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [componentType, setComponentType] = useState('FINAL');
  const [newScore, setNewScore] = useState('');
  const [reason, setReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Khởi tạo thông tin sinh viên khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (student?.id) {
        setSelectedStudentId(String(student.id));
      } else if (grades.length > 0) {
        const firstStudent = grades[0].enrollment?.student;
        if (firstStudent?.id) setSelectedStudentId(String(firstStudent.id));
      }
      setComponentType('FINAL');
      setNewScore('');
      setReason('');
      setEvidenceUrl('');
      setUploadedFileName('');
    }
  }, [isOpen, student, grades]);

  if (!isOpen) return null;

  // Tìm bản ghi điểm của sinh viên được chọn
  const selectedGradeObj = grades.find((g) => {
    const sId = g.enrollment?.student?.id || g.studentId;
    return String(sId) === String(selectedStudentId);
  });

  const studentInfo = selectedGradeObj?.enrollment?.student || student;

  // Lấy điểm cũ của cột tương ứng
  const selectedCompConfig = COMPONENT_OPTIONS.find((c) => c.value === componentType);
  const oldScore = selectedGradeObj ? selectedGradeObj[selectedCompConfig.field] : null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate kích thước tệp (<= 15MB)
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Kích thước tệp không được vượt quá 15MB');
      return;
    }

    setIsUploading(true);
    try {
      const res = await gradeAmendmentService.uploadEvidence(file);
      const url = res.data?.data?.url || res.data?.url;
      setEvidenceUrl(url);
      setUploadedFileName(file.name);
      toast.success('Tải tệp minh chứng thành công!');
    } catch (err) {
      console.error('Lỗi tải tệp:', err);
      toast.error(err.response?.data?.message || 'Không thể tải tệp lên server');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStudentId) {
      toast.error('Vui lòng chọn sinh viên cần sửa điểm');
      return;
    }
    if (oldScore === null || oldScore === undefined) {
      toast.error('Cột điểm này hiện chưa có điểm ban đầu để điều chỉnh');
      return;
    }
    if (newScore === '' || isNaN(newScore)) {
      toast.error('Vui lòng nhập điểm mới hợp lệ (0 - 10)');
      return;
    }
    const numScore = parseFloat(newScore);
    if (numScore < 0 || numScore > 10) {
      toast.error('Điểm số mới phải nằm trong thang điểm từ 0.0 đến 10.0');
      return;
    }
    if (Number(oldScore) === numScore) {
      toast.error('Điểm mới đề xuất phải khác với điểm hiện tại');
      return;
    }
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do sửa điểm');
      return;
    }
    if (!evidenceUrl.trim()) {
      toast.error('Bắt buộc phải tải lên tệp minh chứng (ảnh bài thi hoặc biên bản)');
      return;
    }

    setIsSubmitting(true);
    try {
      await gradeAmendmentService.create({
        classSectionId: section?.id,
        studentId: Number(selectedStudentId),
        componentType,
        newScore: numScore,
        reason: reason.trim(),
        evidenceUrl: evidenceUrl.trim(),
      });

      toast.success('Tạo đơn sửa điểm thành công! Đơn đã được gửi tới Trưởng bộ môn thẩm định.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi tạo đơn sửa điểm:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo yêu cầu sửa điểm');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f8fafc, #f1f5f9)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
              Yêu Cầu Sửa Điểm Sau Khóa Sổ
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Lớp: <strong>{section?.sectionCode}</strong> — Môn:{' '}
              {section?.subject?.subjectName || section?.subjectName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Sinh viên */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Sinh viên cần sửa điểm <span style={{ color: '#ef4444' }}>*</span>
              </label>
              {student ? (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#1e293b',
                  }}
                >
                  {student.studentCode} — {student.fullName}
                </div>
              ) : (
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px' }}
                  required
                >
                  {grades.map((g) => {
                    const st = g.enrollment?.student;
                    if (!st) return null;
                    return (
                      <option key={st.id} value={st.id}>
                        {st.studentCode} — {st.fullName} ({st.classEntity?.name || 'Lớp SH'})
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Cột điểm */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Cột điểm cần sửa <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={componentType}
                  onChange={(e) => setComponentType(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px' }}
                >
                  {COMPONENT_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* So sánh điểm Cũ -> Mới */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Điểm số điều chỉnh <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Điểm cũ (Read-only) */}
                  <div
                    style={{
                      width: '80px',
                      padding: '10px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontWeight: 700,
                      color: '#64748b',
                      fontSize: '1rem',
                    }}
                    title="Điểm số hiện tại trên hệ thống (Khóa cố định)"
                  >
                    {oldScore != null ? Number(oldScore).toFixed(1) : '—'}
                  </div>

                  <ArrowRight size={18} color="#94a3b8" />

                  {/* Điểm mới */}
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="Điểm mới"
                    value={newScore}
                    onChange={(e) => setNewScore(e.target.value)}
                    className="form-control"
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      color: '#047857',
                      fontSize: '1rem',
                      textAlign: 'center',
                    }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Lý do sửa điểm */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Lý do điều chỉnh điểm <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="VD: Chấm sót điểm câu 3 đề thi tự luận; Điều chỉnh theo biên bản phúc khảo số 12/BB-KCNTT..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '0.9rem' }}
                required
              />
            </div>

            {/* Tệp minh chứng */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Tệp minh chứng (Ảnh bài thi có chữ ký 2 CB chấm hoặc Biên bản) <span style={{ color: '#ef4444' }}>*</span>
              </label>

              <div
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  position: 'relative',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                }}
              >
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp, application/pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    width: '100%',
                    height: '100%',
                  }}
                />

                {isUploading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
                    <Loader2 size={28} className="animate-spin" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Đang tải tệp lên server...</span>
                  </div>
                ) : evidenceUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#059669' }}>
                    <CheckCircle2 size={24} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      Đã đính kèm minh chứng: {uploadedFileName || 'Tệp minh chứng'}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                    <UploadCloud size={32} color="#3b82f6" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                      Nhấp để chọn tệp hoặc kéo thả vào đây
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Hỗ trợ ảnh PNG, JPG hoặc PDF có chữ ký thẩm định (Tối đa 15MB)
                    </span>
                  </div>
                )}
              </div>

              {/* Tùy chọn nhập link trực tiếp nếu đã lưu trữ đám mây */}
              <div style={{ marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="Hoặc dán liên kết tài liệu trực tiếp (evidence_url)..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '6px' }}
                />
              </div>
            </div>

            {/* Cảnh báo quy chế */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#92400e',
                fontSize: '0.825rem',
                lineHeight: 1.45,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Lưu ý quy chế học vụ:</strong> Sau khi gửi, đơn sẽ chuyển qua 2 cấp duyệt:{' '}
                <em>(1) Trưởng bộ môn/Khoa thẩm định chuyên môn</em> ➔{' '}
                <em>(2) Phòng Đào tạo phê duyệt quyết định cuối & ghi đè điểm</em>. Mọi thay đổi đều được ghi vết bất biến vào nhật ký kiểm toán.
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary"
              style={{ padding: '8px 18px', borderRadius: '8px' }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="btn btn-primary"
              style={{
                padding: '8px 22px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
              }}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              <span>Gửi đơn thẩm định</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
