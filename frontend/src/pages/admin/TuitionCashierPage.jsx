import { useState, useEffect } from 'react';
import {
  Search,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Calendar,
  Layers,
  RotateCcw,
  Check,
  Ban,
  Clock,
  Printer,
  Users,
  FileSpreadsheet,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Lock
} from 'lucide-react';
import { toast } from 'react-toastify';
import { tuitionService, semesterService, studentService } from '../../services/dataService';
import ReceiptModal from '../../components/tuition/ReceiptModal';
import TableRowSkeleton from '../../components/common/TableRowSkeleton';
import { exportToCsv } from '../../utils/export';

export default function TuitionCashierPage() {
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'cashier' | 'overdue'

  // Common Semester state
  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [activeSemester, setActiveSemester] = useState(null);

  // Tab 0: Student Tuition Roster & Overview state
  const [overviewData, setOverviewData] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterStatusFilter, setRosterStatusFilter] = useState('ALL');
  const [rosterDeptFilter, setRosterDeptFilter] = useState('ALL');
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterPageSize, setRosterPageSize] = useState(10);

  // Batch Cash Collection state
  const [selectedRosterStudentIds, setSelectedRosterStudentIds] = useState([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchPaying, setBatchPaying] = useState(false);
  const [lastBatchResult, setLastBatchResult] = useState(null);

  // Tab 1: Cashier Desk state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [tuitionSummary, setTuitionSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [paying, setPaying] = useState(false);
  const [paymentNote, setPaymentNote] = useState('');
  const [receiptData, setReceiptData] = useState(null);

  // Tab 2: Overdue Scanner state
  const [overdueStudents, setOverdueStudents] = useState([]);
  const [loadingOverdue, setLoadingOverdue] = useState(false);
  const [cancellingOverdue, setCancellingOverdue] = useState(false);
  const [applyingHold, setApplyingHold] = useState(false);
  const [selectedOverdueInvoices, setSelectedOverdueInvoices] = useState([]);
  const [customDeadline, setCustomDeadline] = useState('');

  // Extension Modal state
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [extensionTargetStudent, setExtensionTargetStudent] = useState(null);
  const [extensionDays, setExtensionDays] = useState(7);
  const [extensionReason, setExtensionReason] = useState('Đơn xin hoãn nộp học phí của sinh viên');
  const [submittingExtension, setSubmittingExtension] = useState(false);

  async function loadSemesters() {
    try {
      const res = await semesterService.getAll();
      const list = res.data.data || [];
      setSemesters(list);
      const current = list.find((s) => s.isCurrent) || list[0];
      if (current) {
        setSelectedSemesterId(current.id);
        setActiveSemester(current);
        if (current.tuitionDeadline) {
          setCustomDeadline(current.tuitionDeadline.substring(0, 10));
        }
        loadTuitionOverview(current.id);
        scanOverdue(current.id);
      }
    } catch {
      toast.error('Lỗi khi tải danh sách học kỳ');
    }
  }

  // Load initial semesters
  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await semesterService.getAll();
        if (ignore) return;
        const list = res.data?.data || [];
        setSemesters(list);
        const current = list.find((s) => s.isCurrent) || list[0];
        if (current) {
          setSelectedSemesterId(current.id);
          setActiveSemester(current);
          if (current.tuitionDeadline) {
            setCustomDeadline(current.tuitionDeadline.substring(0, 10));
          }
          tuitionService
            .getOverview(current.id)
            .then((res) => {
              if (!ignore) setOverviewData(res.data?.data || null);
            })
            .catch(() => {});
          tuitionService
            .scanOverdue({
              semesterId: current.id,
              deadline: current.tuitionDeadline?.substring(0, 10),
            })
            .then((res) => {
              if (!ignore) setOverdueStudents(res.data?.data || []);
            })
            .catch(() => {});
        }
      } catch {
        toast.error('Lỗi khi tải danh sách học kỳ');
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSemesterChange = (e) => {
    const semId = parseInt(e.target.value);
    setSelectedSemesterId(semId);
    const sem = semesters.find((s) => s.id === semId);
    setActiveSemester(sem || null);
    if (sem?.tuitionDeadline) {
      setCustomDeadline(sem.tuitionDeadline.substring(0, 10));
    }

    loadTuitionOverview(semId);
    if (selectedStudent) {
      loadTuitionSummary(selectedStudent.id, semId);
    }
    if (activeTab === 'overdue') {
      scanOverdue(semId);
    }
  };

  async function loadTuitionOverview(semId = selectedSemesterId) {
    if (!semId) return;
    try {
      setLoadingOverview(true);
      const res = await tuitionService.getOverview(semId);
      setOverviewData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tải tổng quan học phí');
    } finally {
      setLoadingOverview(false);
    }
  }

  const handleOpenCashierForStudent = (st) => {
    const studentObj = {
      id: st.studentId,
      studentCode: st.studentCode,
      fullName: st.fullName,
      classEntity: { name: st.className },
    };
    handleSelectStudent(studentObj);
    setActiveTab('cashier');
  };

  const departmentOptions = Array.from(
    new Set((overviewData?.students || []).map((s) => s.departmentName).filter(Boolean))
  ).sort();

  const filteredRosterStudents = (overviewData?.students || []).filter((st) => {
    const matchSearch =
      !rosterSearch.trim() ||
      st.studentCode?.toLowerCase().includes(rosterSearch.toLowerCase().trim()) ||
      st.fullName?.toLowerCase().includes(rosterSearch.toLowerCase().trim()) ||
      (st.className && st.className.toLowerCase().includes(rosterSearch.toLowerCase().trim()));

    const matchStatus =
      rosterStatusFilter === 'ALL' || st.status === rosterStatusFilter;

    const matchDept =
      rosterDeptFilter === 'ALL' || st.departmentName === rosterDeptFilter;

    return matchSearch && matchStatus && matchDept;
  });

  const totalRosterPages = Math.ceil(filteredRosterStudents.length / rosterPageSize) || 1;
  const currentRosterPage = Math.min(rosterPage, totalRosterPages);
  const paginatedRosterStudents = filteredRosterStudents.slice(
    (currentRosterPage - 1) * rosterPageSize,
    currentRosterPage * rosterPageSize
  );

  const handleExportRosterCsv = () => {
    if (!filteredRosterStudents.length) {
      toast.warn('Không có dữ liệu để xuất');
      return;
    }
    const headers = [
      'STT',
      'Mã sinh viên',
      'Họ và tên',
      'Lớp sinh hoạt',
      'Khoa / Viện',
      'Số học phần',
      'Số tín chỉ',
      'Tổng học phí (VNĐ)',
      'Đã đóng (VNĐ)',
      'Còn nợ (VNĐ)',
      'Trạng thái'
    ];
    const mapper = (st, idx) => [
      idx + 1,
      st.studentCode,
      st.fullName,
      st.className || 'Chưa xếp lớp',
      st.departmentName || '—',
      st.totalCourses || 0,
      st.totalCredits || 0,
      st.totalAmount || 0,
      st.paidAmount || 0,
      st.unpaidAmount || 0,
      st.status === 'PAID'
        ? 'Đã hoàn tất'
        : st.status === 'PARTIAL'
        ? 'Còn nợ một phần'
        : 'Chưa nộp'
    ];
    const semName = activeSemester?.semesterName ? activeSemester.semesterName.replace(/[^a-zA-Z0-9]/g, '_') : 'hoc_ky';
    exportToCsv(`danh-sach-hoc-phi-${semName}.csv`, headers, filteredRosterStudents, mapper);
    toast.success(`Đã xuất ${filteredRosterStudents.length} sinh viên ra file CSV!`);
  };

  // Filter eligible unpaid students for batch collection
  const filteredUnpaidStudents = filteredRosterStudents.filter((st) => Number(st.unpaidAmount) > 0);
  const paginatedUnpaidStudents = paginatedRosterStudents.filter((st) => Number(st.unpaidAmount) > 0);

  const isCurrentPageAllSelected =
    paginatedUnpaidStudents.length > 0 &&
    paginatedUnpaidStudents.every((st) => selectedRosterStudentIds.includes(st.studentId));

  const isAllFilteredSelected =
    filteredUnpaidStudents.length > 0 &&
    filteredUnpaidStudents.every((st) => selectedRosterStudentIds.includes(st.studentId));

  const handleToggleStudentSelection = (studentId) => {
    setSelectedRosterStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleToggleSelectCurrentPage = () => {
    if (isCurrentPageAllSelected) {
      const pageIds = paginatedUnpaidStudents.map((st) => st.studentId);
      setSelectedRosterStudentIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedUnpaidStudents.map((st) => st.studentId);
      setSelectedRosterStudentIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredUnpaidStudents.map((st) => st.studentId);
    setSelectedRosterStudentIds(allFilteredIds);
  };

  const handleClearRosterSelection = () => {
    setSelectedRosterStudentIds([]);
  };

  const selectedBatchStudents = (overviewData?.students || []).filter((st) =>
    selectedRosterStudentIds.includes(st.studentId)
  );

  const selectedBatchTotalAmount = selectedBatchStudents.reduce(
    (sum, st) => sum + (Number(st.unpaidAmount) || 0),
    0
  );

  const handleConfirmBatchCashPayment = async () => {
    if (selectedRosterStudentIds.length === 0) {
      toast.warn('Vui lòng chọn ít nhất một sinh viên còn nợ học phí');
      return;
    }
    try {
      setBatchPaying(true);
      const payload = {
        semesterId: selectedSemesterId,
        studentIds: selectedRosterStudentIds,
        note: 'Thu tiền mặt hàng loạt tại Phòng Đào tạo',
      };
      const res = await tuitionService.collectBatchCash(payload);
      const data = res.data.data;
      toast.success(
        `Đã thu tiền mặt thành công cho ${data.totalSuccessStudents} sinh viên với tổng số tiền ${formatCurrency(data.totalAmount)}!`
      );
      setLastBatchResult(data);
      setBatchModalOpen(false);
      setSelectedRosterStudentIds([]);
      loadTuitionOverview(selectedSemesterId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xác nhận thu tiền mặt hàng loạt');
    } finally {
      setBatchPaying(false);
    }
  };

  const handleExportLastBatchReceiptsCsv = () => {
    if (!lastBatchResult?.receipts?.length) {
      toast.warn('Không có danh sách biên lai để xuất');
      return;
    }
    const headers = [
      'STT',
      'Mã phiếu thu',
      'Mã sinh viên',
      'Họ và tên',
      'Lớp sinh hoạt',
      'Học kỳ',
      'Số tiền đã thu (VNĐ)',
      'Hình thức',
      'Ngày giờ thu',
      'Người thu',
      'Ghi chú'
    ];
    const mapper = (rc, idx) => [
      idx + 1,
      rc.receiptNumber,
      rc.studentCode,
      rc.studentName,
      rc.className || '—',
      rc.semesterName,
      rc.totalAmount || 0,
      rc.paymentMethod,
      rc.paidAt ? new Date(rc.paidAt).toLocaleString('vi-VN') : '',
      rc.cashierName || 'Thủ quỹ PĐT',
      rc.note || ''
    ];
    const semName = activeSemester?.semesterName ? activeSemester.semesterName.replace(/[^a-zA-Z0-9]/g, '_') : 'hoc_ky';
    exportToCsv(`bien-lai-thu-tien-mat-${semName}.csv`, headers, lastBatchResult.receipts, mapper);
    toast.success(`Đã xuất ${lastBatchResult.receipts.length} phiếu thu ra file CSV!`);
  };

  // Toggle registration gate 1-click
  const handleToggleRegistrationGate = async (isOpen) => {
    if (!selectedSemesterId) return;
    try {
      if (isOpen) {
        await semesterService.openRegistration(selectedSemesterId, { days: 14 });
        toast.success('Đã mở cổng đăng ký học phần (thời hạn 14 ngày)!');
      } else {
        await semesterService.closeRegistration(selectedSemesterId);
        toast.success('Đã đóng cổng đăng ký học phần!');
      }
      loadSemesters();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi thao tác cổng ĐKHP');
    }
  };

  // Student search in Cashier Desk
  const handleSearchStudents = async (e) => {
    e.preventDefault();
    if (!searchKeyword.trim()) {
      toast.info('Vui lòng nhập Mã sinh viên hoặc Họ tên để tìm kiếm');
      return;
    }
    try {
      setSearching(true);
      const res = await studentService.search(searchKeyword.trim());
      const students = res.data.data || [];
      setSearchResults(students);
      if (students.length === 1) {
        handleSelectStudent(students[0]);
      } else if (students.length === 0) {
        toast.warn('Không tìm thấy sinh viên nào khớp với từ khóa');
      }
    } catch {
      toast.error('Lỗi khi tìm kiếm sinh viên');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectStudent = (st) => {
    setSelectedStudent(st);
    setSearchResults([]);
    setSearchKeyword(`${st.studentCode} - ${st.fullName}`);
    loadTuitionSummary(st.id, selectedSemesterId);
  };

  const loadTuitionSummary = async (studentId, semesterId) => {
    try {
      setLoadingSummary(true);
      const res = await tuitionService.getStudentTuition(studentId, semesterId);
      const data = res.data.data;
      setTuitionSummary(data);

      // Auto select all UNPAID invoices
      const unpaids = (data.items || [])
        .filter((item) => item.status === 'UNPAID')
        .map((item) => item.invoiceId);
      setSelectedInvoiceIds(unpaids);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tải bảng kê học phí');
      setTuitionSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleOpenExtensionModal = (st) => {
    setExtensionTargetStudent(st);
    setExtensionDays(7);
    setExtensionReason('Đơn xin hoãn nộp học phí của sinh viên');
    setExtensionModalOpen(true);
  };

  const handleCloseExtensionModal = () => {
    setExtensionModalOpen(false);
    setExtensionTargetStudent(null);
  };

  const handleSubmitExtension = async (e) => {
    if (e) e.preventDefault();
    if (!extensionTargetStudent || !selectedSemesterId) return;
    try {
      setSubmittingExtension(true);
      await tuitionService.extendDeadline({
        studentId: extensionTargetStudent.studentId || extensionTargetStudent.id,
        semesterId: selectedSemesterId,
        days: extensionDays || 7,
        reason: extensionReason.trim() || 'Đơn xin hoãn nộp học phí của sinh viên',
      });
      toast.success(`Đã gia hạn nộp học phí ${extensionDays || 7} ngày thành công cho sinh viên!`);
      handleCloseExtensionModal();
      loadTuitionOverview(selectedSemesterId);
      if (selectedStudent && (selectedStudent.id === (extensionTargetStudent.studentId || extensionTargetStudent.id))) {
        loadTuitionSummary(selectedStudent.id, selectedSemesterId);
      }
      scanOverdue(selectedSemesterId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi gia hạn học phí');
    } finally {
      setSubmittingExtension(false);
    }
  };

  // Collect cash payment (Enforces 100% full payment)
  const handleCollectCash = async () => {
    if (!selectedStudent || !tuitionSummary) {
      toast.warn('Vui lòng chọn sinh viên cần thu tiền mặt');
      return;
    }
    const unpaids = (tuitionSummary.items || [])
      .filter((item) => item.status === 'UNPAID')
      .map((item) => item.invoiceId);

    if (unpaids.length === 0) {
      toast.info('Sinh viên này đã hoàn tất 100% học phí');
      return;
    }
    if (selectedInvoiceIds.length < unpaids.length) {
      toast.warn('Quy chế tài chính: Bắt buộc thu 100% học phí toàn bộ các học phần. Không áp dụng thu từng phần.');
      return;
    }
    try {
      setPaying(true);
      const payload = {
        studentId: selectedStudent.id,
        semesterId: selectedSemesterId,
        invoiceIds: unpaids,
        note: paymentNote.trim() || 'Thu 100% tiền mặt tại quầy Phòng Đào tạo',
      };
      const res = await tuitionService.collectCash(payload);
      toast.success('Xác nhận thu 100% tiền mặt thành công!');
      setReceiptData(res.data.data);
      // Reload summary & overview
      loadTuitionSummary(selectedStudent.id, selectedSemesterId);
      loadTuitionOverview(selectedSemesterId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xác nhận thu tiền mặt');
    } finally {
      setPaying(false);
    }
  };

  // Tab 2: Overdue scanner
  async function scanOverdue(semId = selectedSemesterId) {
    try {
      setLoadingOverdue(true);
      const res = await tuitionService.scanOverdue({
        semesterId: semId,
        deadline: customDeadline || undefined,
      });
      const list = res.data.data || [];
      setOverdueStudents(list);
      // Auto select all invoices
      const allInvIds = list.flatMap((s) => s.invoiceIds || []);
      setSelectedOverdueInvoices(allInvIds);
      if (list.length === 0) {
        toast.info('Không có sinh viên nào nợ học phí quá hạn!');
      }
    } catch {
      toast.error('Lỗi khi quét danh sách nợ học phí');
    } finally {
      setLoadingOverdue(false);
    }
  }

  const handleToggleSelectAllOverdue = () => {
    const allInvIds = overdueStudents.flatMap((s) => s.invoiceIds || []);
    if (selectedOverdueInvoices.length === allInvIds.length) {
      setSelectedOverdueInvoices([]);
    } else {
      setSelectedOverdueInvoices(allInvIds);
    }
  };

  const handleCancelOverdue = async () => {
    if (selectedOverdueInvoices.length === 0) {
      toast.warn('Vui lòng chọn ít nhất một học phần quá hạn để hủy');
      return;
    }

    const confirmMsg = `Bạn có chắc chắn muốn HỦY ${selectedOverdueInvoices.length} học phần của sinh viên nợ học phí quá hạn?\n\nThao tác này sẽ giải phóng slot sĩ số lớp học phần và gửi thông báo cho sinh viên!`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setCancellingOverdue(true);
      const res = await tuitionService.cancelOverdue(selectedOverdueInvoices);
      toast.success(res.data?.message || 'Đã hủy học phần quá hạn thành công!');
      scanOverdue();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi hủy học phần quá hạn');
    } finally {
      setCancellingOverdue(false);
    }
  };

  const handleTriggerFinancialHolds = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn kích hoạt Quy tắc liên thông B: Quét và áp dụng chế tài FINANCIAL HOLD cho toàn bộ sinh viên nợ học phí quá hạn?\n\nSinh viên bị áp dụng sẽ bị khóa cổng ĐKTC và khóa tra cứu bảng điểm kết thúc học kỳ.")) {
      return;
    }
    try {
      setApplyingHold(true);
      const res = await tuitionService.triggerFinancialHolds();
      toast.success(res.data?.message || 'Đã áp dụng chế tài Financial Hold thành công!');
      scanOverdue();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi áp dụng Financial Hold');
    } finally {
      setApplyingHold(false);
    }
  };

  const formatCurrency = (val) => {
    if (val == null) return '0 VNĐ';
    return Number(val).toLocaleString('vi-VN') + ' VNĐ';
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Tài Chính & Thu Ngân Đào Tạo</h1>
          <p>
            Màn hình thu ngân học phí trực tiếp tại quầy, quản lý đợt mở/đóng cổng ĐKHP và quét hủy môn quá hạn thanh toán
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Học kỳ:</span>
            <select
              value={selectedSemesterId}
              onChange={handleSemesterChange}
              className="form-select"
              style={{ minWidth: '220px', padding: '6px 12px' }}
            >
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.semesterName} ({s.academicYear}) {s.isCurrent ? '★ Hiện tại' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Top Banner: Registration Gate Control */}
      {activeSemester && (
        <div
          className="card"
          style={{
            marginBottom: '20px',
            backgroundColor: activeSemester.registrationOpen ? '#ecfdf5' : '#f8fafc',
            border: `1px solid ${activeSemester.registrationOpen ? '#a7f3d0' : '#e2e8f0'}`,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: activeSemester.registrationOpen ? '#10b981' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                  Cổng Đăng Ký Học Phần:
                </span>
                <span
                  className={`badge ${activeSemester.registrationOpen ? 'badge-success' : 'badge-neutral'}`}
                  style={{ fontSize: '0.85rem', padding: '4px 10px' }}
                >
                  {activeSemester.registrationOpen ? '● ĐANG MỞ ĐĂNG KÝ' : '○ ĐÃ ĐÓNG CỔNG'}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
                Thời gian mở: {activeSemester.registrationStart ? activeSemester.registrationStart.substring(0, 10) : 'Chưa định'} đến{' '}
                {activeSemester.registrationEnd ? activeSemester.registrationEnd.substring(0, 10) : 'Chưa định'}
                {activeSemester.tuitionDeadline && (
                  <span> • Hạn chót nộp học phí: <strong style={{ color: '#0284c7' }}>{activeSemester.tuitionDeadline.substring(0, 10)}</strong></span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {activeSemester.registrationOpen ? (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleToggleRegistrationGate(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Ban size={15} />
                <span>Đóng Cổng ĐKHP Ngay</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleToggleRegistrationGate(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle size={15} />
                <span>Mở Cổng ĐKHP (14 Ngày)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid var(--border-color)', flexWrap: 'wrap' }}>
        <button
          className={`tab-btn ${activeTab === 'roster' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('roster');
            if (!overviewData && selectedSemesterId) {
              loadTuitionOverview(selectedSemesterId);
            }
          }}
          style={{
            padding: '10px 20px',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'roster' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'roster' ? '3px solid var(--primary)' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Users size={18} />
          <span>Danh Sách Học Phí & Công Nợ</span>
          {overviewData?.students && (
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
              {overviewData.students.length}
            </span>
          )}
        </button>

        <button
          className={`tab-btn ${activeTab === 'cashier' ? 'active' : ''}`}
          onClick={() => setActiveTab('cashier')}
          style={{
            padding: '10px 20px',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'cashier' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'cashier' ? '3px solid var(--primary)' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CreditCard size={18} />
          <span>Màn Hình Thu Ngân Tiền Mặt</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'overdue' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('overdue');
            scanOverdue();
          }}
          style={{
            padding: '10px 20px',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'overdue' ? '#dc2626' : 'var(--text-secondary)',
            borderBottom: activeTab === 'overdue' ? '3px solid #dc2626' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={18} />
          <span>Rà Soát & Quét Quá Hạn Học Phí</span>
          {overdueStudents.length > 0 && (
            <span className="badge badge-danger" style={{ fontSize: '0.75rem', padding: '2px 6px' }}>
              {overdueStudents.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 0: ROSTER & OVERVIEW */}
      {activeTab === 'roster' && (
        <div>
          {/* KPI Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Tổng sinh viên phát sinh học phí
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--primary)' }}>
                {overviewData?.totalStudents ?? 0} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>sinh viên</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Học kỳ: {activeSemester?.semesterName || '—'}
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Tổng học phí toàn trường
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.3rem', color: '#0f172a' }}>
                {formatCurrency(overviewData?.totalTuition ?? 0)}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Định mức theo tín chỉ đăng ký
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Tổng số tiền đã thu
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.3rem', color: '#10b981' }}>
                {formatCurrency(overviewData?.totalCollected ?? 0)}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#10b981', marginTop: '4px' }}>
                Đã thu tiền mặt & chuyển khoản
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #dc2626' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Tổng công nợ còn lại
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.35rem', color: '#dc2626' }}>
                {formatCurrency(overviewData?.totalDebt ?? 0)}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#dc2626', marginTop: '4px' }}>
                Chưa nộp hoặc nộp thiếu
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                {/* Search box */}
                <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '360px' }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '34px', fontSize: '0.88rem' }}
                    placeholder="Tìm theo MSSV, Họ tên, Lớp..."
                    value={rosterSearch}
                    onChange={(e) => {
                      setRosterSearch(e.target.value);
                      setRosterPage(1);
                    }}
                  />
                </div>

                {/* Status Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Trạng thái:
                  </span>
                  <select
                    className="form-select"
                    style={{ fontSize: '0.88rem', padding: '6px 10px', minWidth: '150px' }}
                    value={rosterStatusFilter}
                    onChange={(e) => {
                      setRosterStatusFilter(e.target.value);
                      setRosterPage(1);
                    }}
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="UNPAID">Chưa nộp học phí</option>
                    <option value="PARTIAL">Còn nợ một phần</option>
                    <option value="PAID">Đã hoàn tất (Đủ)</option>
                  </select>
                </div>

                {/* Department Filter */}
                {departmentOptions.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Khoa/Viện:
                    </span>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.88rem', padding: '6px 10px', maxWidth: '220px' }}
                      value={rosterDeptFilter}
                      onChange={(e) => {
                        setRosterDeptFilter(e.target.value);
                        setRosterPage(1);
                      }}
                    >
                      <option value="ALL">Tất cả Khoa/Viện</option>
                      {departmentOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Action: Export CSV & Batch Cash Button */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {selectedRosterStudentIds.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setBatchModalOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.88rem',
                      backgroundColor: '#059669',
                      borderColor: '#059669',
                      fontWeight: 600,
                    }}
                  >
                    <DollarSign size={16} />
                    <span>Thu tiền mặt ({selectedRosterStudentIds.length})</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleExportRosterCsv}
                  disabled={filteredRosterStudents.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}
                >
                  <FileSpreadsheet size={16} />
                  <span>Xuất Excel ({filteredRosterStudents.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Last Batch Result Alert Banner */}
          {lastBatchResult?.receipts?.length > 0 && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 16px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#065f46',
                fontSize: '0.88rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} style={{ color: '#059669' }} />
                <span>
                  Đã thu tiền mặt thành công cho <strong>{lastBatchResult.totalSuccessStudents}</strong> sinh viên (Tổng:{' '}
                  <strong>{formatCurrency(lastBatchResult.totalAmount)}</strong>).
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleExportLastBatchReceiptsCsv}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    borderColor: '#059669',
                    color: '#059669',
                    backgroundColor: '#ffffff',
                    padding: '4px 10px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <Printer size={14} />
                  <span>Tải danh sách {lastBatchResult.receipts.length} phiếu thu (CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLastBatchResult(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#065f46',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    lineHeight: 1,
                  }}
                  title="Đóng thông báo"
                >
                  &times;
                </button>
              </div>
            </div>
          )}

          {/* Multi-select Action Bar & Cross-page Selection Banner */}
          {selectedRosterStudentIds.length > 0 && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 18px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9rem', color: '#166534' }}>
                  Đã chọn <strong>{selectedRosterStudentIds.length}</strong> sinh viên còn nợ học phí | Tổng tiền mặt:{' '}
                  <strong style={{ color: '#059669', fontSize: '1rem' }}>
                    {formatCurrency(selectedBatchTotalAmount)}
                  </strong>
                </span>

                {isCurrentPageAllSelected &&
                  filteredUnpaidStudents.length > paginatedUnpaidStudents.length &&
                  !isAllFilteredSelected && (
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={handleSelectAllFiltered}
                      style={{
                        padding: 0,
                        fontSize: '0.85rem',
                        color: 'var(--primary)',
                        textDecoration: 'underline',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                      }}
                    >
                      Chọn tất cả {filteredUnpaidStudents.length} sinh viên chưa nộp tiền theo bộ lọc này
                    </button>
                  )}

                {isAllFilteredSelected && filteredUnpaidStudents.length > paginatedUnpaidStudents.length && (
                  <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 600 }}>
                    (Đang chọn toàn bộ {filteredUnpaidStudents.length} sinh viên theo bộ lọc)
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setBatchModalOpen(true)}
                  style={{
                    backgroundColor: '#059669',
                    borderColor: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                  }}
                >
                  <DollarSign size={16} />
                  <span>Xác nhận thu tiền ({selectedRosterStudentIds.length})</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleClearRosterSelection}
                  style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}

          {/* Roster Table Card */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div
              className="card-header"
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                  Bảng Kê Công Nợ & Học Phí Sinh Viên ({activeSemester?.semesterName || 'Kỳ hiện tại'})
                </h3>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Hiển thị {paginatedRosterStudents.length} / {filteredRosterStudents.length} sinh viên
              </span>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isCurrentPageAllSelected}
                        disabled={paginatedUnpaidStudents.length === 0}
                        onChange={handleToggleSelectCurrentPage}
                        title="Chọn tất cả sinh viên chưa nộp tiền trên trang này"
                        style={{ cursor: paginatedUnpaidStudents.length > 0 ? 'pointer' : 'not-allowed' }}
                      />
                    </th>
                    <th style={{ width: '45px', textAlign: 'center' }}>STT</th>
                    <th>Mã sinh viên</th>
                    <th>Họ và tên</th>
                    <th>Lớp sinh hoạt</th>
                    <th>Khoa / Viện</th>
                    <th style={{ textAlign: 'center' }}>Đăng ký</th>
                    <th style={{ textAlign: 'right' }}>Tổng học phí</th>
                    <th style={{ textAlign: 'right' }}>Đã nộp</th>
                    <th style={{ textAlign: 'right' }}>Còn nợ</th>
                    <th style={{ textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ textAlign: 'center', width: '130px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingOverview ? (
                    <tr>
                      <td colSpan="12" style={{ textAlign: 'center', padding: '36px' }}>
                        Đang nạp danh sách học phí sinh viên...
                      </td>
                    </tr>
                  ) : filteredRosterStudents.length === 0 ? (
                    <tr>
                      <td colSpan="12" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        Không tìm thấy sinh viên nào khớp với điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    paginatedRosterStudents.map((st, idx) => {
                      const stt = (currentRosterPage - 1) * rosterPageSize + idx + 1;
                      const isSelected = selectedRosterStudentIds.includes(st.studentId);
                      const canSelect = Number(st.unpaidAmount) > 0;
                      return (
                        <tr
                          key={st.studentId}
                          style={{ backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.08)' : undefined }}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!canSelect}
                              onChange={() => handleToggleStudentSelection(st.studentId)}
                              style={{ cursor: canSelect ? 'pointer' : 'not-allowed' }}
                              title={canSelect ? 'Chọn để thu tiền mặt hàng loạt' : 'Sinh viên đã hoàn tất học phí'}
                            />
                          </td>
                          <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {stt}
                          </td>
                          <td>
                            <strong style={{ fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.95rem' }}>
                              {st.studentCode}
                            </strong>
                          </td>
                          <td style={{ fontWeight: 600 }}>{st.fullName}</td>
                          <td style={{ fontSize: '0.85rem' }}>{st.className || 'Chưa xếp lớp'}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {st.departmentName || '—'}
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 600 }}>{st.totalCredits}</span> TC ({st.totalCourses} môn)
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {formatCurrency(st.totalAmount)}
                          </td>
                          <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                            {formatCurrency(st.paidAmount)}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontWeight: 700,
                              color: st.unpaidAmount > 0 ? '#dc2626' : '#10b981',
                            }}
                          >
                            {formatCurrency(st.unpaidAmount)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {st.status === 'PAID' ? (
                              <span className="badge badge-success" style={{ fontSize: '0.78rem' }}>
                                ĐÃ HOÀN TẤT
                              </span>
                            ) : st.isExtended ? (
                              <span
                                className="badge badge-warning"
                                style={{
                                  fontSize: '0.78rem',
                                  backgroundColor: '#fef08a',
                                  color: '#854d0e',
                                  border: '1px solid #fde047',
                                }}
                                title={`Đang được gia hạn nộp đến: ${st.extendedDeadline}. Lý do: ${st.extensionReason || 'N/A'}`}
                              >
                                GIA HẠN ĐẾN {st.extendedDeadline?.substring(5, 10)}
                              </span>
                            ) : st.status === 'PARTIAL' ? (
                              <span className="badge badge-warning" style={{ fontSize: '0.78rem' }}>
                                NỢ MỘT PHẦN
                              </span>
                            ) : (
                              <span className="badge badge-danger" style={{ fontSize: '0.78rem' }}>
                                CHƯA NỘP
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => handleOpenCashierForStudent(st)}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.8rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title="Chuyển sang bàn thu ngân tiền mặt để thu 100% học phí"
                              >
                                <span>Thu tiền</span>
                                <ArrowRight size={13} />
                              </button>
                              {st.status !== 'PAID' && (
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  onClick={() => handleOpenExtensionModal(st)}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.8rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    borderColor: '#f59e0b',
                                    color: '#d97706',
                                  }}
                                  title="Cấp gia hạn nộp học phí 1 tuần"
                                >
                                  <Clock size={13} />
                                  <span>Gia hạn</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredRosterStudents.length > 0 && (
              <div
                style={{
                  padding: '12px 20px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  backgroundColor: 'var(--bg-main)',
                }}
              >
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hiển thị {(currentRosterPage - 1) * rosterPageSize + 1} -{' '}
                  {Math.min(currentRosterPage * rosterPageSize, filteredRosterStudents.length)} trên tổng số{' '}
                  <strong>{filteredRosterStudents.length}</strong> sinh viên
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Mỗi trang:</span>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.82rem', padding: '4px 8px' }}
                      value={rosterPageSize}
                      onChange={(e) => {
                        setRosterPageSize(parseInt(e.target.value));
                        setRosterPage(1);
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={currentRosterPage <= 1}
                      onClick={() => setRosterPage((p) => Math.max(1, p - 1))}
                      style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ fontSize: '0.85rem', padding: '0 8px', fontWeight: 600 }}>
                      Trang {currentRosterPage} / {totalRosterPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={currentRosterPage >= totalRosterPages}
                      onClick={() => setRosterPage((p) => Math.min(totalRosterPages, p + 1))}
                      style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: CASHIER DESK */}
      {activeTab === 'cashier' && (
        <div>
          {/* Search Toolbar */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-body" style={{ padding: '20px' }}>
              <form onSubmit={handleSearchStudents} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '600px' }}>
                  <Search
                    size={18}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Nhập Mã sinh viên (VD: 2500001, 2300001) hoặc Họ tên..."
                    className="form-control"
                    style={{ paddingLeft: '38px', fontSize: '0.95rem' }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={searching}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Search size={16} />
                  <span>{searching ? 'Đang tìm...' : 'Tìm kiếm'}</span>
                </button>
                {selectedStudent && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setSelectedStudent(null);
                      setTuitionSummary(null);
                      setSearchKeyword('');
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RotateCcw size={14} />
                    <span>Xóa tìm</span>
                  </button>
                )}
              </form>

              {/* Autocomplete / Multiple Results Dropdown */}
              {searchResults.length > 1 && (
                <div
                  style={{
                    marginTop: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: 'var(--card-bg)',
                  }}
                >
                  <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)' }}>
                    Tìm thấy {searchResults.length} sinh viên phù hợp, vui lòng bấm chọn:
                  </div>
                  {searchResults.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => handleSelectStudent(st)}
                      style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-main)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div>
                        <strong style={{ color: 'var(--primary)' }}>{st.studentCode}</strong> — {st.fullName}
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {st.classEntity?.name || 'Chưa xếp lớp'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Student Tuition Details */}
          {loadingSummary ? (
            <div className="card">
              <div className="card-body" style={{ padding: '36px', textAlign: 'center' }}>
                <p>Đang tải thông tin bảng kê học phí...</p>
              </div>
            </div>
          ) : !tuitionSummary ? (
            <div className="card">
              <div
                className="card-body"
                style={{
                  padding: '64px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: 'var(--primary)',
                  }}
                >
                  <DollarSign size={32} />
                </div>
                <h3 style={{ margin: '0 0 8px', color: 'var(--text-main)', fontSize: '1.2rem' }}>
                  Bàn Thu Ngân & Xác Nhận Tiền Mặt
                </h3>
                <p style={{ maxWidth: '480px', margin: '0 auto', fontSize: '0.9rem' }}>
                  Nhập Mã sinh viên vào ô tìm kiếm ở trên để kết xuất bảng kê học phí, các môn học đã đăng ký và xác nhận thu tiền mặt tại quầy.
                </p>
              </div>
            </div>
          ) : (
            <div>
              {/* Student Overview Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                  marginBottom: '20px',
                }}
              >
                <div className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Sinh viên</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                    {tuitionSummary.fullName}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)', marginTop: '2px' }}>
                    MSSV: {tuitionSummary.studentCode}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Lớp: {tuitionSummary.className || 'Chưa xếp lớp'}
                  </div>
                </div>

                <div className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Khối lượng đăng ký</div>
                  <div style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--primary)' }}>
                    {tuitionSummary.totalCredits} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Tín chỉ</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {tuitionSummary.items?.length || 0} Học phần trong kỳ
                  </div>
                </div>

                <div className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Tổng học phí phải nộp</div>
                  <div style={{ fontWeight: 700, fontSize: '1.3rem', color: '#0f172a' }}>
                    {formatCurrency(tuitionSummary.totalAmount)}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#10b981', marginTop: '4px' }}>
                    Đã thu: {formatCurrency(tuitionSummary.paidAmount)}
                  </div>
                </div>

                <div
                  className="card"
                  style={{
                    padding: '16px 20px',
                    borderLeft: `4px solid ${
                      tuitionSummary.overallStatus === 'PAID' ? '#10b981' : '#dc2626'
                    }`,
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Công nợ còn lại</div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '1.35rem',
                      color: tuitionSummary.unpaidAmount > 0 ? '#dc2626' : '#10b981',
                    }}
                  >
                    {formatCurrency(tuitionSummary.unpaidAmount)}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span
                      className={`badge ${
                        tuitionSummary.overallStatus === 'PAID'
                          ? 'badge-success'
                          : tuitionSummary.overallStatus === 'PARTIAL'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {tuitionSummary.overallStatus === 'PAID'
                        ? 'ĐÃ HOÀN TẤT'
                        : tuitionSummary.overallStatus === 'PARTIAL'
                        ? 'CÒN NỢ MỘT PHẦN'
                        : 'CHƯA NỘP HỌC PHÍ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Extension Banner (if applicable) */}
              {tuitionSummary.isExtended && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px 18px',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fde047',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    color: '#92400e',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Clock size={20} style={{ color: '#d97706', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                        Sinh viên đang trong diện gia hạn nộp học phí
                      </div>
                      <div style={{ fontSize: '0.85rem', marginTop: '2px', color: '#b45309' }}>
                        Hạn chót bảo lưu: <strong>{tuitionSummary.extendedDeadline}</strong>
                        {tuitionSummary.extensionReason && ` • Lý do: ${tuitionSummary.extensionReason}`}
                      </div>
                    </div>
                  </div>
                  <span
                    className="badge badge-warning"
                    style={{
                      fontSize: '0.78rem',
                      padding: '4px 10px',
                      backgroundColor: '#fde047',
                      color: '#78350f',
                      fontWeight: 700,
                    }}
                  >
                    ĐÃ CẤP GIA HẠN
                  </span>
                </div>
              )}

              {/* Invoices List Table */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div
                  className="card-header"
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={18} style={{ color: 'var(--primary)' }} />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                      Bảng Kê Chi Tiết Học Phần & Học Phí ({tuitionSummary.semesterName})
                    </h3>
                  </div>

                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#0369a1',
                      backgroundColor: '#e0f2fe',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: '1px solid #bae6fd',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle size={14} />
                    <span>Quy chế: Bắt buộc hoàn tất 100% học phí</span>
                  </span>
                </div>

                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: '45px', textAlign: 'center' }}>STT</th>
                        <th>Mã học phần</th>
                        <th>Tên môn học</th>
                        <th style={{ textAlign: 'center' }}>Số TC</th>
                        <th style={{ textAlign: 'right' }}>Đơn giá chuẩn</th>
                        <th style={{ textAlign: 'center' }}>Hệ số</th>
                        <th style={{ textAlign: 'right' }}>Thành tiền</th>
                        <th style={{ textAlign: 'center' }}>Trạng thái</th>
                        <th style={{ textAlign: 'center' }}>Mã phiếu thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tuitionSummary.items && tuitionSummary.items.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                            Sinh viên chưa đăng ký học phần nào trong học kỳ này.
                          </td>
                        </tr>
                      ) : (
                        tuitionSummary.items?.map((item, idx) => {
                          const isUnpaid = item.status === 'UNPAID';
                          return (
                            <tr
                              key={item.invoiceId}
                              style={{
                                backgroundColor: isUnpaid ? 'rgba(239, 68, 68, 0.03)' : undefined,
                              }}
                            >
                              <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {idx + 1}
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    color: 'var(--primary)',
                                  }}
                                >
                                  {item.sectionCode}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600 }}>{item.subjectName}</td>
                              <td style={{ textAlign: 'center' }}>{item.credits}</td>
                              <td style={{ textAlign: 'right' }}>{formatCurrency(item.baseRate)}</td>
                              <td style={{ textAlign: 'center' }}>
                                {Number(item.coefficient || 1).toFixed(2)}x
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                                {formatCurrency(item.amount)}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {item.status === 'PAID' ? (
                                  <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Check size={12} /> Đã thu tiền mặt
                                  </span>
                                ) : item.status === 'CANCELLED' ? (
                                  <span className="badge badge-neutral">Đã hủy</span>
                                ) : (
                                  <span className="badge badge-danger">Chưa nộp</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                                {item.receiptNumber || '—'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Cashier Payment Action Toolbar */}
                {tuitionSummary.items && tuitionSummary.items.some((i) => i.status === 'UNPAID') && (
                  <div
                    style={{
                      padding: '20px 24px',
                      backgroundColor: 'var(--bg-main)',
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ fontSize: '0.95rem' }}>
                        Học phần cần thu:{' '}
                        <strong style={{ color: 'var(--primary)' }}>
                          {tuitionSummary.items.filter((i) => i.status === 'UNPAID').length}
                        </strong>{' '}
                        (100% môn chưa nộp)
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7' }}>
                        Tổng tiền thu 100%: {formatCurrency(tuitionSummary.unpaidAmount)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleOpenExtensionModal(selectedStudent)}
                        style={{
                          padding: '10px 16px',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderColor: '#f59e0b',
                          color: '#d97706',
                        }}
                        title="Cấp gia hạn nộp học phí 1 tuần cho sinh viên"
                      >
                        <Clock size={16} />
                        <span>Gia Hạn 1 Tuần</span>
                      </button>

                      <input
                        type="text"
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        placeholder="Ghi chú phiếu thu (tùy chọn)..."
                        className="form-control"
                        style={{ maxWidth: '240px', fontSize: '0.85rem' }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={paying}
                        onClick={handleCollectCash}
                        style={{
                          padding: '10px 24px',
                          fontSize: '1rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: '#0284c7',
                        }}
                      >
                        <DollarSign size={20} />
                        <span>{paying ? 'Đang xử lý...' : 'Xác Nhận Đã Thu Tiền Mặt (100%)'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OVERDUE TUITION SCANNER */}
      {activeTab === 'overdue' && (
        <div>
          {/* Overdue Action Toolbar */}
          <div
            className="card"
            style={{
              marginBottom: '20px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: '#dc2626' }} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Hạn chót đóng học phí:</span>
                <input
                  type="date"
                  value={customDeadline}
                  onChange={(e) => setCustomDeadline(e.target.value)}
                  className="form-control"
                  style={{ width: '160px', padding: '6px 10px' }}
                />
              </div>

              <button
                type="button"
                className="btn btn-outline"
                disabled={loadingOverdue}
                onClick={() => scanOverdue()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Search size={16} />
                <span>{loadingOverdue ? 'Đang quét...' : 'Quét Lại Danh Sách'}</span>
              </button>

              <button
                type="button"
                className="btn btn-outline"
                disabled={applyingHold || loadingOverdue}
                onClick={handleTriggerFinancialHolds}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: '#f59e0b', color: '#b45309' }}
                title="Quét và kích hoạt Đóng băng dịch vụ học vụ (FINANCIAL HOLD) theo Quy tắc liên thông B"
              >
                <Lock size={16} />
                <span>{applyingHold ? 'Đang kích hoạt...' : 'Kích Hoạt Financial Hold'}</span>
              </button>
            </div>

            {overdueStudents.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#dc2626', fontWeight: 600 }}>
                  Đã chọn {selectedOverdueInvoices.length} học phần nợ quá hạn
                </span>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={cancellingOverdue || selectedOverdueInvoices.length === 0}
                  onClick={handleCancelOverdue}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                >
                  <Ban size={16} />
                  <span>{cancellingOverdue ? 'Đang xử lý...' : 'Xử Lý Hủy Môn Quá Hạn'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Overdue Table */}
          <div className="card">
            <div
              className="card-header"
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#dc2626' }}>
                  Danh Sách Sinh Viên Quá Hạn Học Phí ({overdueStudents.length} Sinh viên)
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Hệ thống rà soát các sinh viên có học phần chưa thanh toán tiền mặt/học phí sau hạn chót
                </span>
              </div>

              {overdueStudents.length > 0 && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleToggleSelectAllOverdue}
                  style={{ fontSize: '0.82rem', padding: '4px 10px' }}
                >
                  {selectedOverdueInvoices.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              )}
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={
                          overdueStudents.length > 0 &&
                          selectedOverdueInvoices.length ===
                            overdueStudents.flatMap((s) => s.invoiceIds || []).length
                        }
                        onChange={handleToggleSelectAllOverdue}
                      />
                    </th>
                    <th>Mã sinh viên</th>
                    <th>Họ và tên</th>
                    <th>Lớp hành chính</th>
                    <th>Học phần chưa nộp tiền</th>
                    <th style={{ textAlign: 'center' }}>Số ngày quá hạn</th>
                    <th style={{ textAlign: 'center' }}>Chế tài Học vụ</th>
                    <th style={{ textAlign: 'right' }}>Tổng tiền nợ</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingOverdue ? (
                    <TableRowSkeleton columns={9} />
                  ) : overdueStudents.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                        <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 12px' }} />
                        <div style={{ fontWeight: 600, fontSize: '1rem', color: '#0f172a' }}>
                          Tuyệt vời! Không có sinh viên nào nợ học phí quá hạn.
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                          Toàn bộ sinh viên đã hoàn thành học phí hoặc chưa đến hạn chót hủy môn.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    overdueStudents.map((st) => {
                      const allSelected = (st.invoiceIds || []).every((id) =>
                        selectedOverdueInvoices.includes(id)
                      );
                      return (
                        <tr key={st.studentId}>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={() => {
                                const ids = st.invoiceIds || [];
                                if (allSelected) {
                                  setSelectedOverdueInvoices((prev) =>
                                    prev.filter((id) => !ids.includes(id))
                                  );
                                } else {
                                  setSelectedOverdueInvoices((prev) => [...new Set([...prev, ...ids])]);
                                }
                              }}
                            />
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                              {st.studentCode}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{st.fullName}</td>
                          <td>{st.className || 'Chưa xếp lớp'}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {st.overdueSections &&
                                st.overdueSections.map((sec, idx) => (
                                  <span key={idx} style={{ fontSize: '0.82rem', color: '#475569' }}>
                                    • {sec}
                                  </span>
                                ))}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="badge badge-danger">
                              {st.overdueDays > 0 ? `${st.overdueDays} ngày` : 'Hôm nay'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {st.financialHold ? (
                              <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                                <Lock size={12} /> FINANCIAL HOLD
                              </span>
                            ) : (
                              <span className="badge badge-secondary" style={{ color: 'var(--text-muted)' }}>
                                Bình thường
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                            {formatCurrency(st.totalOverdueAmount)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ padding: '3px 8px', fontSize: '0.8rem' }}
                              onClick={() => {
                                setActiveTab('cashier');
                                handleSelectStudent({
                                  id: st.studentId,
                                  studentCode: st.studentCode,
                                  fullName: st.fullName,
                                });
                              }}
                            >
                              Thu tiền ngay
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Extension Modal Dialog */}
      {extensionModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#fffbeb',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} style={{ color: '#d97706' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#92400e' }}>
                  Gia Hạn Nộp Học Phí Cho Sinh Viên
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseExtensionModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  color: '#64748b',
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitExtension} style={{ padding: '20px' }}>
              <div
                style={{
                  marginBottom: '16px',
                  padding: '12px 14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Sinh viên:</span>
                  <strong>{extensionTargetStudent?.fullName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Mã số SV:</span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>
                    {extensionTargetStudent?.studentCode}
                  </strong>
                </div>
                {(extensionTargetStudent?.unpaidAmount != null || tuitionSummary?.unpaidAmount != null) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Công nợ chưa nộp:</span>
                    <strong style={{ color: '#dc2626' }}>
                      {formatCurrency(
                        extensionTargetStudent?.unpaidAmount != null
                          ? extensionTargetStudent.unpaidAmount
                          : tuitionSummary?.unpaidAmount
                      )}
                    </strong>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px' }}>
                  Số ngày gia hạn thêm:
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={extensionDays}
                    onChange={(e) => setExtensionDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="form-control"
                    style={{ width: '100px', fontWeight: 700, fontSize: '1rem' }}
                    required
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    ngày (Mặc định 7 ngày = 1 tuần)
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Sinh viên được bảo lưu các học phần và miễn quét hủy môn tự động trong thời gian gia hạn này.
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px' }}>
                  Lý do gia hạn / Căn cứ đơn:
                </label>
                <textarea
                  rows="3"
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="Nhập lý do hoặc số hiệu đơn xin hoãn nộp học phí..."
                  className="form-control"
                  style={{ fontSize: '0.88rem', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCloseExtensionModal}
                  disabled={submittingExtension}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingExtension}
                  style={{
                    backgroundColor: '#d97706',
                    borderColor: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle size={16} />
                  <span>{submittingExtension ? 'Đang lưu...' : 'Xác Nhận Cấp Gia Hạn'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Cash Payment Modal */}
      {batchModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#ecfdf5',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={20} style={{ color: '#059669' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#065f46' }}>
                  Xác Nhận Thu Tiền Mặt Hàng Loạt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBatchModalOpen(false)}
                disabled={batchPaying}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  color: '#64748b',
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div
                style={{
                  marginBottom: '16px',
                  padding: '14px 16px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Học kỳ áp dụng:</span>
                  <strong>{activeSemester?.semesterName || 'Học kỳ hiện tại'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Số lượng sinh viên:</span>
                  <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>
                    {selectedRosterStudentIds.length} sinh viên
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Hình thức thanh toán:</span>
                  <span className="badge badge-success" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                    TIỀN MẶT (CASH)
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px dashed #cbd5e1',
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#334155' }}>Tổng tiền mặt cần thu:</span>
                  <strong style={{ color: '#059669', fontSize: '1.2rem' }}>
                    {formatCurrency(selectedBatchTotalAmount)}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  color: '#1e40af',
                  lineHeight: 1.5,
                  marginBottom: '20px',
                }}
              >
                ℹ️ <strong>Quy trình tự động sau khi xác nhận:</strong>
                <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                  <li>Gạch nợ 100% toàn bộ học phần trong kỳ của các sinh viên được chọn.</li>
                  <li>Tự động tạo mã phiếu thu riêng biệt (PT-...) lưu vào hồ sơ kế toán.</li>
                  <li>Gửi thông báo điện tử xác nhận nộp tiền mặt vào cổng sinh viên.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setBatchModalOpen(false)}
                  disabled={batchPaying}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmBatchCashPayment}
                  disabled={batchPaying}
                  style={{
                    backgroundColor: '#059669',
                    borderColor: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle size={16} />
                  <span>{batchPaying ? 'Đang xử lý...' : `Xác Nhận Thu ${formatCurrency(selectedBatchTotalAmount)}`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptData && (
        <ReceiptModal receipt={receiptData} onClose={() => setReceiptData(null)} />
      )}
    </div>
  );
}
