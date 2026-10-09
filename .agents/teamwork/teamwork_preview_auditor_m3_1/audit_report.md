## Forensic Audit Report

**Work Product**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\code_review_report.md`  
**Profile**: General Project  
**Integrity Mode**: Demo (as specified in `ORIGINAL_REQUEST.md`)  
**Verdict**: **CLEAN**

---

### Executive Summary

A comprehensive forensic integrity audit was conducted on the deliverable `code_review_report.md` against the ground-truth codebase in `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh` and the requirements established in `ORIGINAL_REQUEST.md`.

All 30 findings documented in `code_review_report.md` were independently inspected and verified against the actual repository files. Every cited file exists in the repository, the cited line numbers accurately correspond to the underlying source logic, and every finding represents an authentic defect, security risk, performance bottleneck, or code smell rather than hallucinated or placeholder content. Furthermore, all 30 findings contain concrete, actionable remediation code. No cheating, fabricated logs, facade implementations, or superficial stubs were detected.

---

### Phase Results

| Check Name | Status | Details |
|:---|:---:|:---|
| **1. Ground-Truth Requirements Check** | **PASS** | `ORIGINAL_REQUEST.md` specifies `code_review_report.md` with detailed findings (R1), actionable recommendations (R2), exact file paths and line numbers, and saved at the root working directory. All requirements are satisfied. |
| **2. Non-Fabrication & Grounding Verification** | **PASS** | All 30 findings were checked against physical files in the repository. Every single cited class, method, SQL column, trigger, frontend component, and configuration key exists as described. |
| **3. Line Number & Citation Precision** | **PASS** | Exact line numbers cited across all findings (e.g., `schema.sql:288`, `GradeService.java:66-69, 227-232, 287-291`, `AcademicWarningController.java:33-46`, `api.js:44-46`, `ClassRequest.java:8-20`) match the source code accurately. |
| **4. Facade & Placeholder Detection** | **PASS** | Scanned for `TODO`, `TBD`, `dummy`, `placeholder`, `lorem`, and empty stubs across `code_review_report.md`. None found. All 30 findings contain complete descriptions and detailed drop-in replacement code. |
| **5. Actionable Remediation Verification** | **PASS** | Every single one of the 30 findings provides concrete, syntactically correct code snippets (Java, SQL, JavaScript, XML, properties) demonstrating exactly how to remediate the defect. |
| **6. Behavioral & Code Logic Alignment** | **PASS** | The identified issues accurately capture real edge cases and system bugs: negative role deduction treating students as admins, N+1 transcript query storm on academic warnings, raw fetch response error swallowing breaking UI error toasts, lost updates on trigger-incremented counts, and unhandled `DateTimeParseException` returning HTTP 500. |

---

### Forensic Evidence Log (Sample Audit of Key Findings)

#### 1. Finding ARCH-01 (Database Schema Enum Mismatch)
- **Claim**: `database/schema.sql:288` defines `status ENUM('OPEN', 'CLOSED', 'CANCELLED')`, while `CourseSection.java:87-89` defines six enum values (`OPEN, ACTIVE, CLOSED, CANCELLED, PENDING_FEE, LOCKED_BILLING`). `AcademicScheduler.java:76` sets `SectionStatus.ACTIVE`, triggering MySQL truncation errors.
- **Empirical Check**:
  - `database/schema.sql` line 288:
    ```sql
    status ENUM('OPEN', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    ```
  - `CourseSection.java` lines 87-89:
    ```java
    public enum SectionStatus {
        OPEN, ACTIVE, CLOSED, CANCELLED, PENDING_FEE, LOCKED_BILLING
    }
    ```
  - `AcademicScheduler.java` line 76:
    ```java
    section.setStatus(CourseSection.SectionStatus.ACTIVE);
    ```
- **Auditor Verification**: Confirmed authentic.

#### 2. Finding ARCH-02 (Negative Authorization in Grade Management)
- **Claim**: `GradeService.java:66-69, 227-232, 287-291` deduces administrator authority via negative logic (`lecturer == null => admin`). A student calling `PUT /api/grades` has `lecturer == null` because students are not in the `lecturers` table, bypassing authorization. `GradeController.java:99-111` lacks `@PreAuthorize`, and `SecurityConfig.java:73` registers `/api/grades/**` which does not match root `/api/grades`.
- **Empirical Check**:
  - `GradeService.java` lines 66-69:
    ```java
    Lecturer lecturer = lecturerRepository.findByUserId(userId).orElse(null);
    if (lecturer == null) {
        return; // admin — toàn quyền xem
    }
    ```
  - `GradeService.java` lines 287-291:
    ```java
    if (lecturer == null && Boolean.FALSE.equals(request.getFinalize())) {
        grade.setIsFinalized(false);
        grade.setFinalizedAt(null);
        log.info("AUDIT: adminUserId={} unlocked grade for enrollmentId={}", userId, enrollment.getId());
    }
    ```
  - `GradeController.java` lines 99-111: `saveGrade` and `saveGrades` have no `@PreAuthorize` annotation.
  - `SecurityConfig.java` line 73: `.requestMatchers(HttpMethod.PUT, "/api/grades/**").hasAnyRole("ADMIN", "LECTURER")` leaving root `PUT /api/grades` falling through to `.anyRequest().authenticated()`.
- **Auditor Verification**: Confirmed authentic and severe vulnerability.

#### 3. Finding PERF-01 (N+1 Full Table Scan in Academic Warnings)
- **Claim**: `AcademicWarningController.java:33-46` executes `studentService.findAll()`, streaming every student and calling `transcriptService.getTranscript(student.getId())`, generating thousands of queries. `AcademicWarningsPage.jsx:32-39` requests paginated results that the backend ignores.
- **Empirical Check**:
  - `AcademicWarningController.java` lines 33-46:
    ```java
    List<AcademicWarningResponse> warnings = studentService.findAll().stream()
            .filter(student -> majorId == null || ...)
            .map(student -> transcriptService.getTranscript(student.getId()))
            .filter(transcript -> transcript.getWarningLevel() > 0)
            ...
    ```
  - `AcademicWarningsPage.jsx` lines 32-39 sends `{ page, size: pageSize }` and attempts `setWarnings(response.data?.data || response.data?.content || [])`.
- **Auditor Verification**: Confirmed authentic.

#### 4. Finding BUG-01 (Frontend `api.js` Error Swallowing)
- **Claim**: `frontend/src/services/api.js:44-46` attaches raw browser `Response` to `err.response`, which lacks `.data`. UI catch blocks across 25+ pages expecting `err.response?.data?.message` always get `undefined` and fall back to generic error text.
- **Empirical Check**:
  - `api.js` lines 44-46:
    ```javascript
    const err = new Error(response.statusText || 'Error');
    err.response = response;
    throw err;
    ```
  - `EnrollPage.jsx` lines 70-74:
    ```javascript
    const message = err.response?.data?.message;
    toast.error(status === 409 ? ... : message || "Đăng ký thất bại. Vui lòng thử lại.");
    ```
- **Auditor Verification**: Confirmed authentic.

#### 5. Finding ARCH-03 (Class Creation DTO Omits Major and Cohort)
- **Claim**: `ClassRequest.java:8-20` has only `code, name, departmentId, academicYear`. `ClassService.java:44-51` never assigns `major` or `cohort`. `CurriculumService.java:34-36` throws `BadRequestException` if `major` or `cohort` is null.
- **Empirical Check**:
  - `ClassRequest.java` lines 8-20 confirmed omitting `majorId` and `cohortId`.
  - `ClassService.java` lines 44-51 confirmed creating `ClassEntity` without setting `major` or `cohort`.
  - `CurriculumService.java` lines 34-36 confirmed throwing:
    `"Sinh viên chưa được gán chuyên ngành và khóa học để tra cứu chương trình đào tạo"`.
- **Auditor Verification**: Confirmed authentic.

#### 6. Findings 6–30 Systematic Check
- **SEC-01**: `EmailService.java:105, 150` unescaped HTML string template formatting; `PasswordResetService.java:234` sends rejection notice to unverified user-supplied email. Verified.
- **SEC-02**: `application.properties:55` wildcard patterns `*.trycloudflare.com`, `*.github.io` combined with `SecurityConfig.java:112` `allowCredentials(true)`. Verified.
- **BUG-02**: `GradeService.java:229` and `CourseSectionService.java:157` invoke `section.getLecturer().getId()` without null check for unassigned lecturer. Verified.
- **BUG-03**: `schema.sql:506-532` triggers increment/decrement `enrolled_count`, while `CourseSection.java:51-53` maps `currentStudents` as updatable column overwritten on save (`CourseSectionService.java:116`). Verified.
- **PERF-02**: `PasswordResetService.java:140-209, 247-257` calls `emailService.sendPasswordResetEmail` synchronously inside `@Transactional` with Hikari maximum pool size = 15 (`application.properties:14`). Verified.
- **SEC-03**: `JwtAuthFilter.java:56` constructs `UserPrincipal` directly from JWT claims with `true, // Giả định token còn hạn thì active` (`UserPrincipal.java:52`), ignoring account active toggle (`LecturerService.java:121-126`). Verified.
- **BUG-04**: `AcademicScheduler.java:46` auto-cancels sections at 1:00 AM on final registration day using `!LocalDate.now().isBefore(sem.getRegistrationEnd())`. Verified.
- **BUG-05**: `TranscriptService.java:99-109, 171` sets `semesterGpa = BigDecimal.ZERO` when `semCredits == 0`, triggering academic warning (`0.00 < 1.0`). Verified.
- **BUG-06**: `GradeAppealService.java:146-148` sets `finalScore` when component is `ALL` and recalculates total; `GradeAppeal.java:77` omits `CC1` in enum. Verified.
- **BUG-07**: `CurriculumService.java:124-128` evaluates past failing grade before active enrollment, returning `RETAKE_REQUIRED` instead of `ENROLLED`. Verified.
- **SEC-04**: `SecurityConfig.java:45` `permitAll()` on `/api/auth/**` causes unauthenticated `PUT /api/auth/change-password` to execute `user.getId()` throwing NPE (`AuthController.java:35-41`). Verified.
- **SEC-05**: `frontend/src/utils/export.js:2` and `backend/.../ExcelExportService.java:171, 176` omit formula character sanitization (`=`, `+`, `-`, `@`). Verified.
- **ARCH-04**: `ClassController.java:25` and `StudentController.java:28` return JPA entities; `JacksonConfig.java:14` and `application.properties:27` (`open-in-view=false`) serialize uninitialized proxies as `null`. Verified.
- **PERF-03**: `LoginAttemptService.java:22, 48` unbounded `ConcurrentHashMap` with no TTL eviction. Verified.
- **SEC-06**: `frontend/src/services/dataService.js:20, 39, 42, 49, 58, 95` direct query string concatenation without URL encoding. Verified.
- **QUAL-01**: `frontend/src/tests/chat-logic.test.ts:1-399` and `tests/slash-command-menu.spec.ts` contain extraneous AI chatbot tests. Verified.
- **QUAL-02**: 5 duplicate test classes between root `test/java/com/sms` and `test/java/com/sms/service`; `SpecialClassService.java` has 0% tests. Verified.
- **BUG-08**: `ScheduleService.java:164-165` `LocalDate.parse` throws `DateTimeParseException` falling into `GlobalExceptionHandler.java:96-102` returning 500 instead of 400. Verified.
- **ARCH-05**: `Notification.java` and `StudentInvoice.java` persisted by scheduler/services but have zero controllers or read endpoints. Verified.
- **SEC-07**: `application.properties:11-12` and `docker-compose.yml:9, 36` default to blank root database password. Verified.
- **CODE-01**: `Grade.java:104-107, 120-152`, `CourseSectionService.java:85`, `TranscriptService.java:100` contain hardcoded magic numbers for weights and thresholds. Verified.
- **CODE-02**: Mixing raw unchecked exceptions with domain `BadRequestException`. Verified.
- **CODE-03**: `SubjectController.java:21, 28, 34` declares `@Transactional(readOnly = true)` directly on REST controller methods. Verified.
- **CODE-04**: `GradeEntryPage.jsx:69-77` non-memoized array mutations causing full re-renders; `authStore.js:21-30` unguarded top-level `JSON.parse`. Verified.
- **ENV-01**: `StudentManagementApplicationTests.java:6-12` `@SpringBootTest` attempts connecting to live MySQL with no embedded H2 dependency in `backend/pom.xml:90-100`. Verified.

---

### Final Assessment

The work product `code_review_report.md` represents an exceptionally rigorous, authentic, and high-quality engineering review of the Student Management System. Every single finding corresponds to real, empirical issues in the codebase, with exact file citations, accurate line ranges, and actionable remediation snippets.

**Verdict: CLEAN**
