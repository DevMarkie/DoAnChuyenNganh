# Comprehensive Logic, Error Handling & Quality Survey Report

**Explorer**: Logic & Quality Explorer  
**Workspace**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh`  
**Date**: 2026-10-08  
**Scope**: Business logic implementation, algorithms, workflows, error handling, unhandled exceptions, edge cases, boundary conditions, input validation, and test coverage/quality.

---

## Executive Summary

A comprehensive architectural and code review of the Student Management System (SMS) workspace identified **22 high-impact issues** spanning the backend (Spring Boot 3.5.6 / Java 23) and frontend (React 19 / Vite). 

Key systemic risks discovered include:
1. **Frontend API Client Architectural Defect**: `api.js` captures raw Fetch `Response` objects on error without parsing the JSON payload, breaking error reporting across 25+ frontend pages and masking critical backend validation and domain error messages.
2. **Business Workflow Inconsistencies**: Curriculum status transitions fail to acknowledge in-progress retakes; Administrative Class creation silently drops `Major` and `Cohort` relations needed for graduation roadmaps; Grade Appeal logic corrupts score calculations when handling overall course appeals.
3. **Premature Boundary & Scheduler Execution**: Scheduled job triggers auto-cancellation of under-enrolled sections at 1:00 AM on the final registration day, cutting off student registration hours early.
4. **Security & State Safety Gaps**: Stored HTML injection risks in transactional emails, unbounded in-memory caches vulnerable to Heap Exhaustion DoS, unauthenticated NPE crashes on password change endpoints, and proxy-bypassing transaction handling in batch operations.
5. **Testing Architecture Inefficiencies**: 5 duplicate test suites existing between root and service test packages, complete absence of tests for the revenue-bearing `SpecialClassService`, and disconnected chat tests dominating frontend test suites while core portal modules remain untested.

---

## Detailed Findings Matrix

| ID | Category | Severity | File Path & Lines | Summary |
|---|---|---|---|---|
| F-01 | Logic Defect | High | `backend/src/main/java/com/sms/service/CurriculumService.java:124-128` | Retake courses in progress are incorrectly displayed as "RETAKE_REQUIRED" instead of "ENROLLED" |
| F-02 | Architectural Flaw | Critical | `backend/src/main/java/com/sms/dto/request/ClassRequest.java:1-21`<br>`backend/src/main/java/com/sms/service/ClassService.java:36-63` | Administrative class CRUD omits Major & Cohort, breaking student curriculum roadmaps |
| F-03 | Logic Defect | High | `backend/src/main/java/com/sms/service/TranscriptService.java:99-109, 170-172` | Zero graded credits evaluates to GPA 0.00, generating false-positive Academic Warnings and "Kém" standing |
| F-04 | Logic Defect | High | `backend/src/main/java/com/sms/service/GradeAppealService.java:130-150`<br>`backend/src/main/java/com/sms/entity/GradeAppeal.java:30-32, 77` | "ALL" appeal overrides final exam score and recalculates total; CC1 component missing from appeals |
| F-05 | Bug | High | `backend/src/main/java/com/sms/service/LecturerService.java:121-126` | Deactivating lecturer does not disable underlying User account, leaving login active |
| F-06 | Bug | Medium | `backend/src/main/java/com/sms/service/StudentService.java:107-134`<br>`backend/src/main/java/com/sms/service/LecturerService.java:93-119` | Profile email updates are ignored during Student/Lecturer update |
| F-07 | Architectural Flaw | Critical | `frontend/src/services/api.js:38-47` | Native fetch `Response` stored in `err.response` without parsing `.data`, silencing backend errors across 25+ pages |
| F-08 | Bug | High | `backend/src/main/java/com/sms/service/ScheduleService.java:160-169`<br>`backend/src/main/java/com/sms/exception/GlobalExceptionHandler.java:96-102` | Unchecked `LocalDate.parse()` throws `DateTimeParseException`, returning HTTP 500 on client date format error |
| F-09 | Bug | High | `backend/src/main/java/com/sms/controller/AuthController.java:35-41`<br>`backend/src/main/java/com/sms/config/SecurityConfig.java:45` | Unauthenticated access to `change-password` causes NPE on `user.getId()`, producing HTTP 500 |
| F-10 | Bad Practice | High | `backend/src/main/java/com/sms/service/PasswordResetService.java:247-275` | Internal `@Transactional` method calls in batch loops trigger `UnexpectedRollbackException` |
| F-11 | Bug | Medium | `frontend/src/store/authStore.js:21-30` | Top-level unhandled `JSON.parse` of `localStorage` crashes React app before mounting |
| F-12 | Bug | High | `backend/src/main/java/com/sms/service/scheduler/AcademicScheduler.java:44-48` | Off-by-one boundary comparison cancels classes at 1:00 AM on the final registration day |
| F-13 | Bug | Medium | `backend/src/main/java/com/sms/service/EnrollmentService.java:145-148` | NPE vulnerability in schedule date overlap comparison if `endDate` is null |
| F-14 | Bad Practice | Medium | `backend/src/main/java/com/sms/service/EmailService.java:105-111, 137-151` | Direct string interpolation into HTML email templates without escaping causes HTML injection / XSS |
| F-15 | Bad Practice | Medium | `backend/src/main/java/com/sms/service/PasswordResetService.java:233-239` | Rejection emails sent to unverified user-supplied email rather than account's on-file address |
| F-16 | Bad Practice | High | `backend/src/main/java/com/sms/service/LoginAttemptService.java:22, 34-54` | Unbounded in-memory `ConcurrentHashMap` vulnerable to Heap Exhaustion Denial-of-Service |
| F-17 | Logic Defect | High | `backend/src/main/java/com/sms/service/ExcelExportService.java:34-35, 137-144, 160-218` | Grade sheet export queries `grades` instead of active `enrollments`, omitting students without grade rows |
| F-18 | Bug | Medium | `backend/src/main/java/com/sms/service/ExcelImportService.java:252-274` | Formula cells in Excel (`CellType.FORMULA`) are discarded as blank/null, dropping calculated scores |
| F-19 | Architectural Flaw | Critical | `backend/src/main/java/com/sms/controller/AcademicWarningController.java:33-46` | Full table scan of all students with sequential transcript recalculations causes severe N+1 timeout |
| F-20 | Bad Practice | High | `backend/src/main/java/com/sms/service/SpecialClassService.java:1-156` | Zero automated unit and integration test coverage for special class billing & invoice flows |
| F-21 | Bad Practice | Medium | `backend/src/test/java/com/sms/` vs `backend/src/test/java/com/sms/service/` | Redundant duplicate test classes across root and service packages create maintenance drift |
| F-22 | Bad Practice | Medium | `frontend/src/tests/chat-logic.test.ts:1-399` | Frontend tests test third-party slash commands while core portal modules lack unit tests |

---

## Deep Dive Findings & Concrete Recommendations

### 1. Business Logic Implementation, Algorithms & Workflows

#### Finding F-01: Retake Courses in Progress Incorrectly Flagged as "RETAKE_REQUIRED"
- **Relative Path**: `backend/src/main/java/com/sms/service/CurriculumService.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\CurriculumService.java`
- **Line Numbers**: Lines 124–128
- **Category**: Logic Defect
- **Severity**: High
- **Description & Manifestation**:
  In `CurriculumService.resolveStatus(Grade grade, Enrollment enrollment)`:
  ```java
  private SubjectStatus resolveStatus(Grade grade, Enrollment enrollment) {
      if (grade != null) return gradeScore(grade).compareTo(BigDecimal.ONE) >= 0 ? SubjectStatus.PASSED : SubjectStatus.RETAKE_REQUIRED;
      return enrollment != null && enrollment.getStatus() == Enrollment.EnrollmentStatus.ENROLLED
              ? SubjectStatus.ENROLLED : SubjectStatus.NOT_ENROLLED;
  }
  ```
  When a student previously failed a subject (`grade != null` with F), but has enrolled in a retake class for the current semester (`enrollment != null`), the method evaluates `grade != null` first and immediately returns `SubjectStatus.RETAKE_REQUIRED`. The student's current progress roadmap displays that the student still needs to register for the retake rather than showing that the subject is currently being taken (`ENROLLED`).
- **Actionable Recommendation**:
  Evaluate active enrollment status before historical failing grades:
  ```java
  private SubjectStatus resolveStatus(Grade grade, Enrollment enrollment) {
      if (grade != null && gradeScore(grade).compareTo(BigDecimal.ONE) >= 0) {
          return SubjectStatus.PASSED;
      }
      if (enrollment != null && enrollment.getStatus() == Enrollment.EnrollmentStatus.ENROLLED) {
          return SubjectStatus.ENROLLED;
      }
      return grade != null ? SubjectStatus.RETAKE_REQUIRED : SubjectStatus.NOT_ENROLLED;
  }
  ```

---

#### Finding F-02: Administrative Class CRUD Completely Omits Major and Cohort Relations
- **Relative Path**: `backend/src/main/java/com/sms/dto/request/ClassRequest.java`, `backend/src/main/java/com/sms/service/ClassService.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\dto\request\ClassRequest.java` (Lines 1–21)  
  `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\ClassService.java` (Lines 36–63)
- **Category**: Architectural Flaw
- **Severity**: Critical
- **Description & Manifestation**:
  `ClassEntity` has foreign keys `@JoinColumn(name = "major_id") private Major major;` and `@JoinColumn(name = "cohort_id") private Cohort cohort;`. Both `CurriculumService` (`getMyCurriculum`) and `EnrollmentService` (`assertInStudentCurriculum`) strictly require `classEntity.getMajor()` and `classEntity.getCohort()`.
  However, `ClassRequest.java` only accepts `code`, `name`, `departmentId`, and `academicYear`. `ClassService.java` never sets `major` or `cohort`. Any administrative class created or updated by an administrator has `major == null` and `cohort == null`, causing `CurriculumService.getMyCurriculum` to throw:
  `BadRequestException("Sinh viên chưa được gán chuyên ngành và khóa học để tra cứu chương trình đào tạo")`.
- **Actionable Recommendation**:
  1. Add `Integer majorId` and `Integer cohortId` with validation to `ClassRequest.java`.
  2. Inject `MajorRepository` and `CohortRepository` into `ClassService.java` and map them upon creation and update:
  ```java
  if (request.getMajorId() != null) {
      cls.setMajor(majorRepository.findById(request.getMajorId())
              .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyên ngành")));
  }
  if (request.getCohortId() != null) {
      cls.setCohort(cohortRepository.findById(request.getCohortId())
              .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học")));
  }
  ```

---

#### Finding F-03: Zero Graded Credits Evaluates to GPA 0.00, Triggering False Academic Warnings
- **Relative Path**: `backend/src/main/java/com/sms/service/TranscriptService.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\TranscriptService.java`
- **Line Numbers**: Lines 99–112, 170–172
- **Category**: Logic Defect
- **Severity**: High
- **Description & Manifestation**:
  In `TranscriptService.java`:
  ```java
  BigDecimal semesterGpa = semCredits > 0
          ? semWeightedGpa.divide(BigDecimal.valueOf(semCredits), 2, RoundingMode.HALF_UP)
          : BigDecimal.ZERO;
  ```
  If a student only takes courses with non-numeric marks in a semester (such as Incomplete `'I'` or Exemption `'M'` where `grade.getGpaPoint() == null`), `semCredits` remains 0. The method sets `semesterGpa = BigDecimal.ZERO`.
  Subsequently, line 108 classifies their standing as `"Kém"` (`classifyAcademicStanding(BigDecimal.ZERO)`), and line 171 flags an academic warning (`isSemesterWarning` checks `semesterGpa.compareTo(BigDecimal.ONE) < 0`, which is true for `0.00`). A student with legitimate exemptions is erroneously flagged for academic warning level 1.
- **Actionable Recommendation**:
  Set `semesterGpa = null` when `semCredits == 0`. Update standing classification and warning detection to ignore semesters without graded credits:
  ```java
  BigDecimal semesterGpa = semCredits > 0
          ? semWeightedGpa.divide(BigDecimal.valueOf(semCredits), 2, RoundingMode.HALF_UP)
          : null;
  ...
  private static boolean isSemesterWarning(BigDecimal semesterGpa) {
      return semesterGpa != null && semesterGpa.compareTo(BigDecimal.ONE) < 0;
  }
  ```

---

#### Finding F-04: "ALL" Component Appeals Overwrite Final Exam Score and Recalculate Total
- **Relative Path**: `backend/src/main/java/com/sms/service/GradeAppealService.java`, `backend/src/main/java/com/sms/entity/GradeAppeal.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\GradeAppealService.java` (Lines 130–150)  
  `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\entity\GradeAppeal.java` (Lines 30–32, 77)
- **Category**: Logic Defect
- **Severity**: High
- **Description & Manifestation**:
  In `GradeAppealService.applyNewScore`:
  ```java
  switch (component) {
      case CC2 -> grade.setCc2Score(newScore);
      case MIDTERM -> grade.setMidtermScore(newScore);
      case FINAL, ALL -> grade.setFinalScore(newScore);
  }
  grade.calculateTotalScore();
  ```
  When an appeal is submitted for `ALL` (Điểm tổng kết), setting `grade.setFinalScore(newScore)` and calling `grade.calculateTotalScore()` calculates:
  `CC1 * 0.05 + CC2 * 0.05 + Midterm * 0.30 + newScore * 0.60`.
  The newly approved score is NOT assigned as the total score; instead, it is weighted at 60% as the final score. Furthermore, `CC1` (5% attendance component) is completely missing from `ScoreComponent { CC2, MIDTERM, FINAL, ALL }`.
- **Actionable Recommendation**:
  1. Add `CC1` to `GradeAppeal.ScoreComponent`.
  2. In `applyNewScore`, handle `ALL` by directly setting `totalScore`, calculating letter grade and GPA points without re-executing component weighting:
  ```java
  case CC1 -> grade.setCc1Score(newScore);
  case CC2 -> grade.setCc2Score(newScore);
  case MIDTERM -> grade.setMidtermScore(newScore);
  case FINAL -> grade.setFinalScore(newScore);
  case ALL -> {
      grade.setTotalScore(newScore.setScale(2, RoundingMode.HALF_UP));
      grade.calculateLetterGrade();
      return;
  }
  ```

---

#### Finding F-05: Lecturer Deactivation Does Not Disable Associated User Account
- **Relative Path**: `backend/src/main/java/com/sms/service/LecturerService.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\LecturerService.java`
- **Line Numbers**: Lines 121–126
- **Category**: Bug
- **Severity**: High
- **Description & Manifestation**:
  In `LecturerService.toggleActive(Long id)`:
  ```java
  @Transactional
  public void toggleActive(Long id) {
      Lecturer lecturer = findById(id);
      lecturer.setIsActive(!lecturer.getIsActive());
      lecturerRepository.save(lecturer);
  }
  ```
  In `StudentService.java:143-149`, changing student status syncs with `User.setIsActive(shouldBeActive)`. In `LecturerService`, however, deactivating a lecturer only sets `lecturer.isActive = false`. The associated `User.isActive` remains `true`. The deactivated lecturer can continue logging into the system, retrieving assigned courses, and modifying sensitive records.
- **Actionable Recommendation**:
  Synchronize `lecturer.getUser().setIsActive(...)` with `lecturer.getIsActive()`:
  ```java
  @Transactional
  public void toggleActive(Long id) {
      Lecturer lecturer = findById(id);
      boolean newStatus = !Boolean.TRUE.equals(lecturer.getIsActive());
      lecturer.setIsActive(newStatus);
      lecturerRepository.save(lecturer);
      if (lecturer.getUser() != null) {
          lecturer.getUser().setIsActive(newStatus);
          userRepository.save(lecturer.getUser());
      }
  }
  ```

---

#### Finding F-06: Profile Email Updates Dropped Silently During Student and Lecturer Updates
- **Relative Path**: `backend/src/main/java/com/sms/service/StudentService.java`, `backend/src/main/java/com/sms/service/LecturerService.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\StudentService.java` (Lines 107–134)  
  `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\LecturerService.java` (Lines 93–119)
- **Category**: Bug
- **Severity**: Medium
- **Description & Manifestation**:
  `StudentRequest` and `LecturerRequest` both provide an `email` field validated with `@NotBlank @Email`. While `create()` persists the email to both the profile and the `User` account, `update()` completely omits `email`. An administrator editing a user's details to fix a typo in the email sees a success response, but the database retains the stale email.
- **Actionable Recommendation**:
  Update `email` on both the profile and the associated `User` entity after checking uniqueness:
  ```java
  if (request.getEmail() != null && !request.getEmail().trim().equalsIgnoreCase(student.getEmail())) {
      String newEmail = request.getEmail().trim();
      if (studentRepository.existsByEmail(newEmail)) {
          throw new BadRequestException("Email đã tồn tại: " + newEmail);
      }
      student.setEmail(newEmail);
      if (student.getUser() != null) {
          student.getUser().setEmail(newEmail);
          userRepository.save(student.getUser());
      }
  }
  ```

---

### 2. Error Handling & Unhandled Exceptions

#### Finding F-07: Frontend API Client Silently Swallows Backend Error Responses Across 25+ Pages
- **Relative Path**: `frontend/src/services/api.js`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\frontend\src\services\api.js`
- **Line Numbers**: Lines 38–47
- **Category**: Architectural Flaw
- **Severity**: Critical
- **Description & Manifestation**:
  In `frontend/src/services/api.js`:
  ```javascript
  if (!response.ok) {
    if (response.status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
    }
    const err = new Error(response.statusText || 'Error');
    err.response = response;
    throw err;
  }
  ```
  `err.response` is assigned the raw browser `fetch` `Response` instance. It does NOT have a `.data` property.
  Over 30 call sites across 25+ pages (e.g. `EnrollPage.jsx:70`, `AssignEnrollmentsPage.jsx:132`, `PortalLoginPage.jsx:202`, `GradeEntryPage.jsx:141`, `PasswordResetsPage.jsx:76`) evaluate:
  `const message = err.response?.data?.message;`
  Because `err.response.data` is `undefined`, `message` is always `undefined`. The user only receives generic fallbacks (such as *"Đăng ký thất bại. Vui lòng thử lại."* or *"Có lỗi xảy ra"*), masking specific backend validation errors (e.g., schedule conflicts, prerequisite failures, max credit overruns).
- **Actionable Recommendation**:
  Parse the response body before throwing the error object:
  ```javascript
  if (!response.ok) {
    let errorData = null;
    try {
      const text = await response.text();
      errorData = text ? JSON.parse(text) : null;
    } catch {
      // Non-JSON error body
    }
    const err = new Error(errorData?.message || response.statusText || 'Error');
    err.response = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: errorData,
    };
    if (response.status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
    }
    throw err;
  }
  ```

---

#### Finding F-08: Unchecked `LocalDate.parse()` Throws `DateTimeParseException` Producing HTTP 500
- **Relative Path**: `backend/src/main/java/com/sms/service/ScheduleService.java`, `backend/src/main/java/com/sms/exception/GlobalExceptionHandler.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\ScheduleService.java` (Lines 160–169)  
  `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\exception/GlobalExceptionHandler.java` (Lines 96–102)
- **Category**: Bug
- **Severity**: High
- **Description & Manifestation**:
  In `ScheduleRequest.java`, `startDate` and `endDate` are declared as `String` with `@NotBlank`. In `ScheduleService.java:164`, `LocalDate.parse(request.getStartDate())` is called directly without a try-catch block.
  If a user sends an invalid date string (e.g. `"2025/11/01"` or `"2025-02-31"`), `DateTimeParseException` is thrown. Because `GlobalExceptionHandler` does not register a handler for `DateTimeParseException`, it falls into `handleGeneral(Exception ex)` and returns HTTP 500 INTERNAL_SERVER_ERROR (*"Đã xảy ra lỗi hệ thống"*) instead of HTTP 400 Bad Request.
- **Actionable Recommendation**:
  1. Add a dedicated exception handler to `GlobalExceptionHandler.java`:
  ```java
  @ExceptionHandler(java.time.format.DateTimeParseException.class)
  public ResponseEntity<ApiResponse<Void>> handleDateTimeParse(java.time.format.DateTimeParseException ex) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
              .body(ApiResponse.error("Định dạng ngày tháng không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD."));
  }
  ```
  2. Alternatively, change `startDate` and `endDate` in DTOs to `LocalDate` directly.

---

#### Finding F-09: Unauthenticated Access to `/change-password` Produces Unhandled NPE
- **Relative Path**: `backend/src/main/java/com/sms/controller/AuthController.java`, `backend/src/main/java/com/sms/config/SecurityConfig.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\controller\AuthController.java` (Lines 35–41)  
  `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\config\SecurityConfig.java` (Line 45)
- **Category**: Bug
- **Severity**: High
- **Description & Manifestation**:
  `SecurityConfig` specifies `.requestMatchers("/api/auth/**").permitAll()`.
  In `AuthController.java`:
  ```java
  @PutMapping("/change-password")
  public ResponseEntity<ApiResponse<Void>> changePassword(
          @AuthenticationPrincipal UserPrincipal user,
          @Valid @RequestBody ChangePasswordRequest request) {
      authService.changePassword(user.getId(), request);
      return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công"));
  }
  ```
  When an unauthenticated client sends a request without a token, Spring Security allows it through due to `permitAll()`. As a result, `@AuthenticationPrincipal UserPrincipal user` is `null`. Line 39 throws a `NullPointerException` on `user.getId()`, returning HTTP 500 instead of HTTP 401 Unauthorized.
- **Actionable Recommendation**:
  Add an explicit null check or method security annotation, and update `SecurityConfig.java`:
  ```java
  @PutMapping("/change-password")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<ApiResponse<Void>> changePassword(
          @AuthenticationPrincipal UserPrincipal user,
          @Valid @RequestBody ChangePasswordRequest request) {
      if (user == null) {
          throw new BadRequestException("Yêu cầu xác thực tài khoản để đổi mật khẩu");
      }
      authService.changePassword(user.getId(), request);
      return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công"));
  }
  ```

---

#### Finding F-10: Proxy-Bypass in Batch Operations Leads to `UnexpectedRollbackException`
- **Relative Path**: `backend/src/main/java/com/sms/service/PasswordResetService.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\PasswordResetService.java`
- **Line Numbers**: Lines 247–275
- **Category**: Bad Practice
- **Severity**: High
- **Description & Manifestation**:
  In `PasswordResetService.java`:
  ```java
  @Transactional
  public List<PasswordResetResult> batchApprove(List<Long> requestIds, Long adminUserId) {
      return requestIds.stream().map(id -> {
          try {
              return approveRequest(id, null, adminUserId);
          } catch (Exception e) {
              log.error("Error approving password reset request ID: " + id, e);
              return null;
          }
      }).filter(java.util.Objects::nonNull).toList();
  }
  ```
  `batchApprove` is `@Transactional`. It calls `this.approveRequest()` directly on `this`. In Spring, internal calls bypass the proxy. If any item in `approveRequest` triggers a runtime exception (e.g. database constraint or invalid entity), the outer transaction is marked `rollback-only`. The `try-catch` inside the lambda catches the exception, but cannot clear the transaction's rollback status. When `batchApprove` completes, Spring attempts to commit, encounters the rollback flag, and throws `UnexpectedRollbackException`, failing the entire batch.
- **Actionable Recommendation**:
  Remove `@Transactional` from `batchApprove` so each individual `approveRequest` runs in its own transactional boundary:
  ```java
  // No @Transactional on the batch coordinator method
  public List<PasswordResetResult> batchApprove(List<Long> requestIds, Long adminUserId) { ... }
  ```

---

#### Finding F-11: Top-Level Unhandled `JSON.parse` in `authStore.js` Crashes React Boot
- **Relative Path**: `frontend/src/store/authStore.js`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\frontend\src\store\authStore.js`
- **Line Numbers**: Lines 21–30
- **Category**: Bug
- **Severity**: Medium
- **Description & Manifestation**:
  In `frontend/src/store/authStore.js`:
  ```javascript
  const useAuthStore = create((set, get) => ({
    user: tokenValid ? JSON.parse(localStorage.getItem('user') || 'null') : null,
  ```
  This statement executes at module evaluation time. If `localStorage.getItem('user')` contains corrupted data (e.g. truncated JSON, `"[object Object]"`), `JSON.parse` throws an unhandled `SyntaxError`. The entire React bundle crashes during import, before `main.jsx` mounts and before React `ErrorBoundary` can render.
- **Actionable Recommendation**:
  Wrap the storage read in a safe parser function:
  ```javascript
  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  };
  ```

---

### 3. Edge Cases, Boundary Conditions, Security & Null Safety

#### Finding F-12: Premature Class Cancellation on Final Registration Day
- **Relative Path**: `backend/src/main/java/com/sms/service/scheduler/AcademicScheduler.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\scheduler\AcademicScheduler.java`
- **Line Numbers**: Lines 44–48
- **Category**: Bug
- **Severity**: High
- **Description & Manifestation**:
  In `AcademicScheduler.autoCancelUnderEnrolledSections()` (runs daily at 1:00 AM):
  ```java
  if (sem.getRegistrationEnd() != null && !LocalDate.now().isBefore(sem.getRegistrationEnd())) {
  ```
  `!LocalDate.now().isBefore(sem.getRegistrationEnd())` evaluates to `true` when `LocalDate.now().isEqual(sem.getRegistrationEnd())`.
  However, in `Semester.isRegistrationOpen()`, registration is open when:
  `!today.isBefore(registrationStart) && !today.isAfter(registrationEnd)`.
  Thus, throughout the final registration day, registration is legally open for students. The scheduler running at 1:00 AM cancels classes 23 hours before registration actually ends.
- **Actionable Recommendation**:
  Change condition to only trigger after the registration deadline has completely elapsed:
  ```java
  if (sem.getRegistrationEnd() != null && LocalDate.now().isAfter(sem.getRegistrationEnd())) {
  ```

---

#### Finding F-13: Potential NullPointerException in Schedule Overlap Validation
- **Relative Path**: `backend/src/main/java/com/sms/service/EnrollmentService.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\EnrollmentService.java`
- **Line Numbers**: Lines 145–148
- **Category**: Bug
- **Severity**: Medium
- **Description & Manifestation**:
  In `EnrollmentService.java`:
  ```java
  boolean dateOverlap = newSch.getStartDate() == null || stuSch.getStartDate() == null
          || (!newSch.getStartDate().isAfter(stuSch.getEndDate())
              && !newSch.getEndDate().isBefore(stuSch.getStartDate()));
  ```
  If `newSch.getEndDate()` or `stuSch.getEndDate()` is `null` (e.g. open-ended schedule or legacy test data), calling `newSch.getStartDate().isAfter(stuSch.getEndDate())` throws a `NullPointerException`.
- **Actionable Recommendation**:
  Include null guards for both `endDate` instances:
  ```java
  boolean dateOverlap = newSch.getStartDate() == null || newSch.getEndDate() == null
          || stuSch.getStartDate() == null || stuSch.getEndDate() == null
          || (!newSch.getStartDate().isAfter(stuSch.getEndDate())
              && !newSch.getEndDate().isBefore(stuSch.getStartDate()));
  ```

---

#### Finding F-14: Unescaped User Content in Email Templates Enables HTML Injection / XSS
- **Relative Path**: `backend/src/main/java/com/sms/service/EmailService.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\EmailService.java`
- **Line Numbers**: Lines 105–111, 137–151
- **Category**: Bad Practice
- **Severity**: Medium
- **Description & Manifestation**:
  In `EmailService.java`:
  ```java
  String htmlContent = """...""".formatted(fullName, roleDisplay, username, newPassword, ...);
  ```
  User-supplied parameters (`fullName`, `username`, `reason`) are interpolated directly into HTML email templates without HTML escaping. If an admin or user supplies HTML tags in `fullName` or `reason`, they are executed by recipient email clients, creating phishing and HTML injection vectors.
- **Actionable Recommendation**:
  Sanitize all interpolated parameters using Spring's `HtmlUtils.htmlEscape()`:
  ```java
  import org.springframework.web.util.HtmlUtils;
  ...
  HtmlUtils.htmlEscape(fullName),
  HtmlUtils.htmlEscape(username),
  HtmlUtils.htmlEscape(reason)
  ```

---

#### Finding F-15: Password Reset Rejection Notices Sent to Unauthenticated Recipient Email
- **Relative Path**: `backend/src/main/java/com/sms/service/PasswordResetService.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\PasswordResetService.java`
- **Line Numbers**: Lines 233–239
- **Category**: Bad Practice
- **Severity**: Medium
- **Description & Manifestation**:
  In `approveRequest`, lines 178–183 document that emails must only be sent to the verified on-file address (`resolveOnFileEmail`).
  However, in `rejectRequest`:
  ```java
  emailService.sendRejectionEmail(
          request.getEmail(),
          request.getFullName(),
          request.getUsername(),
          rejectRequest.getRejectReason()
  );
  ```
  `request.getEmail()` is the unverified email typed into the public form. An external actor can submit arbitrary target email addresses, causing the server to send rejection notices to third parties upon admin review.
- **Actionable Recommendation**:
  Use `resolveOnFileEmail(request.getUser(), request.getRole())` for rejection emails as well:
  ```java
  String onFileEmail = resolveOnFileEmail(request.getUser(), request.getRole());
  if (onFileEmail != null && !onFileEmail.isBlank()) {
      emailService.sendRejectionEmail(onFileEmail, request.getFullName(), request.getUsername(), rejectRequest.getRejectReason());
  }
  ```

---

#### Finding F-16: Unbounded In-Memory Cache in `LoginAttemptService` Vulnerable to DoS
- **Relative Path**: `backend/src/main/java/com/sms/service/LoginAttemptService.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\LoginAttemptService.java`
- **Line Numbers**: Lines 22, 34–54
- **Category**: Bad Practice
- **Severity**: High
- **Description & Manifestation**:
  `private final ConcurrentHashMap<String, AttemptInfo> attempts = new ConcurrentHashMap<>();`
  Failed login attempts for any username insert an entry into `attempts`. There is no maximum capacity, eviction policy, or scheduled background cleaner (unlike `RateLimitFilter.cleanupExpiredBuckets()`). An attacker sending failed login requests with randomized usernames can cause unbounded memory growth until an `OutOfMemoryError` crashes the application.
- **Actionable Recommendation**:
  1. Add a scheduled cleanup method (e.g. every 15 minutes) to evict expired entries:
  ```java
  @Scheduled(fixedRate = 900000)
  public void cleanupExpiredAttempts() {
      Instant now = Instant.now();
      attempts.entrySet().removeIf(entry -> 
          entry.getValue().lockedUntil() != null && now.isAfter(entry.getValue().lockedUntil()));
  }
  ```
  2. Or use an eviction cache such as Caffeine (`Caffeine.newBuilder().maximumSize(10000).expireAfterWrite(15, TimeUnit.MINUTES).build()`).

---

#### Finding F-17: Excel Grade Sheet Export Omits Enrolled Students Without Existing Grade Records
- **Relative Path**: `backend/src/main/java/com/sms/service/ExcelExportService.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\ExcelExportService.java`
- **Line Numbers**: Lines 34–35, 137–144, 160–218
- **Category**: Logic Defect
- **Severity**: High
- **Description & Manifestation**:
  In `ExcelExportService.exportGradeSheet`:
  ```java
  List<Grade> grades = gradeRepository.findBySectionId(sectionId);
  ...
  infoCell2.setCellValue(String.format("Học kỳ: %s — Số tín chỉ: %d — Sĩ số: %d SV",
          section.getSemester() != null ? section.getSemester().getSemesterName() : "N/A",
          section.getSubject() != null ? section.getSubject().getCredits() : 0,
          grades.size()));
  ```
  The export iterates over `grades` rather than active enrollments from `enrollmentRepository.findActiveBySectionId(sectionId)`. Any student registered in the section who does not yet have a record in `grades` is completely excluded from the exported sheet, and `grades.size()` displays an inaccurate class enrollment count.
- **Actionable Recommendation**:
  Fetch active enrollments as the master roster (matching `ExcelImportService.generateImportTemplate`), map existing grades against enrollments, and print empty score cells for students without records yet:
  ```java
  List<Enrollment> roster = enrollmentRepository.findActiveBySectionId(sectionId);
  Map<Long, Grade> gradeMap = gradeRepository.findBySectionId(sectionId).stream()
          .filter(g -> g.getEnrollment() != null)
          .collect(Collectors.toMap(g -> g.getEnrollment().getId(), Function.identity()));
  ```

---

#### Finding F-18: Formula-Based Cells in Excel Import Dropped as Blank
- **Relative Path**: `backend/src/main/java/com/sms/service/ExcelImportService.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\ExcelImportService.java`
- **Line Numbers**: Lines 252–274
- **Category**: Bug
- **Severity**: Medium
- **Description & Manifestation**:
  In `ExcelImportService.readScore`:
  ```java
  if (cell.getCellType() == CellType.NUMERIC) {
      val = cell.getNumericCellValue();
  } else if (cell.getCellType() == CellType.STRING) {
      ...
  } else {
      return null; // BLANK / FORMULA / khác -> coi như bỏ trống
  }
  ```
  Instructors frequently compute grades using spreadsheet formulas (e.g. `=AVERAGE(D5:E5)`). Because `CellType.FORMULA` is handled in the `else` branch, all formula-derived values are dropped as `null`, preventing instructors from importing pre-calculated sheets.
- **Actionable Recommendation**:
  Inspect formula results using Apache POI's cached formula result type:
  ```java
  CellType type = cell.getCellType();
  if (type == CellType.FORMULA) {
      type = cell.getCachedFormulaResultType();
  }
  if (type == CellType.NUMERIC) {
      val = cell.getNumericCellValue();
  } else if (type == CellType.STRING) { ... }
  ```

---

#### Finding F-19: Severe N+1 Query in Academic Warnings Endpoint
- **Relative Path**: `backend/src/main/java/com/sms/controller/AcademicWarningController.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\controller\AcademicWarningController.java`
- **Line Numbers**: Lines 33–46
- **Category**: Architectural Flaw
- **Severity**: Critical
- **Description & Manifestation**:
  In `AcademicWarningController.getWarnings`:
  ```java
  List<AcademicWarningResponse> warnings = studentService.findAll().stream()
          ...
          .map(student -> transcriptService.getTranscript(student.getId()))
  ```
  `studentService.findAll()` loads all students in the university into memory. For every single student, `transcriptService.getTranscript()` performs multiple SQL queries for grades, enrollments, course sections, and subjects. For a university database of thousands of students, this triggers tens of thousands of queries sequentially, freezing the thread pool and exhausting HikariCP connections.
- **Actionable Recommendation**:
  1. Add pagination (`Pageable`) and filter parameters directly at the database layer.
  2. Implement a dedicated SQL view or aggregated query that filters students whose GPA/CPA meets warning criteria before calculating full transcripts.

---

### 4. Testing Coverage & Quality

#### Finding F-20: Zero Automated Test Coverage for Special Class Billing and Invoicing
- **Relative Path**: `backend/src/main/java/com/sms/service/SpecialClassService.java`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\SpecialClassService.java`
- **Category**: Bad Practice
- **Severity**: High
- **Description & Manifestation**:
  `SpecialClassService` handles student class opening requests, special section creation, capacity constraints, tuition scale coefficients, and student invoicing. While almost every other service has a corresponding unit test, `SpecialClassServiceTest.java` does not exist anywhere in `backend/src/test`. Any modifications to tuition rate calculation or request approval risk introducing silent regressions into financial records.
- **Actionable Recommendation**:
  Create `backend/src/test/java/com/sms/service/SpecialClassServiceTest.java` covering request submission, section generation with capacity constraints, and fee scale calculation.

---

#### Finding F-21: Redundant and Divergent Test Suites Across Root and Service Packages
- **Relative Path**: `backend/src/test/java/com/sms/` vs `backend/src/test/java/com/sms/service/`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\test\java\com\sms\`
- **Category**: Bad Practice
- **Severity**: Medium
- **Description & Manifestation**:
  Five duplicate test classes exist in both packages:
  - `EnrollmentServiceTest.java` (in `com.sms` and `com.sms.service`)
  - `GradeServiceTest.java` (in `com.sms` and `com.sms.service`)
  - `PasswordResetServiceTest.java` (in `com.sms` and `com.sms.service`)
  - `SubjectServiceTest.java` (in `com.sms` and `com.sms.service`)
  - `TranscriptServiceTest.java` (in `com.sms` and `com.sms.service`)
  These suites have diverged: mock configurations and assertions differ between the two copies, increasing test execution time and causing confusion over which suite represents the active contract.
- **Actionable Recommendation**:
  Consolidate all service tests into `com.sms.service.*` and remove the legacy duplicate files from `com.sms.*`.

---

#### Finding F-22: Displaced Chat Logic Tests While Core Portal Modules Lack Unit Tests
- **Relative Path**: `frontend/src/tests/chat-logic.test.ts`
- **Absolute Path**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\frontend\src\tests\chat-logic.test.ts` (Lines 1–399)
- **Category**: Bad Practice
- **Severity**: Medium
- **Description & Manifestation**:
  The frontend test suite contains 399 lines in `chat-logic.test.ts` testing unrelated third-party slash commands (`/goal`, `/schedule`, `/plan`, `/grill-me`, `/agy-customizations`). Meanwhile, core frontend logic—including GPA calculations, enrollment state handling, conflict warnings, Excel modal validations, and admin forms—possesses only two small test files (`dataService.test.js` and `authStore.test.js`). Over 95% of frontend application code has zero automated unit or integration tests.
- **Actionable Recommendation**:
  Relocate or remove third-party chat test suites and implement Vitest component/hook tests for critical modules:
  - `EnrollPage` conflict detection and filter states.
  - `GradeEntryPage` score validation and normalization.
  - `ForcePasswordChangeModal` flow and submission guards.

---
