import { useRef } from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';

export default function ReceiptModal({ receipt, onClose }) {
  const printRef = useRef(null);

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val) => {
    if (val == null) return '0 VNĐ';
    return Number(val).toLocaleString('vi-VN') + ' VNĐ';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div
        className="modal-container"
        style={{
          maxWidth: '720px',
          width: '95%',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Header Modal Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-main, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={20} color="#10b981" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              Xác Nhận Thu Tiền Mặt Thành Công
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="In phiếu thu"
            >
              <Printer size={15} />
              <span>In Phiếu Thu</span>
            </button>
            <button
              onClick={onClose}
              className="btn-icon"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
              title="Đóng"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div
          ref={printRef}
          className="printable-receipt"
          style={{
            padding: '32px 36px',
            color: '#1e293b',
            overflowY: 'auto',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {/* Organization Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px dashed #cbd5e1', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', color: '#0f172a' }}>
                HỆ THỐNG QUẢN LÝ ĐÀO TẠO (SMS PORTAL)
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                PHÒNG ĐÀO TẠO & KẾ TOÁN TÀI CHÍNH
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>
                Mẫu số: 01-TT/ĐT
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                Mã phiếu: <strong style={{ color: '#0284c7' }}>{receipt.receiptNumber}</strong>
              </div>
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', margin: '20px 0 24px' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 6px', color: '#0f172a', letterSpacing: '0.5px' }}>
              BIÊN LAI THU TIỀN MẶT HỌC PHÍ
            </h2>
            <div style={{ fontSize: '0.88rem', color: '#64748b', fontStyle: 'italic' }}>
              Thời gian thu: {formatDate(receipt.paidAt)} • Phương thức: {receipt.paymentMethod || 'Tiền mặt'}
            </div>
          </div>

          {/* Student Info Box */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px 24px',
              fontSize: '0.9rem',
            }}
          >
            <div>
              <span style={{ color: '#64748b' }}>Họ và tên sinh viên: </span>
              <strong style={{ color: '#0f172a' }}>{receipt.studentName}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Mã số sinh viên (MSSV): </span>
              <strong style={{ fontFamily: 'monospace', color: '#0284c7' }}>{receipt.studentCode}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Lớp sinh hoạt: </span>
              <strong>{receipt.className || 'Chưa xếp lớp'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Áp dụng học kỳ: </span>
              <strong>{receipt.semesterName}</strong>
            </div>
          </div>

          {/* Items Table */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '20px',
              fontSize: '0.88rem',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px' }}>STT</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Mã môn</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Tên học phần</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '70px' }}>Số TC</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', width: '130px' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items && receipt.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, fontFamily: 'monospace' }}>{item.subjectCode}</td>
                  <td style={{ padding: '10px 12px' }}>{item.subjectName}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.credits}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                <td colSpan="4" style={{ padding: '12px', fontWeight: 700, textAlign: 'right', fontSize: '0.95rem' }}>
                  TỔNG CỘNG TIỀN MẶT ĐÃ THU:
                </td>
                <td style={{ padding: '12px', fontWeight: 800, textAlign: 'right', color: '#0284c7', fontSize: '1.05rem' }}>
                  {formatCurrency(receipt.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Signatures */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '36px',
              paddingTop: '16px',
              textAlign: 'center',
              fontSize: '0.88rem',
            }}
          >
            <div style={{ width: '40%' }}>
              <div style={{ fontWeight: 700, color: '#334155' }}>NGƯỜI NỘP TIỀN</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '60px' }}>
                (Ký và ghi rõ họ tên)
              </div>
              <div style={{ fontWeight: 600 }}>{receipt.studentName}</div>
            </div>

            <div style={{ width: '40%' }}>
              <div style={{ fontWeight: 700, color: '#334155' }}>NGƯỜI THU TIỀN</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '60px' }}>
                (Thủ quỹ / Chuyên viên PĐT)
              </div>
              <div style={{ fontWeight: 600, color: '#0284c7' }}>{receipt.cashierName || 'Phòng Đào tạo'}</div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button onClick={onClose} className="btn btn-secondary">
            Đóng
          </button>
          <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={16} />
            <span>In Biên Lai</span>
          </button>
        </div>
      </div>
    </div>
  );
}
