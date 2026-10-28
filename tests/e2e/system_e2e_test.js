/**
 * Comprehensive System E2E & Integration Test Suite
 * Project: DevMarkie/DoAnChuyenNganh (Student Management System)
 * Stack: Spring Boot 3 + MySQL 8 + React 19
 *
 * Requirements Verified:
 * 1. API: Request/Response returns correct HTTP status codes (200, 400, 401, 403, 404, 409, 500)
 *    and adheres strictly to ApiResponse<T> schema (success: boolean, message: string, data: T).
 * 2. Database: UI/API CRUD operations (INSERT, UPDATE, DELETE, SOFT-DELETE) correctly and completely
 *    persist data to MySQL tables, activating foreign keys, triggers (enrolled_count), and views.
 */

const db = require('../utils/db_helper');

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

async function apiRequest(endpoint, { method = 'GET', body = null, token = null, rawBody = null, headers = {} } = {}) {
  const reqHeaders = { 'Content-Type': 'application/json', ...headers };
  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers: reqHeaders,
  };
  if (rawBody !== null) {
    options.body = rawBody;
  } else if (body) {
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

  return { status: response.status, ok: response.ok, data, headers: response.headers };
}

/**
 * Validates that an API response adheres strictly to ApiResponse<T> schema and expected HTTP status.
 */
function assertApiResponse(res, expectedStatus, expectedDataType = null) {
  if (res.status !== expectedStatus) {
    throw new Error(`Expected HTTP status ${expectedStatus}, got ${res.status}. Response payload: ${JSON.stringify(res.data)}`);
  }
  // For standard 401/403 filter-level rejections or empty responses
  if (!res.data && (expectedStatus === 401 || expectedStatus === 403 || expectedStatus === 204)) {
    return;
  }
  if (!res.data || typeof res.data !== 'object') {
    throw new Error(`Response body is not a valid JSON object: ${res.data}`);
  }
  if (typeof res.data.success !== 'boolean') {
    throw new Error(`Response missing boolean 'success': ${JSON.stringify(res.data)}`);
  }
  if (typeof res.data.message !== 'string' || res.data.message.trim() === '') {
    throw new Error(`Response missing non-empty string 'message': ${JSON.stringify(res.data)}`);
  }
  if (expectedStatus >= 200 && expectedStatus < 300) {
    if (!res.data.success) {
      throw new Error(`Expected success=true for status ${expectedStatus}, but got false: ${res.data.message}`);
    }
  } else {
    if (res.data.success) {
      throw new Error(`Expected success=false for error status ${expectedStatus}, but got true`);
    }
  }

  if (expectedDataType) {
    if (expectedDataType === 'array') {
      if (!Array.isArray(res.data.data)) {
        throw new Error(`Expected data to be Array, got ${typeof res.data.data}`);
      }
    } else if (expectedDataType === 'object') {
      if (typeof res.data.data !== 'object' || res.data.data === null || Array.isArray(res.data.data)) {
        throw new Error(`Expected data to be Object, got ${typeof res.data.data}`);
      }
    } else if (expectedDataType === 'null') {
      if (res.data.data !== null && res.data.data !== undefined) {
        throw new Error(`Expected data to be null, got ${JSON.stringify(res.data.data)}`);
      }
    }
  }
}

/**
 * Validates that a database record exists and that expected columns match expected values.
 */
function assertDbRecord(sql, expectedFields) {
  const rows = db.queryDb(sql);
  if (!rows || rows.length === 0) {
    throw new Error(`No DB record found for query: ${sql}`);
  }
  const row = rows[0];
  for (const [key, val] of Object.entries(expectedFields)) {
    if (val === null) {
      if (row[key] !== null && row[key] !== undefined) {
        throw new Error(`DB Mismatch for column '${key}': expected NULL, got '${row[key]}' in query: ${sql}`);
      }
    } else {
      if (String(row[key]) !== String(val)) {
        throw new Error(`DB Mismatch for column '${key}': expected '${val}', got '${row[key]}' in query: ${sql}`);
      }
    }
  }
  return row;
}

// Global state across test suites
let adminToken = null;
let lecturerToken = null;
let studentToken = null;
let adminUserId = null;
let lecturerUserId = null;
let studentUserId = null;
let createdDeptId = null;
let createdSubId = null;
let createdClassId = null;
let testSectionId = null;

async function runAllTests() {
  console.log(`${colors.bright}Starting Full System Integration & E2E Testing...${colors.reset}`);
  console.log(`Target: ${BASE_URL}\n`);

  // =========================================================================
  // SUITE 1: AUTHENTICATION, RBAC & HTTP STATUS CODES (200, 400, 401, 403, 500)
  // =========================================================================
  logHeader('1. Authentication & Security (RBAC & Status Codes)');

  await runTest('1. Auth & RBAC', '1.1 Admin login with valid credentials (HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: '123456' },
    });
    assertApiResponse(res, 200, 'object');
    if (res.data.data.role !== 'ADMIN' || !res.data.data.token) {
      throw new Error(`Expected role ADMIN and token, got: ${JSON.stringify(res.data.data)}`);
    }
    adminToken = res.data.data.token;
    adminUserId = res.data.data.userId;
  });

  await runTest('1. Auth & RBAC', '1.2 Lecturer login with valid credentials (HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username: '1000001', password: '123456' },
    });
    assertApiResponse(res, 200, 'object');
    if (res.data.data.role !== 'LECTURER' || !res.data.data.token) {
      throw new Error(`Expected role LECTURER, got ${res.data.data.role}`);
    }
    lecturerToken = res.data.data.token;
    lecturerUserId = res.data.data.userId;
  });

  await runTest('1. Auth & RBAC', '1.3 Student login with valid credentials (HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username: '2500001', password: '123456' },
    });
    assertApiResponse(res, 200, 'object');
    if (res.data.data.role !== 'STUDENT' || !res.data.data.token) {
      throw new Error(`Expected role STUDENT, got ${res.data.data.role}`);
    }
    studentToken = res.data.data.token;
    studentUserId = res.data.data.userId;
  });

  await runTest('1. Auth & RBAC', '1.4 Rejection of invalid password (HTTP 400 + Schema)', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'wrongpassword' },
    });
    assertApiResponse(res, 400);
    if (!res.data.message.includes('Sai tên đăng nhập hoặc mật khẩu')) {
      throw new Error(`Expected login failure message, got: ${res.data.message}`);
    }
  });

  await runTest('1. Auth & RBAC', '1.5 Rejection of non-existent username (HTTP 400 + Schema)', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username: 'user_does_not_exist_9999', password: 'password' },
    });
    assertApiResponse(res, 400);
    if (!res.data.message.includes('Sai tên đăng nhập hoặc mật khẩu')) {
      throw new Error(`Expected login failure message, got: ${res.data.message}`);
    }
  });

  await runTest('1. Auth & RBAC', '1.6 Unauthenticated request to protected endpoint (HTTP 401/403)', async () => {
    const res = await apiRequest('/dashboard', { method: 'GET' });
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401/403 for unauthenticated request, got ${res.status}`);
    }
    if (res.data && typeof res.data === 'object') {
      if (res.data.success !== false) throw new Error('Expected success=false for unauthorized request');
    }
  });

  await runTest('1. Auth & RBAC', '1.7 RBAC: Student blocked from creating Department (HTTP 403 + Schema)', async () => {
    const res = await apiRequest('/departments', {
      method: 'POST',
      token: studentToken,
      body: { code: 'TEST_DEPT', name: 'Khoa Test' },
    });
    assertApiResponse(res, 403);
  });

  await runTest('1. Auth & RBAC', '1.8 RBAC: Lecturer blocked from creating Student (HTTP 403 + Schema)', async () => {
    const res = await apiRequest('/students', {
      method: 'POST',
      token: lecturerToken,
      body: { studentCode: 'TEST999', fullName: 'Sinh Vien Test' },
    });
    assertApiResponse(res, 403);
  });

  await runTest('1. Auth & RBAC', '1.9 Malformed JWT rejected (HTTP 401/403)', async () => {
    const res = await apiRequest('/dashboard', {
      method: 'GET',
      token: 'invalid.token.structure',
    });
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401 or 403 for malformed JWT, got ${res.status}`);
    }
  });

  await runTest('1. Auth & RBAC', '1.10 Malformed JSON body rejected (HTTP 400 + Schema)', async () => {
    const res = await apiRequest('/departments', {
      method: 'POST',
      token: adminToken,
      rawBody: '{ "code": "BAD_JSON", ', // Invalid JSON syntax
    });
    assertApiResponse(res, 400);
    if (!res.data.message.includes('định dạng JSON')) {
      throw new Error(`Expected malformed JSON message, got: ${res.data.message}`);
    }
  });

  await runTest('1. Auth & RBAC', '1.11 Type mismatch parameter rejected (HTTP 400 + Schema)', async () => {
    const res = await apiRequest('/departments/abc_not_a_number/toggle', {
      method: 'PUT',
      token: adminToken,
    });
    assertApiResponse(res, 400);
    if (!res.data.message.includes('không đúng định dạng')) {
      throw new Error(`Expected type mismatch message, got: ${res.data.message}`);
    }
  });

  await runTest('1. Auth & RBAC', '1.12 Server exception masking: No internal stack trace leak', async () => {
    // Calling non-existent or edge route should never leak Java traces
    const res = await apiRequest('/departments/99999999', {
      method: 'GET',
      token: adminToken,
    });
    if (res.status === 404 || res.status === 400) {
      assertApiResponse(res, res.status);
    } else if (res.status === 500) {
      assertApiResponse(res, 500);
      if (res.data.message.includes('Exception') || res.data.message.includes('at com.sms')) {
        throw new Error('Raw Java stack trace leaked in 500 response!');
      }
    }
  });

  // =========================================================================
  // SUITE 2: ADMIN MANAGEMENT FEATURES & DATABASE CRUD PERSISTENCE
  // =========================================================================
  logHeader('2. Admin Management Features & Database CRUD Persistence');

  await runTest('2. Admin Features', '2.1 Admin Dashboard statistics (/api/dashboard HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/dashboard', { token: adminToken });
    assertApiResponse(res, 200, 'object');
    const d = res.data.data;
    if (d.totalStudents === undefined || d.totalLecturers === undefined) {
      throw new Error('Dashboard stats missing totalStudents/totalLecturers');
    }
  });

  await runTest('2. Admin Features', '2.2 Get list of Departments (/api/departments HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/departments', { token: adminToken });
    assertApiResponse(res, 200, 'array');
    if (res.data.data.length === 0) throw new Error('Departments list is empty');
  });

  await runTest('2. Admin Features', '2.3 Get list of Classes (/api/classes HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/classes', { token: adminToken });
    assertApiResponse(res, 200, 'array');
    if (res.data.data.length === 0) throw new Error('Classes list is empty');
  });

  await runTest('2. Admin Features', '2.4 Get list of Subjects (/api/subjects HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/subjects', { token: adminToken });
    assertApiResponse(res, 200, 'array');
    if (res.data.data.length === 0) throw new Error('Subjects list is empty');
  });

  await runTest('2. Admin Features', '2.5 Get list of Semesters (/api/semesters HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/semesters', { token: adminToken });
    assertApiResponse(res, 200, 'array');
    if (res.data.data.length === 0) throw new Error('Semesters list is empty');
  });

  await runTest('2. Admin Features', '2.6 Get list of Lecturers (/api/lecturers HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/lecturers', { token: adminToken });
    assertApiResponse(res, 200, 'array');
    if (res.data.data.length === 0) throw new Error('Lecturers list is empty');
  });

  await runTest('2. Admin Features', '2.7 Get paginated Students (/api/students/paged HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/students/paged?page=0&size=10', { token: adminToken });
    assertApiResponse(res, 200, 'object');
    if (!Array.isArray(res.data.data.content)) throw new Error('Expected content array in paged response');
  });

  await runTest('2. Admin Features', '2.8 Search student by keyword (/api/students/search HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/students/search?keyword=2500001', { token: adminToken });
    assertApiResponse(res, 200, 'array');
  });

  await runTest('2. Admin Features', '2.9 Get Course Sections (/api/course-sections HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/course-sections', { token: adminToken });
    assertApiResponse(res, 200, 'array');
    if (res.data.data.length > 0) {
      testSectionId = res.data.data[0].id;
    }
  });

  await runTest('2. Admin Features', '2.10 Get Schedules (/api/schedules HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/schedules', { token: adminToken });
    assertApiResponse(res, 200, 'array');
  });

  await runTest('2. Admin Features', '2.11 Get Password Resets (/api/admin/password-resets HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/admin/password-resets', { token: adminToken });
    assertApiResponse(res, 200, 'array');
  });

  let createdDeptCode = null;
  await runTest('2. Admin Features', '2.12 CRUD & DB Persistence: Create Department (INSERT verified)', async () => {
    createdDeptCode = 'TD' + Date.now().toString().slice(-4);
    const name = 'Khoa Kiểm Thử ' + createdDeptCode;
    const res = await apiRequest('/departments', {
      method: 'POST',
      token: adminToken,
      body: {
        code: createdDeptCode,
        name: name,
        description: 'Phục vụ E2E Integration Test',
      },
    });
    assertApiResponse(res, 200, 'object');
    createdDeptId = res.data.data.id;

    // Verify DB Persistence directly in MySQL
    assertDbRecord(`SELECT code, name, is_active FROM departments WHERE id = ${createdDeptId}`, {
      code: createdDeptCode,
      name: name,
      is_active: '1',
    });
  });

  await runTest('2. Admin Features', '2.12b Duplicate Code Violation: Reject existing code (HTTP 409 + Schema)', async () => {
    // Attempt to create department with same existing code
    const existing = db.queryDb('SELECT code, name FROM departments LIMIT 1')[0];
    const res = await apiRequest('/departments', {
      method: 'POST',
      token: adminToken,
      body: {
        code: existing.code,
        name: 'Trùng mã ' + Date.now(),
        description: 'Test duplicate',
      },
    });
    // Spring Boot returns 409 Conflict via DataIntegrityViolationException
    if (res.status !== 409 && res.status !== 400) {
      throw new Error(`Expected 409 Conflict or 400 Bad Request for duplicate key, got ${res.status}`);
    }
    assertApiResponse(res, res.status);
  });

  await runTest('2. Admin Features', '2.13 CRUD & DB Persistence: Update Department (UPDATE verified)', async () => {
    if (!createdDeptId) throw new Error('No createdDeptId to update');
    const updatedName = 'Khoa Kiểm Thử Cập Nhật ' + Date.now().toString().slice(-4);
    const res = await apiRequest(`/departments/${createdDeptId}`, {
      method: 'PUT',
      token: adminToken,
      body: {
        code: createdDeptCode,
        name: updatedName,
        description: 'Đã cập nhật qua test',
      },
    });
    assertApiResponse(res, 200, 'object');

    // Verify DB Persistence: name updated, code untouched
    assertDbRecord(`SELECT name FROM departments WHERE id = ${createdDeptId}`, {
      name: updatedName,
    });
  });

  await runTest('2. Admin Features', '2.14 CRUD & DB Persistence: Toggle Active Status (Soft-Delete verified)', async () => {
    if (!createdDeptId) throw new Error('No createdDeptId to toggle');
    const res = await apiRequest(`/departments/${createdDeptId}/toggle`, {
      method: 'PUT',
      token: adminToken,
    });
    assertApiResponse(res, 200);

    // Verify DB Persistence: is_active toggled to 0
    assertDbRecord(`SELECT is_active FROM departments WHERE id = ${createdDeptId}`, {
      is_active: '0',
    });

    // Cleanup temporary department
    db.executeSql(`DELETE FROM departments WHERE id = ${createdDeptId};`);
  });

  await runTest('2. Admin Features', '2.15 CRUD & DB Persistence: Create Subject (INSERT verified)', async () => {
    const code = 'SUB' + Date.now().toString().slice(-4);
    const subName = 'Môn Học Test ' + code;
    const res = await apiRequest('/subjects', {
      method: 'POST',
      token: adminToken,
      body: {
        subjectCode: code,
        subjectName: subName,
        credits: 3,
        description: 'Mô tả môn học test',
        departmentId: 1,
      },
    });
    assertApiResponse(res, 200, 'object');
    createdSubId = res.data.data.id;

    // Verify DB Persistence directly in MySQL
    assertDbRecord(`SELECT subject_code, subject_name, credits, department_id, is_active FROM subjects WHERE id = ${createdSubId}`, {
      subject_code: code,
      subject_name: subName,
      credits: '3',
      department_id: '1',
      is_active: '1',
    });

    // Cleanup temporary subject
    db.executeSql(`DELETE FROM subjects WHERE id = ${createdSubId};`);
  });

  await runTest('2. Admin Features', '2.16 Subject Validation Boundaries (HTTP 400 + Schema)', async () => {
    // Test 1: Credits > 10 (15)
    const res1 = await apiRequest('/subjects', {
      method: 'POST',
      token: adminToken,
      body: {
        subjectCode: 'INV1' + Date.now().toString().slice(-3),
        subjectName: 'Môn Quá Tín Chỉ',
        credits: 15,
        departmentId: 1,
      },
    });
    assertApiResponse(res1, 400);

    // Test 2: Credits <= 0 (0)
    const res2 = await apiRequest('/subjects', {
      method: 'POST',
      token: adminToken,
      body: {
        subjectCode: 'INV2' + Date.now().toString().slice(-3),
        subjectName: 'Môn Không Tín Chỉ',
        credits: 0,
        departmentId: 1,
      },
    });
    assertApiResponse(res2, 400);

    // Test 3: Empty subjectName
    const res3 = await apiRequest('/subjects', {
      method: 'POST',
      token: adminToken,
      body: {
        subjectCode: 'INV3' + Date.now().toString().slice(-3),
        subjectName: '',
        credits: 3,
        departmentId: 1,
      },
    });
    assertApiResponse(res3, 400);
  });

  await runTest('2. Admin Features', '2.17 CRUD & DB Persistence: Create Administrative Class (INSERT verified)', async () => {
    const code = 'K18_T' + Date.now().toString().slice(-3);
    const className = 'Lớp Sinh Hoạt Test ' + code;
    const res = await apiRequest('/classes', {
      method: 'POST',
      token: adminToken,
      body: {
        code: code,
        name: className,
        departmentId: 1,
        academicYear: 'K18',
      },
    });
    assertApiResponse(res, 200, 'object');
    createdClassId = res.data.data.id;

    // Verify DB Persistence directly in MySQL
    assertDbRecord(`SELECT code, name, department_id, academic_year, is_active FROM classes WHERE id = ${createdClassId}`, {
      code: code,
      name: className,
      department_id: '1',
      academic_year: 'K18',
      is_active: '1',
    });

    // Cleanup temporary class
    db.executeSql(`DELETE FROM classes WHERE id = ${createdClassId};`);
  });

  await runTest('2. Admin Features', '2.18 CRUD & DB Persistence: Create & Delete Schedule (Physical DELETE verified)', async () => {
    if (!testSectionId) throw new Error('No testSectionId available for schedule test');
    const roomName = 'TEST-' + Date.now().toString().slice(-3);
    const resCreate = await apiRequest('/schedules', {
      method: 'POST',
      token: adminToken,
      body: {
        sectionId: testSectionId,
        dayOfWeek: 7, // Sunday to avoid weekday conflict
        startPeriod: 10,
        endPeriod: 12,
        room: roomName,
        startDate: '2026-09-01',
        endDate: '2027-01-15',
      },
    });
    assertApiResponse(resCreate, 200, 'object');
    const schedId = resCreate.data.data.id;

    // Verify DB Persistence of Schedule
    assertDbRecord(`SELECT room, day_of_week, start_period, end_period FROM schedules WHERE id = ${schedId}`, {
      room: roomName,
      day_of_week: '7',
      start_period: '10',
      end_period: '12',
    });

    // Delete schedule
    const resDelete = await apiRequest(`/schedules/${schedId}`, {
      method: 'DELETE',
      token: adminToken,
    });
    assertApiResponse(resDelete, 200);

    // Verify physical delete from DB (count must be 0)
    const count = db.queryScalar(`SELECT COUNT(*) FROM schedules WHERE id = ${schedId}`);
    if (String(count) !== '0') {
      throw new Error(`Schedule with id ${schedId} was not physically deleted from database! Count: ${count}`);
    }
  });

  // =========================================================================
  // SUITE 3: LECTURER FEATURES & WORKFLOW
  // =========================================================================
  logHeader('3. Lecturer Features & Workflow');

  await runTest('3. Lecturer Features', '3.1 Get Lecturer Profile (/api/lecturers/me HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/lecturers/me', { token: lecturerToken });
    assertApiResponse(res, 200, 'object');
    if (res.data.data.lecturerCode !== '1000001') {
      throw new Error(`Expected lecturerCode 1000001, got ${res.data.data.lecturerCode}`);
    }
  });

  await runTest('3. Lecturer Features', '3.2 Get Lecturer Schedule (/api/schedules/lecturer-schedule HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/schedules/lecturer-schedule', { token: lecturerToken });
    assertApiResponse(res, 200, 'array');
  });

  await runTest('3. Lecturer Features', '3.3 Get grades for a course section (/api/grades/section/{id} HTTP 200 + Schema)', async () => {
    if (!testSectionId) throw new Error('No test section available');
    const res = await apiRequest(`/grades/section/${testSectionId}`, { token: lecturerToken });
    assertApiResponse(res, 200, 'array');
  });

  await runTest('3. Lecturer Features', '3.4 Grade Entry Validation: Reject invalid scores (HTTP 400 + Schema)', async () => {
    if (!testSectionId) throw new Error('No test section available');
    const enrollRes = await apiRequest(`/enrollments/section/${testSectionId}`, { token: lecturerToken });
    if (enrollRes.status === 200 && enrollRes.data.data?.length > 0) {
      const enrollmentId = enrollRes.data.data[0].id;

      // Score > 10.0 (15.0)
      const res1 = await apiRequest('/grades', {
        method: 'PUT',
        token: lecturerToken,
        body: {
          enrollmentId: enrollmentId,
          cc1Score: 15.0,
          cc2Score: 10.0,
          midtermScore: 8.0,
          finalScore: 8.0,
        },
      });
      assertApiResponse(res1, 400);

      // Score < 0.0 (-2.0)
      const res2 = await apiRequest('/grades', {
        method: 'PUT',
        token: lecturerToken,
        body: {
          enrollmentId: enrollmentId,
          cc1Score: -2.0,
          cc2Score: 10.0,
          midtermScore: 8.0,
          finalScore: 8.0,
        },
      });
      assertApiResponse(res2, 400);
    }
  });

  await runTest('3. Lecturer Features', '3.5 Export Course Section Grades to Excel (HTTP 200 + Content-Type)', async () => {
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

  await runTest('3. Lecturer Features', '3.6 Grade Calculation, DB Persistence & Locking (BR-07)', async () => {
    if (!testSectionId) throw new Error('No test section available');
    const enrollRes = await apiRequest(`/enrollments/section/${testSectionId}`, { token: lecturerToken });
    if (enrollRes.status === 200 && enrollRes.data.data?.length > 0) {
      const enrollmentId = enrollRes.data.data[0].id;

      // 1. Ensure grade is unlocked
      await apiRequest('/grades', {
        method: 'PUT',
        token: adminToken,
        body: {
          enrollmentId: enrollmentId,
          cc1Score: 9.0,
          cc2Score: 9.0,
          midtermScore: 8.0,
          finalScore: 8.5,
          finalize: false,
        },
      });

      // 2. Lecturer enters and saves coursework grades (BR-Exam02: final score input restricted to Exam Office/Admin)
      const res = await apiRequest('/grades', {
        method: 'PUT',
        token: lecturerToken,
        body: {
          enrollmentId: enrollmentId,
          cc1Score: 10.0,
          cc2Score: 10.0,
          midtermScore: 8.5,
          finalize: false,
        },
      });
      assertApiResponse(res, 200, 'object');

      // Verify DB Persistence: exact values and calculation stored in MySQL
      const gradeRow = assertDbRecord(`SELECT cc1_score, cc2_score, midterm_score, final_score, total_score, letter_grade, is_finalized FROM grades WHERE enrollment_id = ${enrollmentId}`, {
        is_finalized: '0',
      });
      if (parseFloat(gradeRow.total_score) <= 0) {
        throw new Error(`Expected positive total_score in DB, got ${gradeRow.total_score}`);
      }

      // 3. Lock grade (finalize = true)
      await apiRequest('/grades', {
        method: 'PUT',
        token: adminToken,
        body: {
          enrollmentId: enrollmentId,
          cc1Score: 10.0,
          cc2Score: 10.0,
          midtermScore: 8.5,
          finalScore: 9.0,
          finalize: true,
        },
      });

      // Verify DB Persistence: is_finalized = 1
      assertDbRecord(`SELECT is_finalized FROM grades WHERE enrollment_id = ${enrollmentId}`, {
        is_finalized: '1',
      });

      // Simulate 7-day grace window expiry
      db.executeSql(`UPDATE grades SET finalized_at = DATE_SUB(NOW(), INTERVAL 8 DAY) WHERE enrollment_id = ${enrollmentId};`);

      // Lecturer editing finalized grade must be blocked with HTTP 400
      const lockRes = await apiRequest('/grades', {
        method: 'PUT',
        token: lecturerToken,
        body: {
          enrollmentId: enrollmentId,
          cc1Score: 7.0,
          cc2Score: 7.0,
          midtermScore: 7.0,
          finalScore: 7.0,
        },
      });
      assertApiResponse(lockRes, 400);

      // Restore enrollment original grade
      db.executeSql(`UPDATE grades SET cc1_score = 9.5, cc2_score = 9.5, midterm_score = 8.0, final_score = 8.0, total_score = 8.15, letter_grade = 'B+', gpa_point = 3.5, is_finalized = 1, finalized_at = '2025-01-15 10:00:00' WHERE enrollment_id = ${enrollmentId};`);
    }
  });

  // =========================================================================
  // SUITE 4: STUDENT FEATURES, REGISTRATION & ATOMIC SIZES
  // =========================================================================
  logHeader('4. Student Features & Registration Atomic Sizing');

  await runTest('4. Student Features', '4.1 Get Student Profile (/api/students/me HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/students/me', { token: studentToken });
    assertApiResponse(res, 200, 'object');
    if (res.data.data.studentCode !== '2500001') {
      throw new Error(`Expected studentCode 2500001, got ${res.data.data.studentCode}`);
    }
  });

  await runTest('4. Student Features', '4.2 Get Student Timetable (/api/schedules/my-schedule HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/schedules/my-schedule', { token: studentToken });
    assertApiResponse(res, 200, 'array');
  });

  await runTest('4. Student Features', '4.3 Get Student Enrollments (/api/enrollments/my HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/enrollments/my', { token: studentToken });
    assertApiResponse(res, 200, 'array');
  });

  let testEnrollSectionId = null;
  let testEnrollmentId = null;

  await runTest('4. Student Features', '4.3b Course Enrollment Persistence & Atomic Increment (+1 enrolled_count verified)', async () => {
    // 0. Ensure registration gate is open for current semester (4)
    await apiRequest('/semesters/4/open-registration?days=14', {
      method: 'PUT',
      token: adminToken,
    });

    // 1. Admin creates an open section for CS203 (in curriculum, no prerequisites) in current semester (4)
    const secCode = 'CS203-T' + Date.now().toString().slice(-4);
    const secRes = await apiRequest('/course-sections', {
      method: 'POST',
      token: adminToken,
      body: {
        sectionCode: secCode,
        subjectId: 9, // CS203
        semesterId: 4, // Current semester
        lecturerId: 1,
        maxStudents: 45,
        room: '501-A2',
        status: 'OPEN',
      },
    });
    assertApiResponse(secRes, 200, 'object');
    testEnrollSectionId = secRes.data.data.id;

    // Verify initial enrolled_count in DB is 0
    assertDbRecord(`SELECT enrolled_count FROM course_sections WHERE id = ${testEnrollSectionId}`, {
      enrolled_count: '0',
    });

    // 2. Student enrolls in this section
    const enrollRes = await apiRequest('/enrollments', {
      method: 'POST',
      token: studentToken,
      body: { sectionId: testEnrollSectionId },
    });
    assertApiResponse(enrollRes, 200, 'object');
    testEnrollmentId = enrollRes.data.data.id;

    // 3. Verify DB Persistence:
    // a. enrollments row has status = 'ENROLLED'
    assertDbRecord(`SELECT status, section_id FROM enrollments WHERE id = ${testEnrollmentId}`, {
      status: 'ENROLLED',
      section_id: String(testEnrollSectionId),
    });

    // b. verify no grades row is created yet (allowing cancellation)
    const gradeCount = db.queryScalar(`SELECT COUNT(*) FROM grades WHERE enrollment_id = ${testEnrollmentId}`);
    if (String(gradeCount) !== '0') {
      throw new Error(`Expected 0 initialized grade record before lecturer enters grades (to allow cancellation), got ${gradeCount}`);
    }

    // c. Atomic SQL incremented enrolled_count to 1
    assertDbRecord(`SELECT enrolled_count FROM course_sections WHERE id = ${testEnrollSectionId}`, {
      enrolled_count: '1',
    });
  });

  await runTest('4. Student Features', '4.3c Course Cancellation Persistence & Atomic Decrement (-1 enrolled_count verified)', async () => {
    if (!testEnrollmentId || !testEnrollSectionId) {
      throw new Error('No testEnrollmentId / testEnrollSectionId available for cancellation test');
    }

    // Student cancels enrollment
    const cancelRes = await apiRequest(`/enrollments/${testEnrollmentId}`, {
      method: 'DELETE',
      token: studentToken,
    });
    assertApiResponse(cancelRes, 200);

    // Verify DB Persistence: enrollments status changed to 'CANCELLED'
    assertDbRecord(`SELECT status FROM enrollments WHERE id = ${testEnrollmentId}`, {
      status: 'CANCELLED',
    });

    // Verify Atomic SQL decremented enrolled_count back to 0
    assertDbRecord(`SELECT enrolled_count FROM course_sections WHERE id = ${testEnrollSectionId}`, {
      enrolled_count: '0',
    });

    // Clean up temporary section and enrollment
    db.executeSql(`DELETE FROM student_invoices WHERE section_id = ${testEnrollSectionId}; DELETE FROM grades WHERE enrollment_id = ${testEnrollmentId}; DELETE FROM enrollments WHERE id = ${testEnrollmentId}; DELETE FROM course_sections WHERE id = ${testEnrollSectionId};`);
  });

  await runTest('4. Student Features', '4.4 Get Student Transcript & GPA (/api/transcript/me HTTP 200 + Schema)', async () => {
    const res = await apiRequest('/transcript/me', { token: studentToken });
    assertApiResponse(res, 200, 'object');
    const transcript = res.data.data;
    if (transcript.cpa10 === undefined && transcript.cpa4 === undefined && transcript.semesters === undefined) {
      throw new Error(`Unexpected transcript response structure: ${JSON.stringify(transcript)}`);
    }
  });

  await runTest('4. Student Features', '4.5 Password Reset Lifecycle & DB Persistence (INSERT & UPDATE verified)', async () => {
    // 1. Clean up existing pending requests for user 2500001
    db.executeSql("DELETE FROM password_reset_requests WHERE user_id = (SELECT id FROM users WHERE username = '2500001');");

    // 2. Student requests password reset
    const res = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: {
        username: '2500001',
        email: '2500001@sv.sms.edu.vn',
        reason: 'Yêu cầu kiểm thử tự động hệ thống',
      },
    });
    assertApiResponse(res, 200);

    // Verify DB Persistence: request created with status = 'PENDING'
    const resetReq = assertDbRecord(
      "SELECT id, status FROM password_reset_requests WHERE user_id = (SELECT id FROM users WHERE username = '2500001') ORDER BY id DESC LIMIT 1",
      { status: 'PENDING' }
    );

    // 3. Admin approves password reset
    const approveRes = await apiRequest(`/admin/password-resets/${resetReq.id}/approve`, {
      method: 'POST',
      token: adminToken,
      body: { note: 'Duyệt tự động bởi bộ test E2E' },
    });
    assertApiResponse(approveRes, 200);

    // Verify DB Persistence: request status = 'APPROVED' and users.must_change_password = 1
    assertDbRecord(`SELECT status FROM password_reset_requests WHERE id = ${resetReq.id}`, {
      status: 'APPROVED',
    });
    assertDbRecord("SELECT must_change_password FROM users WHERE username = '2500001'", {
      must_change_password: '1',
    });

    // Reset password & must_change_password back to normal for student 2500001
    db.executeSql("UPDATE users SET password = '$2a$10$s2ivIIT7Cjhf0iL2WrXiteC.rcBvNLSbPq2c3CwV38YrpDgh4h0wm', must_change_password = 0 WHERE username = '2500001';");
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
    console.log(`\n${colors.green}${colors.bright}ALL TESTS PASSED! API CONTRACTS & DATABASE PERSISTENCE 100% VERIFIED!${colors.reset}`);
  }
  console.log(`${colors.bright}${colors.blue}======================================================================${colors.reset}\n`);

  // Final Cleanup
  try {
    const cleanupSql = "DELETE FROM curriculum_block_subjects WHERE subject_id IN (SELECT id FROM subjects WHERE subject_code LIKE 'SUB%'); DELETE FROM subjects WHERE subject_code LIKE 'SUB%'; DELETE FROM classes WHERE code LIKE 'K18_T%'; DELETE FROM departments WHERE code LIKE 'TD%' OR name LIKE '%Kiểm Thử%'; DELETE FROM password_reset_requests WHERE reason LIKE '%test%' OR reason LIKE '%kiểm thử%'; UPDATE users SET password = '$2a$10$s2ivIIT7Cjhf0iL2WrXiteC.rcBvNLSbPq2c3CwV38YrpDgh4h0wm', must_change_password = 0 WHERE username IN ('2500001', '2500003');";
    db.executeSql(cleanupSql);
  } catch (e) {}

  return results;
}

runAllTests().then(res => {
  const fs = require('fs');
  const path = require('path');
  const resultsDir = path.join(__dirname, '..', 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(path.join(resultsDir, 'test_result.json'), JSON.stringify(res, null, 2));
  process.exit(res.failed > 0 ? 1 : 0);
}).catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
