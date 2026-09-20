/**
 * Comprehensive System E2E & Integration Test Suite
 * Project: DevMarkie/DoAnChuyenNganh (Student Management System)
 * Stack: Spring Boot 3 + MySQL 8 + React 19
 */

const BASE_URL = 'http://localhost:8080/api';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  suites: {},
};

function logHeader(title) {
  console.log(`\n${colors.bright}${colors.blue}======================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  TEST SUITE: ${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}======================================================================${colors.reset}`);
}

async function runTest(suiteName, testName, testFn) {
  results.total++;
  if (!results.suites[suiteName]) {
    results.suites[suiteName] = { total: 0, passed: 0, failed: 0 };
  }
  results.suites[suiteName].total++;

  const start = Date.now();
  try {
    await testFn();
    const duration = Date.now() - start;
    results.passed++;
    results.suites[suiteName].passed++;
    console.log(`  ${colors.green}✓ PASS${colors.reset} [${duration}ms] ${testName}`);
    return true;
  } catch (err) {
    const duration = Date.now() - start;
    results.failed++;
    results.suites[suiteName].failed++;
    const errMsg = err.message || String(err);
    results.errors.push({ suite: suiteName, test: testName, error: errMsg });
    console.log(`  ${colors.red}✗ FAIL${colors.reset} [${duration}ms] ${testName}`);
    console.log(`    ${colors.yellow}Error: ${errMsg}${colors.reset}`);
    return false;
  }
}

async function apiRequest(endpoint, { method = 'GET', body = null, token = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return { status: response.status, ok: response.ok, data };
}

// Global state across test suites
let adminToken = null;
let lecturerToken = null;
let studentToken = null;
let adminUserId = null;
let lecturerUserId = null;
let studentUserId = null;
let createdDeptId = null;
let testSectionId = null;

async function runAllTests() {
  console.log(`${colors.bright}Starting Full System Integration & E2E Testing...${colors.reset}`);
  console.log(`Target: ${BASE_URL}\n`);

  // =========================================================================
  // SUITE 1: AUTHENTICATION & RBAC PERMISSIONS
  // =========================================================================
  logHeader('1. Authentication & Security (RBAC)');

  await runTest('1. Auth & RBAC', '1.1 Admin login with valid credentials (admin / 123456)', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: '123456' },
    });
    if (res.status !== 200 || !res.data.success || !res.data.data?.token) {
      throw new Error(`Login failed with status ${res.status}: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.role !== 'ADMIN') {
      throw new Error(`Expected role ADMIN, got ${res.data.data.role}`);
    }
    adminToken = res.data.data.token;
    adminUserId = res.data.data.userId;
  });

  await runTest('1. Auth & RBAC', '1.2 Lecturer login with valid credentials (1000001 / 123456)', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username: '1000001', password: '123456' },
    });
    if (res.status !== 200 || !res.data.success || !res.data.data?.token) {
      throw new Error(`Login failed with status ${res.status}: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.role !== 'LECTURER') {
      throw new Error(`Expected role LECTURER, got ${res.data.data.role}`);
    }
    lecturerToken = res.data.data.token;
    lecturerUserId = res.data.data.userId;
  });

  await runTest('1. Auth & RBAC', '1.3 Student login with valid credentials (2500001 / 123456)', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username: '2500001', password: '123456' },
    });
    if (res.status !== 200 || !res.data.success || !res.data.data?.token) {
      throw new Error(`Login failed with status ${res.status}: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.role !== 'STUDENT') {
      throw new Error(`Expected role STUDENT, got ${res.data.data.role}`);
    }
    studentToken = res.data.data.token;
    studentUserId = res.data.data.userId;
  });

  await runTest('1. Auth & RBAC', '1.4 Rejection of invalid password', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'wrongpassword' },
    });
    if (res.status === 200 && res.data.success) {
      throw new Error('Should have rejected invalid password');
    }
  });

  await runTest('1. Auth & RBAC', '1.5 Rejection of non-existent username', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username: 'user_does_not_exist_9999', password: 'password' },
    });
    if (res.status === 200 && res.data.success) {
      throw new Error('Should have rejected non-existent username');
    }
  });

  await runTest('1. Auth & RBAC', '1.6 Unauthenticated request to /api/dashboard blocked', async () => {
    const res = await apiRequest('/dashboard', { method: 'GET' });
    if (res.status === 200 && res.data.success) {
      throw new Error('Unauthenticated request was unexpectedly allowed');
    }
  });

  await runTest('1. Auth & RBAC', '1.7 RBAC: Student blocked from creating Department (403 Forbidden)', async () => {
    const res = await apiRequest('/departments', {
      method: 'POST',
      token: studentToken,
      body: { departmentCode: 'TEST_DEPT', departmentName: 'Khoa Test' },
    });
    if (res.status !== 403) {
      throw new Error(`Expected status 403 Forbidden, but got ${res.status}`);
    }
  });

  await runTest('1. Auth & RBAC', '1.8 RBAC: Lecturer blocked from creating Student (403 Forbidden)', async () => {
    const res = await apiRequest('/students', {
      method: 'POST',
      token: lecturerToken,
      body: { studentCode: 'TEST999', fullName: 'Sinh Vien Test' },
    });
    if (res.status !== 403) {
      throw new Error(`Expected status 403 Forbidden, but got ${res.status}`);
    }
  });

  await runTest('1. Auth & RBAC', '1.9 Malformed JWT rejected (401/403)', async () => {
    const res = await apiRequest('/dashboard', {
      method: 'GET',
      token: 'invalid.token.structure',
    });
    if (res.status === 200 && res.data.success) {
      throw new Error('Malformed token was accepted');
    }
  });

  // =========================================================================
  // SUITE 2: ADMIN MANAGEMENT & STATS
  // =========================================================================
  logHeader('2. Admin Management Features');

  await runTest('2. Admin Features', '2.1 Admin Dashboard statistics (/api/dashboard)', async () => {
    const res = await apiRequest('/dashboard', { token: adminToken });
    if (res.status !== 200 || !res.data.success || !res.data.data) {
      throw new Error(`Failed to get dashboard stats: ${JSON.stringify(res.data)}`);
    }
    const d = res.data.data;
    if (d.totalStudents === undefined || d.totalLecturers === undefined) {
      throw new Error('Dashboard stats missing totalStudents/totalLecturers');
    }
  });

  await runTest('2. Admin Features', '2.2 Get list of Departments (/api/departments)', async () => {
    const res = await apiRequest('/departments', { token: adminToken });
    if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.data)) {
      throw new Error(`Failed to list departments: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.length === 0) {
      throw new Error('Departments list is empty');
    }
  });

  await runTest('2. Admin Features', '2.3 Get list of Classes (/api/classes)', async () => {
    const res = await apiRequest('/classes', { token: adminToken });
    if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.data)) {
      throw new Error(`Failed to list classes: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.length === 0) {
      throw new Error('Classes list is empty');
    }
  });

  await runTest('2. Admin Features', '2.4 Get list of Subjects (/api/subjects)', async () => {
    const res = await apiRequest('/subjects', { token: adminToken });
    if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.data)) {
      throw new Error(`Failed to list subjects: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.length === 0) {
      throw new Error('Subjects list is empty');
    }
  });

  await runTest('2. Admin Features', '2.5 Get list of Semesters (/api/semesters)', async () => {
    const res = await apiRequest('/semesters', { token: adminToken });
    if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.data)) {
      throw new Error(`Failed to list semesters: ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('2. Admin Features', '2.6 Get list of Lecturers (/api/lecturers)', async () => {
    const res = await apiRequest('/lecturers', { token: adminToken });
    if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.data)) {
      throw new Error(`Failed to list lecturers: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.length === 0) {
      throw new Error('Lecturers list is empty');
    }
  });

  await runTest('2. Admin Features', '2.7 Get paginated Students (/api/students/paged)', async () => {
    const res = await apiRequest('/students/paged?page=0&size=10', { token: adminToken });
    if (res.status !== 200 || !res.data.success || !res.data.data?.content) {
      throw new Error(`Failed to get paged students: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.content.length === 0) {
      throw new Error('Paged students content is empty');
    }
  });

  await runTest('2. Admin Features', '2.8 Search student by keyword (/api/students/search)', async () => {
    const res = await apiRequest('/students/search?keyword=2500001', { token: adminToken });
    if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.data)) {
      throw new Error(`Failed to search students: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.length === 0) {
      throw new Error('Student search returned no results for 2500001');
    }
  });

  await runTest('2. Admin Features', '2.9 Get Course Sections (/api/course-sections)', async () => {
    const res = await apiRequest('/course-sections', { token: adminToken });
    if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.data)) {
      throw new Error(`Failed to list course sections: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.length > 0) {
      testSectionId = res.data.data[0].id;
    }
  });

  await runTest('2. Admin Features', '2.10 Get Schedules (/api/schedules)', async () => {
    const res = await apiRequest('/schedules', { token: adminToken });
    if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.data)) {
      throw new Error(`Failed to list schedules: ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('2. Admin Features', '2.11 Get Password Resets (/api/admin/password-resets)', async () => {
    const res = await apiRequest('/admin/password-resets', { token: adminToken });
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Failed to list password resets: ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('2. Admin Features', '2.12 CRUD: Create Department (/api/departments POST)', async () => {
    const code = 'TD' + Date.now().toString().slice(-4);
    const res = await apiRequest('/departments', {
      method: 'POST',
      token: adminToken,
      body: {
        code: code,
        name: 'Khoa Kiểm Thử ' + code,
        description: 'Phục vụ E2E Integration Test',
      },
    });
    if (res.status !== 200 || !res.data.success || !res.data.data?.id) {
      throw new Error(`Failed to create department: ${JSON.stringify(res.data)}`);
    }
    createdDeptId = res.data.data.id;
  });

  await runTest('2. Admin Features', '2.13 CRUD: Update Department (/api/departments PUT)', async () => {
    if (!createdDeptId) throw new Error('No createdDeptId to update');
    const code = 'TU' + Date.now().toString().slice(-4);
    const res = await apiRequest(`/departments/${createdDeptId}`, {
      method: 'PUT',
      token: adminToken,
      body: {
        code: code,
        name: 'Khoa Kiểm Thử Đã Cập Nhật ' + code,
        description: 'Đã cập nhật qua test',
      },
    });
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Failed to update department: ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('2. Admin Features', '2.14 CRUD: Toggle Department Active Status (/api/departments/{id}/toggle PUT)', async () => {
    if (!createdDeptId) throw new Error('No createdDeptId to toggle');
    const res = await apiRequest(`/departments/${createdDeptId}/toggle`, {
      method: 'PUT',
      token: adminToken,
    });
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Failed to toggle department: ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('2. Admin Features', '2.15 Create Subject with Validation (/api/subjects POST)', async () => {
    const code = 'SUB' + Date.now().toString().slice(-4);
    const res = await apiRequest('/subjects', {
      method: 'POST',
      token: adminToken,
      body: {
        subjectCode: code,
        subjectName: 'Môn Học Kiểm Thử ' + code,
        credits: 3,
        description: 'Mô tả môn học test',
        departmentId: 1,
      },
    });
    if (res.status !== 200 || !res.data.success || !res.data.data?.id) {
      throw new Error(`Failed to create subject: ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('2. Admin Features', '2.16 Subject Validation: Rejection of invalid credit (credits: 15 > 10)', async () => {
    const res = await apiRequest('/subjects', {
      method: 'POST',
      token: adminToken,
      body: {
        subjectCode: 'INV' + Date.now().toString().slice(-4),
        subjectName: 'Môn Không Hợp Lệ',
        credits: 15, // Invalid > 10
        departmentId: 1,
      },
    });
    if (res.status === 200 && res.data.success) {
      throw new Error('System allowed credits = 15 > 10');
    }
  });

  await runTest('2. Admin Features', '2.17 Create Administrative Class (/api/classes POST)', async () => {
    const code = 'K18_T' + Date.now().toString().slice(-3);
    const res = await apiRequest('/classes', {
      method: 'POST',
      token: adminToken,
      body: {
        code: code,
        name: 'Lớp Sinh Hoạt Test ' + code,
        departmentId: 1,
        academicYear: 'K18',
      },
    });
    if (res.status !== 200 || !res.data.success || !res.data.data?.id) {
      throw new Error(`Failed to create class: ${JSON.stringify(res.data)}`);
    }
  });

  // =========================================================================
  // SUITE 3: LECTURER MODULE & WORKFLOW
  // =========================================================================
  logHeader('3. Lecturer Features & Workflow');

  await runTest('3. Lecturer Features', '3.1 Get Lecturer Profile (/api/lecturers/me)', async () => {
    const res = await apiRequest('/lecturers/me', { token: lecturerToken });
    if (res.status !== 200 || !res.data.success || !res.data.data) {
      throw new Error(`Failed to get lecturer profile: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.lecturerCode !== '1000001') {
      throw new Error(`Expected lecturerCode 1000001, got ${res.data.data.lecturerCode}`);
    }
  });

  await runTest('3. Lecturer Features', '3.2 Get Lecturer Schedule (/api/schedules/lecturer-schedule)', async () => {
    const res = await apiRequest('/schedules/lecturer-schedule', { token: lecturerToken });
    if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.data)) {
      throw new Error(`Failed to get lecturer schedule: ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('3. Lecturer Features', '3.3 Get grades for a course section (/api/grades/section/{id})', async () => {
    if (!testSectionId) throw new Error('No test section available');
    const res = await apiRequest(`/grades/section/${testSectionId}`, { token: lecturerToken });
    if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.data)) {
      throw new Error(`Failed to get section grades: ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('3. Lecturer Features', '3.4 Grade Entry Validation: Score range [0, 10]', async () => {
    if (!testSectionId) throw new Error('No test section available');
    const enrollRes = await apiRequest(`/enrollments/section/${testSectionId}`, { token: lecturerToken });
    if (enrollRes.status === 200 && enrollRes.data.data?.length > 0) {
      const enrollmentId = enrollRes.data.data[0].id;
      const res = await apiRequest('/grades', {
        method: 'PUT',
        token: lecturerToken,
        body: {
          enrollmentId: enrollmentId,
          attendanceScore: 15.0, // INVALID: > 10.0
          midtermScore: 8.0,
          finalScore: 8.0,
        },
      });
      // Should reject invalid scores outside [0.0, 10.0]
      if (res.status === 200 && res.data.success) {
        throw new Error('System allowed attendance score 15.0 > 10.0!');
      }
    }
  });

  await runTest('3. Lecturer Features', '3.5 Export Course Section Grades to Excel (/api/grades/section/{id}/export)', async () => {
    if (!testSectionId) throw new Error('No test section available');
    const res = await fetch(`http://localhost:8080/api/grades/section/${testSectionId}/export`, {
      headers: { Authorization: `Bearer ${lecturerToken}` }
    });
    if (res.status !== 200) {
      throw new Error(`Excel export failed with status ${res.status}`);
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('spreadsheetml')) {
      throw new Error(`Expected spreadsheetml content-type, got ${contentType}`);
    }
  });

  await runTest('3. Lecturer Features', '3.6 Grade Locking (BR-07) & Lecturer Valid Score Entry', async () => {
    if (!testSectionId) throw new Error('No test section available');
    const enrollRes = await apiRequest(`/enrollments/section/${testSectionId}`, { token: lecturerToken });
    if (enrollRes.status === 200 && enrollRes.data.data?.length > 0) {
      const enrollmentId = enrollRes.data.data[0].id;

      // 1. First unlock or ensure grade is editable by Admin (finalize = false)
      await apiRequest('/grades', {
        method: 'PUT',
        token: adminToken,
        body: {
          enrollmentId: enrollmentId,
          attendanceScore: 9.0,
          midtermScore: 8.0,
          finalScore: 8.5,
          finalize: false,
        },
      });

      // 2. Lecturer now enters and saves grades
      const res = await apiRequest('/grades', {
        method: 'PUT',
        token: lecturerToken,
        body: {
          enrollmentId: enrollmentId,
          attendanceScore: 10.0,
          midtermScore: 8.5,
          finalScore: 9.0,
          finalize: false,
        },
      });

      if (res.status !== 200 || !res.data.success || !res.data.data) {
        throw new Error(`Grade save failed: ${JSON.stringify(res.data)}`);
      }
      const grade = res.data.data;
      if (grade.totalScore === undefined || grade.letterGrade === undefined) {
        throw new Error('Missing calculated totalScore or letterGrade');
      }

      // 3. Verify BR-07: When finalized, lecturer edit must be rejected
      await apiRequest('/grades', {
        method: 'PUT',
        token: adminToken,
        body: {
          enrollmentId: enrollmentId,
          attendanceScore: 10.0,
          midtermScore: 8.5,
          finalScore: 9.0,
          finalize: true, // LOCK GRADE
        },
      });

      const lockRes = await apiRequest('/grades', {
        method: 'PUT',
        token: lecturerToken,
        body: {
          enrollmentId: enrollmentId,
          attendanceScore: 7.0,
          midtermScore: 7.0,
          finalScore: 7.0,
        },
      });
      if (lockRes.status === 200 && lockRes.data.success) {
        throw new Error('Lecturer was able to edit a locked/finalized grade!');
      }
    }
  });

  // =========================================================================
  // SUITE 4: STUDENT MODULE & WORKFLOW
  // =========================================================================
  logHeader('4. Student Features & Workflow');

  await runTest('4. Student Features', '4.1 Get Student Profile (/api/students/me)', async () => {
    const res = await apiRequest('/students/me', { token: studentToken });
    if (res.status !== 200 || !res.data.success || !res.data.data) {
      throw new Error(`Failed to get student profile: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.studentCode !== '2500001') {
      throw new Error(`Expected studentCode 2500001, got ${res.data.data.studentCode}`);
    }
  });

  await runTest('4. Student Features', '4.2 Get Student Timetable (/api/schedules/my-schedule)', async () => {
    const res = await apiRequest('/schedules/my-schedule', { token: studentToken });
    if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.data)) {
      throw new Error(`Failed to get student schedule: ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('4. Student Features', '4.3 Get Student Enrollments (/api/enrollments/my)', async () => {
    const res = await apiRequest('/enrollments/my', { token: studentToken });
    if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.data)) {
      throw new Error(`Failed to get enrollments: ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('4. Student Features', '4.4 Get Student Transcript & GPA (/api/transcript/me)', async () => {
    const res = await apiRequest('/transcript/me', { token: studentToken });
    if (res.status !== 200 || !res.data.success || !res.data.data) {
      throw new Error(`Failed to get transcript: ${JSON.stringify(res.data)}`);
    }
    const transcript = res.data.data;
    if (transcript.cpa10 !== undefined || transcript.cpa4 !== undefined || transcript.semesters !== undefined) {
      // Valid GPA/CPA structure
    } else {
      throw new Error(`Unexpected transcript response structure: ${JSON.stringify(transcript)}`);
    }
  });

  await runTest('4. Student Features', '4.5 Request Password Reset & Admin Processing Workflow', async () => {
    // 1. First check if there is an existing pending request and process it as admin
    const listRes = await apiRequest('/admin/password-resets?status=PENDING', { token: adminToken });
    if (listRes.status === 200 && Array.isArray(listRes.data.data)) {
      for (const req of listRes.data.data) {
        if (req.user?.username === '2500001' || req.username === '2500001') {
          await apiRequest(`/admin/password-resets/${req.id}/reject`, {
            method: 'POST',
            token: adminToken,
            body: { rejectReason: 'Cleaned up by integration test suite' },
          });
        }
      }
    }

    // 2. Student now creates password reset request
    const res = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: {
        username: '2500001',
        email: '2500001@sv.sms.edu.vn',
        reason: 'Yêu cầu kiểm thử tự động hệ thống',
      },
    });
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Password reset request failed: ${JSON.stringify(res.data)}`);
    }

    // 3. Duplicate request must be rejected
    const dupRes = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: {
        username: '2500001',
        email: '2500001@sv.sms.edu.vn',
        reason: 'Yêu cầu trùng lặp',
      },
    });
    if (dupRes.status === 200 && dupRes.data.success) {
      throw new Error('System allowed duplicate pending password reset request!');
    }
  });

  // =========================================================================
  // SUITE 5: API DOCUMENTATION & SYSTEM HEALTH
  // =========================================================================
  logHeader('5. API Documentation & OpenAPI Specification');

  await runTest('5. System & Docs', '5.1 Swagger OpenAPI Spec is available (/api-docs)', async () => {
    const res = await fetch('http://localhost:8080/api-docs');
    if (res.status !== 200) {
      throw new Error(`OpenAPI docs returned status ${res.status}`);
    }
    const json = await res.json();
    if (!json.openapi && !json.swagger) {
      throw new Error('Not a valid OpenAPI/Swagger document');
    }
  });

  await runTest('5. System & Docs', '5.2 Swagger UI HTML page loads (/swagger-ui/index.html)', async () => {
    const res = await fetch('http://localhost:8080/swagger-ui/index.html');
    if (res.status !== 200) {
      throw new Error(`Swagger UI returned status ${res.status}`);
    }
  });

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log(`\n${colors.bright}${colors.blue}======================================================================${colors.reset}`);
  console.log(`${colors.bright}                      INTEGRATION TEST SUMMARY REPORT                 ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}======================================================================${colors.reset}`);
  console.log(`  Total Tests:    ${results.total}`);
  console.log(`  Passed:         ${colors.green}${results.passed}${colors.reset}`);
  console.log(`  Failed:         ${results.failed > 0 ? colors.red : colors.green}${results.failed}${colors.reset}`);
  console.log(`  Pass Rate:      ${((results.passed / results.total) * 100).toFixed(1)}%`);

  console.log('\nResults by Suite:');
  for (const [suite, stats] of Object.entries(results.suites)) {
    const rate = ((stats.passed / stats.total) * 100).toFixed(0);
    console.log(`  - ${suite.padEnd(30)}: ${stats.passed}/${stats.total} passed (${rate}%)`);
  }

  if (results.errors.length > 0) {
    console.log(`\n${colors.red}${colors.bright}FAILURES DETECTED (${results.errors.length}):${colors.reset}`);
    results.errors.forEach((err, idx) => {
      console.log(`  ${idx + 1}. [${err.suite}] ${err.test}`);
      console.log(`     Details: ${err.error}`);
    });
  } else {
    console.log(`\n${colors.green}${colors.bright}ALL TESTS PASSED! SYSTEM IS 100% HEALTHY AND READY FOR ACCESS!${colors.reset}`);
  }
  console.log(`${colors.bright}${colors.blue}======================================================================${colors.reset}\n`);

  return results;
}

runAllTests().then(res => {
  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(path.join(__dirname, 'test_result.json'), JSON.stringify(res, null, 2));
  process.exit(res.failed > 0 ? 1 : 0);
}).catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
