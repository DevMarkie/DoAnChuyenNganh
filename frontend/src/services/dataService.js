import api from './api';

export const authService = {
  login: (data) => api.post('/auth/login', data),
  changePassword: (data) => api.put('/auth/change-password', {
    currentPassword: data.currentPassword || data.oldPassword,
    newPassword: data.newPassword,
  }),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  sendResetOtp: (data) => api.post('/auth/forgot-password/send-otp', data),
  verifyResetOtp: (data) => api.post('/auth/forgot-password/verify-otp', data),
  logout: () => api.post('/auth/logout'),
};

export const departmentService = {
  getAll: () => api.get('/departments'),
  getActive: () => api.get('/departments/active'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  toggleActive: (id) => api.put(`/departments/${id}/toggle`),
  search: (keyword) => api.get('/departments/search', { params: { keyword } }),
};

export const classService = {
  getAll: () => api.get('/classes'),
  getById: (id) => api.get(`/classes/${id}`),
  getByDepartment: (deptId) => api.get(`/classes/department/${deptId}`),
  getStudents: (id) => api.get(`/classes/${id}/students`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  toggleActive: (id) => api.put(`/classes/${id}/toggle`),
  batchGenerate: (data) => api.post('/classes/batch-generate', data),
};

export const studentService = {
  getAll: () => api.get('/students'),
  getPaged: (params) => api.get('/students/paged', { params }),
  getById: (id) => api.get(`/students/${id}`),
  getMe: () => api.get('/students/me'),
  getByClass: (classId) => api.get(`/students/class/${classId}`),
  search: (keyword) => api.get('/students/search', { params: { keyword } }),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  updateStatus: (id, status) => api.put(`/students/${id}/status?status=${status}`),
  updateMyContact: (data) => api.put('/students/me/contact', data),
  getGraduationEligibility: (id) => api.get(`/students/${id}/graduation-eligibility`),
  getMyGraduationEligibility: () => api.get('/students/me/graduation-eligibility'),
  downloadImportTemplate: () => api.get('/students/import-template', { responseType: 'blob' }),
  importPreview: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/students/import-preview', formData);
  },
  importCommit: (data) => api.post('/students/import-commit', data),
  resetPassword: (id) => api.post(`/students/${id}/reset-password`),
};

export const lecturerService = {
  getAll: () => api.get('/lecturers'),
  getById: (id) => api.get(`/lecturers/${id}`),
  getMe: () => api.get('/lecturers/me'),
  create: (data) => api.post('/lecturers', data),
  update: (id, data) => api.put(`/lecturers/${id}`, data),
  toggleActive: (id) => api.put(`/lecturers/${id}/toggle`),
  resetPassword: (id) => api.post(`/lecturers/${id}/reset-password`),
};

export const subjectService = {
  getAll: () => api.get('/subjects'),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  toggleActive: (id) => api.put(`/subjects/${id}/toggle`),
};

export const semesterService = {
  getAll: () => api.get('/semesters'),
  getById: (id) => api.get(`/semesters/${id}`),
  getCurrent: () => api.get('/semesters/current'),
  create: (data) => api.post('/semesters', data),
  update: (id, data) => api.put(`/semesters/${id}`, data),
  setCurrent: (id) => api.put(`/semesters/${id}/set-current`),
  openRegistration: (id, params) => api.put(`/semesters/${id}/open-registration`, null, { params }),
  closeRegistration: (id) => api.put(`/semesters/${id}/close-registration`),
};

export const courseSectionService = {
  getAll: () => api.get('/course-sections'),
  getById: (id) => api.get(`/course-sections/${id}`),
  getBySemester: (semId) => api.get(`/course-sections/semester/${semId}`),
  getOpenBySemester: (semId) => api.get(`/course-sections/semester/${semId}/open`),
  getMySections: () => api.get('/course-sections/my-sections'),
  exportStudents: (id) => api.get(`/course-sections/${id}/export-students`, { responseType: 'blob' }),
  create: (data) => api.post('/course-sections', data),
  update: (id, data) => api.put(`/course-sections/${id}`, data),
};

export const enrollmentService = {
  getMyEnrollments: () => api.get('/enrollments/my'),
  getBySection: (sectionId) => api.get(`/enrollments/section/${sectionId}`),
  enroll: (data) => api.post('/enrollments', data),
  cancel: (id) => api.delete(`/enrollments/${id}`),
  enrollOverride: (studentId, sectionId) => api.post('/enrollments/override', null, { params: { studentId, sectionId } }),
  cancelOverride: (id) => api.delete(`/enrollments/${id}/override`),
  updateStatus: (id, status) => api.put(`/enrollments/${id}/status`, null, { params: { status } }),
};

export const gradeService = {
  getBySection: (sectionId) => api.get(`/grades/section/${sectionId}`),
  save: (data) => api.put('/grades', data),
  saveBatch: (data) => api.put('/grades/batch', data),
  submitOfficial: (sectionId) => api.post(`/grades/section/${sectionId}/submit-official`),
  exportExcel: (sectionId) => api.get(`/grades/section/${sectionId}/export`, { responseType: 'blob' }),
  // Task 4: tải file mẫu nhập điểm (đã điền sẵn roster) + xem trước file GV upload.
  downloadImportTemplate: (sectionId) => api.get(`/grades/section/${sectionId}/import-template`, { responseType: 'blob' }),
  importPreview: (sectionId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/grades/section/${sectionId}/import-preview`, formData);
  },
  importCommit: (sectionId, data) => api.put(`/grades/section/${sectionId}/import-commit`, data),
  getAdminOverview: (semesterId) => api.get('/grades/admin/overview', { params: semesterId ? { semesterId } : {} }),
  publishSection: (sectionId) => api.post(`/grades/section/${sectionId}/publish`),
  returnSection: (sectionId, reason) => api.post(`/grades/section/${sectionId}/return`, { reason }),
  unpublishSection: (sectionId, reason) => api.post(`/grades/section/${sectionId}/unpublish`, null, { params: reason ? { reason } : {} }),
  getSectionAuditLogs: (sectionId) => api.get(`/grades/section/${sectionId}/audit-logs`),
  getGradeAuditLogs: (gradeId) => api.get(`/grades/${gradeId}/audit-logs`),
  searchAdminAuditLogs: (params) => api.get('/admin/grade-audit-logs', { params }),
};

export const transcriptService = {
  getMyTranscript: () => api.get('/transcript/me'),
  getStudentTranscript: (studentId) => api.get(`/transcript/student/${studentId}`),
};

export const gradeAppealService = {
  create: (data) => api.post('/grade-appeals', data),
  getMine: () => api.get('/grade-appeals/my'),
  getAll: (params = {}) => api.get('/grade-appeals', { params }),
  assignGrader: (id, lecturerId) => api.put(`/grade-appeals/${id}/assign`, { lecturerId }),
  getAssignedTasks: () => api.get('/grade-appeals/assigned-tasks'),
  submitGrading: (id, data) => api.put(`/grade-appeals/${id}/submit-grading`, data),
  getDepartmentHeadAppeals: () => api.get('/grade-appeals/department-head'),
  headSign: (id, data) => api.put(`/grade-appeals/${id}/head-sign`, data),
  applyFinalAdjustment: (id, data) => api.put(`/grade-appeals/${id}/apply-final`, data),
  review: (id, data) => api.put(`/grade-appeals/${id}/review`, data),
  propose: (id, data) => api.put(`/grade-appeals/${id}/propose`, data),
  finalize: (id, data) => api.put(`/grade-appeals/${id}/finalize`, data),
};

export const graduationService = {
  evaluateCohort: (cohortId) => api.post(`/graduation/evaluate-cohort/${cohortId}`),
  getRecords: (params) => api.get('/graduation/records', { params }),
  approveRecord: (recordId, data) => api.post(`/graduation/records/${recordId}/approve`, data),
  batchApprove: (cohortId, data) => api.post(`/graduation/batch-approve/${cohortId}`, data),
};

export const curriculumService = {
  getMine: () => api.get('/curriculum/me'),
  getMyPrerequisiteGraph: () => api.get('/curriculum/me/prerequisite-graph'),
  getMyDegreeAudit: () => api.get('/curriculum/me/degree-audit'),
  getStudentPrerequisiteGraph: (studentId) => api.get(`/curriculum/student/${studentId}/prerequisite-graph`),
  getStudentDegreeAudit: (studentId) => api.get(`/curriculum/student/${studentId}/degree-audit`),
};

export const academicWarningService = {
  getAll: (params = {}) => api.get('/academic-warnings', { params }),
  scan: (semesterId) => api.post('/academic-warnings/scan', null, { params: semesterId ? { semesterId } : {} }),
};

export const scheduleService = {
  getAll: (params) => api.get('/schedules', { params }),
  getById: (id) => api.get(`/schedules/${id}`),
  getMySchedule: (params) => api.get('/schedules/my-schedule', { params }),
  getLecturerSchedule: (params) => api.get('/schedules/lecturer-schedule', { params }),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
};

export const dashboardService = {
  getDashboard: () => api.get('/dashboard'),
};

export const passwordResetService = {
  getAll: (status) => api.get('/admin/password-resets', { params: status ? { status } : {} }),
  getPendingCount: () => api.get('/admin/password-resets/pending-count'),
  approve: (id, data) => api.post(`/admin/password-resets/${id}/approve`, data),
  reject: (id, data) => api.post(`/admin/password-resets/${id}/reject`, data),
  batchApprove: (requestIds) => api.post('/admin/password-resets/batch-approve', requestIds),
  batchReject: (data) => api.post('/admin/password-resets/batch-reject', data),
};

export const notificationService = {
  getMyNotifications: (limit = 30) => api.get(`/notifications?limit=${limit}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const tuitionService = {
  getMyTuition: (semesterId) => api.get('/tuition/my', { params: typeof semesterId === 'object' && semesterId !== null ? semesterId : (semesterId ? { semesterId } : {}) }),
  simulatePay: (data) => api.post('/tuition/simulate-pay', data || {}),
  getOverview: (semesterId) => api.get('/admin/tuition/overview', { params: typeof semesterId === 'object' && semesterId !== null ? semesterId : (semesterId ? { semesterId } : {}) }),
  getStudentTuition: (studentId, semesterId) => api.get(`/admin/tuition/student/${studentId}`, { params: typeof semesterId === 'object' && semesterId !== null ? semesterId : (semesterId ? { semesterId } : {}) }),
  collectCash: (data) => api.post('/admin/tuition/collect-cash', data),
  collectBatchCash: (data) => api.post('/admin/tuition/collect-batch', data),
  extendDeadline: (data) => api.post('/admin/tuition/extend-deadline', data),
  scanOverdue: (params) => api.get('/admin/tuition/overdue', { params }),
  cancelOverdue: (invoiceIds) => api.post('/admin/tuition/cancel-overdue', invoiceIds),
  triggerFinancialHolds: () => api.post('/admin/tuition/trigger-financial-holds'),
};

export const attendanceService = {
  getSessions: (sectionId) => api.get(`/attendance/section/${sectionId}`),
  getLiveSession: (sectionId) => api.get(`/attendance/section/${sectionId}/live`),
  startSession: (data) => api.post('/attendance/session/start', data),
  saveSession: (data) => api.post('/attendance/session', data),
  checkIn: (data) => api.post('/attendance/check-in', data),
  getStudentToday: () => api.get('/attendance/student/today'),
};

export const examService = {
  createSession: (data) => api.post('/exam-sessions', data),
  getSessionsBySemester: (semesterId) => api.get(`/exam-sessions/semester/${semesterId}`),
  getSessionById: (id) => api.get(`/exam-sessions/${id}`),
  deleteSession: (id) => api.delete(`/exam-sessions/${id}`),
  autoAssignRooms: (sessionId, data) => api.post(`/exam-sessions/${sessionId}/auto-assign`, data),

  createRoom: (sessionId, data) => api.post(`/exam-sessions/${sessionId}/rooms`, data),
  getRoomsBySession: (sessionId) => api.get(`/exam-sessions/${sessionId}/rooms`),
  getRoomById: (id) => api.get(`/exam-rooms/${id}`),
  deleteRoom: (id) => api.delete(`/exam-rooms/${id}`),

  getRoster: (roomId) => api.get(`/exam-rooms/${roomId}/roster`),
  downloadTemplate: (roomId) => api.get(`/exam-rooms/${roomId}/export-template`, { responseType: 'blob' }),
  importPreview: (roomId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/exam-rooms/${roomId}/import-preview`, formData);
  },
  importCommit: (roomId, data) => api.post(`/exam-rooms/${roomId}/import-commit`, data),
  getAuditLogs: (roomId) => api.get(`/exam-rooms/${roomId}/audit-logs`),
};

export const studentConductService = {
  getAchievements: (params) => api.get('/student-conduct/achievements', { params }),
  createAchievement: (data) => api.post('/student-conduct/achievements', data),
  updateAchievement: (id, data) => api.put(`/student-conduct/achievements/${id}`, data),
  deleteAchievement: (id) => api.delete(`/student-conduct/achievements/${id}`),

  getTrainingPoints: (params) => api.get('/student-conduct/training-points', { params }),
  saveTrainingPoint: (data) => api.post('/student-conduct/training-points', data),
  deleteTrainingPoint: (id) => api.delete(`/student-conduct/training-points/${id}`),

  getMyAchievements: () => api.get('/student-conduct/me/achievements'),
  getMyTrainingPoints: () => api.get('/student-conduct/me/training-points'),
};

export const cohortService = {
  getAll: () => api.get('/cohorts'),
};

export const majorService = {
  getAll: () => api.get('/majors'),
  getByDepartment: (departmentId) => api.get(`/majors/department/${departmentId}`),
};

export const registrationWaveService = {
  getBySemester: (semesterId) => api.get(`/registration-waves/semester/${semesterId}`),
  getById: (id) => api.get(`/registration-waves/${id}`),
  create: (data) => api.post('/registration-waves', data),
  update: (id, data) => api.put(`/registration-waves/${id}`, data),
  delete: (id) => api.delete(`/registration-waves/${id}`),
  toggleActive: (id) => api.patch(`/registration-waves/${id}/toggle-active`),
  getMyStatus: () => api.get('/registration-waves/my-status'),
};

export const gradeAmendmentService = {
  uploadEvidence: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/uploads/evidence', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  create: (data) => api.post('/grade-amendments', data),
  getAll: (params) => api.get('/grade-amendments', { params }),
  getById: (id) => api.get(`/grade-amendments/${id}`),
  deptReview: (id, data) => api.put(`/grade-amendments/${id}/dept-review`, data),
  academicApproval: (id, data) => api.put(`/grade-amendments/${id}/academic-approval`, data),
};
