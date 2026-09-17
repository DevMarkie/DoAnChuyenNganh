import api from './api';

export const authService = {
  login: (data) => api.post('/auth/login', data),
  changePassword: (data) => api.put('/auth/change-password', {
    currentPassword: data.currentPassword || data.oldPassword,
    newPassword: data.newPassword,
  }),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
};

export const departmentService = {
  getAll: () => api.get('/departments'),
  getActive: () => api.get('/departments/active'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  toggleActive: (id) => api.put(`/departments/${id}/toggle`),
  search: (keyword) => api.get(`/departments/search?keyword=${keyword}`),
};

export const classService = {
  getAll: () => api.get('/classes'),
  getById: (id) => api.get(`/classes/${id}`),
  getByDepartment: (deptId) => api.get(`/classes/department/${deptId}`),
  getStudents: (id) => api.get(`/classes/${id}/students`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  toggleActive: (id) => api.put(`/classes/${id}/toggle`),
};

export const studentService = {
  getAll: () => api.get('/students'),
  getPaged: (params) => api.get('/students/paged', { params }),
  getById: (id) => api.get(`/students/${id}`),
  getMe: () => api.get('/students/me'),
  getByClass: (classId) => api.get(`/students/class/${classId}`),
  search: (keyword) => api.get(`/students/search?keyword=${keyword}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  updateStatus: (id, status) => api.put(`/students/${id}/status?status=${status}`),
};

export const lecturerService = {
  getAll: () => api.get('/lecturers'),
  getById: (id) => api.get(`/lecturers/${id}`),
  getMe: () => api.get('/lecturers/me'),
  search: (keyword) => api.get(`/lecturers/search?keyword=${keyword}`),
  create: (data) => api.post('/lecturers', data),
  update: (id, data) => api.put(`/lecturers/${id}`, data),
  toggleActive: (id) => api.put(`/lecturers/${id}/toggle`),
};

export const subjectService = {
  getAll: () => api.get('/subjects'),
  getById: (id) => api.get(`/subjects/${id}`),
  search: (keyword) => api.get(`/subjects/search?keyword=${keyword}`),
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
};

export const courseSectionService = {
  getAll: () => api.get('/course-sections'),
  getById: (id) => api.get(`/course-sections/${id}`),
  getBySemester: (semId) => api.get(`/course-sections/semester/${semId}`),
  getOpenBySemester: (semId) => api.get(`/course-sections/semester/${semId}/open`),
  getMySections: () => api.get('/course-sections/my-sections'),
  create: (data) => api.post('/course-sections', data),
  update: (id, data) => api.put(`/course-sections/${id}`, data),
};

export const enrollmentService = {
  getMyEnrollments: () => api.get('/enrollments/my'),
  getBySection: (sectionId) => api.get(`/enrollments/section/${sectionId}`),
  enroll: (data) => api.post('/enrollments', data),
  cancel: (id) => api.delete(`/enrollments/${id}`),
};

export const gradeService = {
  getBySection: (sectionId) => api.get(`/grades/section/${sectionId}`),
  save: (data) => api.put('/grades', data),
  saveBatch: (data) => api.put('/grades/batch', data),
  exportExcel: (sectionId) => api.get(`/grades/section/${sectionId}/export`, { responseType: 'blob' }),
};

export const transcriptService = {
  getMyTranscript: () => api.get('/transcript/me'),
  getStudentTranscript: (studentId) => api.get(`/transcript/student/${studentId}`),
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
