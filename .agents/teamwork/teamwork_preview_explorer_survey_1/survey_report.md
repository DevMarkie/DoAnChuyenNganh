# Architectural & Backend Investigation Survey Report

**Explorer Subagent**: Architectural & Backend Explorer  
**Date**: 2026-10-08  
**Project**: Student Management System (SMS)  
**Workspace**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh`  
**Reference Original Prompt**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\.agents\teamwork\ORIGINAL_REQUEST.md`

---

## Executive Summary

A comprehensive architectural, backend, database, configuration, and security exploration was conducted across the Student Management System codebase (`com.sms`, MySQL 8, Spring Boot 3.5.6, React 19). The system implements a three-tier layered architecture (Controller, Service, Repository, Entity, Security) for managing universities, students, lecturers, course sections, grades, tuition fees, and transcripts.

While the codebase exhibits good modular decomposition, several critical architectural defects, security vulnerabilities, concurrency hazards, and data consistency risks were identified. Key concerns include:
1. **Database Schema & Entity Desynchronization**: Unaligned enum definitions (`CourseSection.status`) causing runtime data truncation errors, unmanaged SQL migration scripts without an automated migration tool (Flyway/Liquibase).
2. **Access Control & Authorization Flaws**: Negative authorization assumptions in `GradeService` (`lecturer == null => ADMIN`) that can treat students as administrators, plus stateless JWT authentication completely bypassing account deactivation/suspension flags.
3. **Severe Performance Bottlenecks**: Extreme N+1 query storms in `AcademicWarningController` that iterate over the entire student population with synchronous queries, and synchronous SMTP network I/O held inside active database transactions during batch operations.
4. **Data Corruption & Leaky Abstractions**: In-memory updates silently overwriting database triggers on `enrolled_count`, direct JPA entity exposure in controllers causing uninitialized lazy fields to serialize as null, and class creation APIs omitting degree program links (`major_id`, `cohort_id`).

Below is the exhaustive catalog of 18 structured findings, complete with file locations, line numbers, classifications, root causes, and actionable remediation steps.

---

## Detailed Findings

### 1. ARCH-01: Schema Enum Mismatch and Missing Automated Migration Management
- **File Path (Relative)**: `database/schema.sql:288`, `backend/src/main/java/com/sms/entity/CourseSection.java:87-89`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\database\schema.sql:288`, `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\entity\CourseSection.java:87-89`
- **Related Locations**:
  - `backend/src/main/java/com/sms/service/scheduler/AcademicScheduler.java:76`
  - `backend/src/main/java/com/sms/service/SpecialClassService.java:87, 123`
  - `database/migrations/migrate_special_class_billing.sql:10-12`
  - `docker-compose.yml:18-19`
- **Category**: Bug / Architectural Flaw
- **Severity**: Critical

#### Description & Root Cause Analysis
In `database/schema.sql:288`, the `course_sections` table defines `status` as:
```sql
status ENUM('OPEN', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
```
However, the Java entity `CourseSection.java:87-89` defines the enum as:
```java
public enum SectionStatus {
    OPEN, ACTIVE, CLOSED, CANCELLED, PENDING_FEE, LOCKED_BILLING
}
```
In `database/migrations/migrate_special_class_billing.sql:10-12`, an `ALTER TABLE` statement was created to add `ACTIVE`, `PENDING_FEE`, and `LOCKED_BILLING`. However:
1. `database/schema.sql` (which is executed upon fresh setup in `docker-compose.yml:18`) was never updated with these enum values.
2. The project has no database migration tool (e.g. Flyway or Liquibase in `pom.xml`), relying instead on unmanaged, loose `.sql` scripts.
3. When the automated background job `AcademicScheduler.java:76` runs (`section.setStatus(CourseSection.SectionStatus.ACTIVE);`) or when `SpecialClassService.java:87, 123` executes, MySQL rejects the update with a fatal error: `Data truncated for column 'status' at row 1` or `DataIntegrityViolationException`.

#### Actionable Recommendation
1. Update `database/schema.sql:288` to align with the domain model:
```sql
status ENUM('OPEN', 'ACTIVE', 'CLOSED', 'CANCELLED', 'PENDING_FEE', 'LOCKED_BILLING') NOT NULL DEFAULT 'OPEN',
```
2. Integrate Flyway into `pom.xml` to manage schema migrations incrementally:
```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-mysql</artifactId>
</dependency>
```
3. Move migration scripts into `backend/src/main/resources/db/migration/V1__schema.sql`, `V2__billing.sql`, etc.

---

### 2. ARCH-02: Negative Authorization Flaw & Missing Role Check in Grade Management
- **File Path (Relative)**: `backend/src/main/java/com/sms/service/GradeService.java:66-69, 86, 227-233, 287-291`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\GradeService.java:66-69, 86, 227-233, 287-291`
- **Related Locations**:
  - `backend/src/main/java/com/sms/controller/GradeController.java:99-111`
  - `backend/src/main/java/com/sms/config/SecurityConfig.java:73`
- **Category**: Security / Architectural Flaw
- **Severity**: Critical

#### Description & Root Cause Analysis
In `GradeService.java`, administrator authority is determined using negative logic:
```java
// GradeService.java:66-69
Lecturer lecturer = lecturerRepository.findByUserId(userId).orElse(null);
if (lecturer == null) {
    return; // admin — toàn quyền xem
}
```
And in `applyScores`:
```java
// GradeService.java:227
if (lecturer != null) { ... }
// GradeService.java:287
if (lecturer == null && Boolean.FALSE.equals(request.getFinalize())) {
    grade.setIsFinalized(false);
    grade.setFinalizedAt(null);
}
```
When a student invokes these methods, `lecturerRepository.findByUserId(userId)` also returns `null` because students do not exist in `lecturers`. As a result, students satisfy `lecturer == null` and are treated as administrators!
Furthermore, in `GradeController.java:99-111`, `@PutMapping` and `@PutMapping("/batch")` lack method-level security (`@PreAuthorize`), and in `SecurityConfig.java:73`, `PUT /api/grades` (without trailing slash or sub-path) may fall through to `.anyRequest().authenticated()`. This allows any authenticated user to modify grades or unlock finalized grade sheets.

#### Actionable Recommendation
1. Replace negative role deduction with explicit role validation using `UserPrincipal` or Spring Security context:
```java
public void assertCanViewSection(UserPrincipal user, Long sectionId) {
    if (user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
        return;
    }
    Lecturer lecturer = lecturerRepository.findByUserId(user.getId())
            .orElseThrow(() -> new AccessDeniedException("Bạn không có quyền xem bảng điểm"));
    ...
}
```
2. Annotate methods in `GradeController.java:99-111` explicitly:
```java
@PutMapping
@PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
public ResponseEntity<ApiResponse<Grade>> saveGrade(...)
```
3. Update `SecurityConfig.java:73` to cover both `/api/grades` and `/api/grades/**`:
```java
.requestMatchers(HttpMethod.PUT, "/api/grades", "/api/grades/**").hasAnyRole("ADMIN", "LECTURER")
```

---

### 3. ARCH-03: Extreme N+1 Query Storm and Whole-Dataset Loading in Academic Warnings
- **File Path (Relative)**: `backend/src/main/java/com/sms/controller/AcademicWarningController.java:33-46`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\controller\AcademicWarningController.java:33-46`
- **Related Locations**:
  - `backend/src/main/java/com/sms/service/TranscriptService.java:48-53`
  - `backend/src/main/java/com/sms/repository/GradeRepository.java`
- **Category**: Performance / Architectural Flaw
- **Severity**: High

#### Description & Root Cause Analysis
In `AcademicWarningController.java:33-46`:
```java
List<AcademicWarningResponse> warnings = studentService.findAll().stream()
        .filter(student -> majorId == null || ...)
        .map(student -> transcriptService.getTranscript(student.getId()))
        .filter(transcript -> transcript.getWarningLevel() > 0)
        ...
```
This design contains several critical flaws:
1. It loads all students across the entire institution (`studentService.findAll()`) into server memory.
2. For each student, it invokes `transcriptService.getTranscript(student.getId())`, executing `gradeRepository.findFinalizedByStudentId(studentId)`.
3. In a university with 5,000 students, this executes **5,001 individual database queries** in a single HTTP request thread.
4. Heavy business orchestration and data computation are located directly inside a web Controller instead of a Service class.
5. In production, this causes gateway timeouts (504), severe database CPU spikes, and memory heap bloat.

#### Actionable Recommendation
1. Move the academic warning calculation into an `AcademicWarningService`.
2. Execute a single bulk SQL/JPQL aggregation or database view (`v_student_gpa` already exists in `database/schema.sql:574`!) with pagination and filtering:
```java
@Query("""
    SELECT s.id, s.studentCode, s.fullName, c.name, g.cumulative_gpa
    FROM Student s
    JOIN s.classEntity c
    JOIN v_student_gpa g ON g.student_id = s.id
    WHERE (:majorId IS NULL OR c.major.id = :majorId)
      AND g.cumulative_gpa < 2.0
""")
Page<AcademicWarningDTO> findAcademicWarnings(Integer majorId, Pageable pageable);
```

---

### 4. ARCH-04: JPA Entity Leakage Across API Layer and Non-Deterministic Null Serialization
- **File Path (Relative)**: `backend/src/main/java/com/sms/controller/ClassController.java:25-38`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\controller\ClassController.java:25-38`
- **Related Locations**:
  - `backend/src/main/java/com/sms/controller/StudentController.java:26-30`
  - `backend/src/main/java/com/sms/controller/SpecialClassController.java:25, 35, 45`
  - `backend/src/main/java/com/sms/config/JacksonConfig.java:11-16`
  - `backend/src/main/resources/application.properties:27`
- **Category**: Architectural Flaw
- **Severity**: High

#### Description & Root Cause Analysis
Several controllers (`ClassController`, `StudentController`, `SpecialClassController`, `EnrollmentController`) return JPA `@Entity` instances directly:
```java
// ClassController.java:25
public ResponseEntity<ApiResponse<List<ClassEntity>>> getAll() { ... }
```
Because `spring.jpa.open-in-view=false` is configured in `application.properties:27`, lazy associations (`Department`, `Major`, `Cohort`, `User`) cannot be fetched outside the active service transaction.
To suppress `LazyInitializationException`, `JacksonConfig.java:14` sets:
```java
module.configure(Hibernate6Module.Feature.FORCE_LAZY_LOADING, false);
```
Consequently:
- Jackson serializes uninitialized proxies as `null`.
- The frontend receives unstable API contracts where fields like `department`, `major`, or `cohort` are arbitrarily `null` unless a specific service query happened to initialize them.
- Internal database details and entities (such as `User` with internal timestamps and flags) are leaked directly into HTTP responses.

#### Actionable Recommendation
1. Introduce dedicated response DTOs (e.g. `ClassResponse`, `StudentResponse`, `CourseSectionResponse`) for all endpoints.
2. Perform mapping inside the service layer while the Hibernate session is active.
```java
public record ClassResponse(
    Integer id,
    String code,
    String name,
    Integer departmentId,
    String departmentName,
    Integer majorId,
    String majorName,
    String academicYear,
    Boolean isActive
) {}
```
3. Remove direct entity returns from all controllers.

---

### 5. ARCH-05: Lost Updates Between Database Triggers and In-Memory Entity Flushes
- **File Path (Relative)**: `backend/src/main/java/com/sms/entity/CourseSection.java:51-53`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\entity\CourseSection.java:51-53`
- **Related Locations**:
  - `backend/src/main/java/com/sms/service/CourseSectionService.java:96-123`
  - `database/schema.sql:506-532`
- **Category**: Bug / Architectural Flaw
- **Severity**: High

#### Description & Root Cause Analysis
In `database/schema.sql:506-532`, database triggers `trg_enrollment_insert_after` and `trg_enrollment_update_after` increment or decrement `course_sections.enrolled_count` when students enroll or cancel.
However, in `CourseSection.java:51-53`:
```java
@Column(name = "enrolled_count", nullable = false)
private Integer currentStudents = 0;
```
`currentStudents` is mapped as a normal read/write JPA attribute without `@org.hibernate.annotations.Generated(GenerationTime.ALWAYS)` or `@DynamicUpdate`.
When an administrator edits a section via `CourseSectionService.update(id, request)`:
```java
CourseSection section = findById(id);
...
CourseSection saved = courseSectionRepository.save(section);
```
Hibernate generates an update statement including all columns:
```sql
UPDATE course_sections SET enrolled_count = ?, max_students = ?, room = ? ... WHERE id = ?
```
If concurrent enrollments occurred between `findById` and `save`, the in-memory stale `currentStudents` value overwrites the trigger-managed count in the database, erasing actual student enrollments from the counter.

#### Actionable Recommendation
1. Mark `currentStudents` as database-generated or insertable/updatable = false:
```java
@Column(name = "enrolled_count", nullable = false, insertable = false, updatable = false)
private Integer currentStudents;
```
2. Or use `@DynamicUpdate` on `CourseSection` and ensure `currentStudents` is never modified by admin update logic.
3. Alternatively, eliminate the database trigger entirely and calculate `enrolled_count` using transactional counts or pessimistic locking increments in Java.

---

### 6. ARCH-06: Synchronous Network I/O (SMTP) Inside Transaction Boundaries & HikariCP Exhaustion Risk
- **File Path (Relative)**: `backend/src/main/java/com/sms/service/PasswordResetService.java:140-209, 247-257`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\PasswordResetService.java:140-209, 247-257`
- **Related Locations**:
  - `backend/src/main/java/com/sms/service/EmailService.java:27-121`
  - `backend/src/main/resources/application.properties:14, 74-76`
- **Category**: Performance / Architectural Flaw
- **Severity**: High

#### Description & Root Cause Analysis
`PasswordResetService.approveRequest` and `batchApprove` are annotated with `@Transactional`. Inside the transaction:
```java
// PasswordResetService.java:186
boolean emailSent = onFileEmail != null && !onFileEmail.isBlank()
        && emailService.sendPasswordResetEmail(...);
```
`EmailService.sendPasswordResetEmail` performs a synchronous network request to `smtp.gmail.com:587` with a 5-second socket timeout (`application.properties:74-76`).
1. **Connection Pool Starvation**: `spring.datasource.hikari.maximum-pool-size=15`. When an admin executes `batchApprove` for 15 requests, 15 database connections are held open while waiting for external SMTP handshakes. This completely starves the pool, causing all other user requests to time out.
2. **Inconsistent State upon Rollback**: If an unhandled exception or commit failure occurs after the email is sent, the transaction rolls back. The student receives an email containing a password that was never committed to the database.

#### Actionable Recommendation
1. Separate email sending from the database transaction using Spring's `TransactionSynchronizationManager.registerSynchronization` or an asynchronous event (`ApplicationEventPublisher`):
```java
@Transactional
public PasswordResetResult approveRequest(...) {
    // 1. Commit DB changes
    ...
    // 2. Dispatch event after commit
    eventPublisher.publishEvent(new PasswordResetApprovedEvent(user, newPassword));
}

@Async
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void handlePasswordResetEmail(PasswordResetApprovedEvent event) {
    emailService.sendPasswordResetEmail(...);
}
```

---

### 7. ARCH-07: HTML Injection in Email Templates and Requester Email Relay Abuse
- **File Path (Relative)**: `backend/src/main/java/com/sms/service/EmailService.java:45-112, 137-151`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\EmailService.java:45-112, 137-151`
- **Related Locations**:
  - `backend/src/main/java/com/sms/service/PasswordResetService.java:233-238`
- **Category**: Security
- **Severity**: Medium

#### Description & Root Cause Analysis
1. In `EmailService.java:105, 150`, HTML templates are constructed using string interpolation:
```java
String htmlContent = """...""".formatted(fullName, roleDisplay, username, newPassword, ...);
```
The variables `fullName`, `username`, and `reason` are injected unescaped. If an attacker inputs HTML/JavaScript payloads (e.g. `<a href="phishing">Login</a>`) in their name or rejection reason, it renders in the recipient's mail client.
2. In `PasswordResetService.java:233-238`:
```java
emailService.sendRejectionEmail(
    request.getEmail(), // Requester-supplied unverified email!
    request.getFullName(),
    request.getUsername(),
    rejectRequest.getRejectReason()
);
```
While `approveRequest` carefully avoids `request.getEmail()` and looks up the on-file address, `rejectRequest` sends an email to whatever address the anonymous requester provided in `ForgotPasswordRequest`. This allows attackers to use the school's SMTP server as an open relay for spam/harassment.

#### Actionable Recommendation
1. Escape all dynamic variables using `org.springframework.web.util.HtmlUtils.htmlEscape`:
```java
String safeName = HtmlUtils.htmlEscape(fullName);
String safeReason = HtmlUtils.htmlEscape(reason);
```
2. Send rejection notifications only to verified on-file accounts:
```java
String onFileEmail = resolveOnFileEmail(targetUser, request.getRole());
if (onFileEmail != null) {
    emailService.sendRejectionEmail(onFileEmail, ...);
}
```

---

### 8. ARCH-08: Stateless JWT Auth Filter Bypassing Account Lifecycle & Inactive Status
- **File Path (Relative)**: `backend/src/main/java/com/sms/security/JwtAuthFilter.java:53-64`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\security\JwtAuthFilter.java:53-64`
- **Related Locations**:
  - `backend/src/main/java/com/sms/security/UserPrincipal.java:43-56`
  - `backend/src/main/java/com/sms/service/StudentService.java:144-150`
- **Category**: Security / Architectural Flaw
- **Severity**: High

#### Description & Root Cause Analysis
In `JwtAuthFilter.java:25`, `UserDetailsServiceImpl userDetailsService` is injected into the filter, but it is **never used**.
Instead, `JwtAuthFilter.java:56` calls:
```java
UserPrincipal userPrincipal = UserPrincipal.createFromClaims(claims);
```
Looking at `UserPrincipal.java:52-53`:
```java
true, // Giả định token còn hạn thì active
false, // Không có thông tin này trong JWT
```
This design completely ignores user account status in the database:
- If an admin deactivates an account (`user.setIsActive(false)`) or suspends a student (`StudentStatus.SUSPENDED`), the user's existing JWT token continues to authenticate successfully for all APIs until it expires (up to 24 hours).
- If a user changes their password, all previously issued tokens remain valid.

#### Actionable Recommendation
1. Check user status in `JwtAuthFilter` either via database lookup (`userDetailsService.loadUserByUsername`) or via a lightweight Redis/cache token revocation store:
```java
UserDetails userDetails = userDetailsService.loadUserByUsername(username);
if (!userDetails.isEnabled() || !userDetails.isAccountNonLocked()) {
    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Tài khoản đã bị khoá");
    return;
}
```
2. Alternatively, embed a `tokenVersion` or `passwordChangedAt` timestamp claim in the JWT and validate it against the database/cache.

---

### 9. ARCH-09: Unauthenticated Change-Password Vulnerability / NullPointerException in AuthController
- **File Path (Relative)**: `backend/src/main/java/com/sms/config/SecurityConfig.java:45`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\config\SecurityConfig.java:45`
- **Related Locations**:
  - `backend/src/main/java/com/sms/controller/AuthController.java:35-41`
- **Category**: Bug / Security
- **Severity**: Medium

#### Description & Root Cause Analysis
In `SecurityConfig.java:45`:
```java
.requestMatchers("/api/auth/**").permitAll()
```
Because `/api/auth/**` is marked `permitAll()`, unauthenticated requests can reach `AuthController.changePassword`:
```java
// AuthController.java:35-41
@PutMapping("/change-password")
public ResponseEntity<ApiResponse<Void>> changePassword(
        @AuthenticationPrincipal UserPrincipal user,
        @Valid @RequestBody ChangePasswordRequest request) {
    authService.changePassword(user.getId(), request);
    ...
```
When an unauthenticated request hits this endpoint, `user` is `null`. Invoking `user.getId()` throws a `NullPointerException` (HTTP 500 error).

#### Actionable Recommendation
1. In `SecurityConfig.java`, explicitly permit only public auth endpoints:
```java
.requestMatchers("/api/auth/login", "/api/auth/forgot-password").permitAll()
.requestMatchers("/api/auth/change-password").authenticated()
```
2. In `AuthController.java:35`, add a null check or `@PreAuthorize("isAuthenticated()")`:
```java
if (user == null) {
    throw new BadRequestException("Yêu cầu đăng nhập để đổi mật khẩu");
}
```

---

### 10. ARCH-10: Academic Program Disconnect: Administrative Class Creation Omits Major and Cohort
- **File Path (Relative)**: `backend/src/main/java/com/sms/dto/request/ClassRequest.java:8-20`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\dto\request\ClassRequest.java:8-20`
- **Related Locations**:
  - `backend/src/main/java/com/sms/service/ClassService.java:36-51`
  - `backend/src/main/java/com/sms/service/CurriculumService.java:33-36`
  - `backend/src/main/java/com/sms/service/EnrollmentService.java:168-180`
- **Category**: Architectural Flaw / Bug
- **Severity**: Medium

#### Description & Root Cause Analysis
In `ClassEntity.java:30-38`, `ClassEntity` has foreign keys `major_id` and `cohort_id`.
Both `CurriculumService.getMyCurriculum` (`CurriculumService.java:34`) and `EnrollmentService.assertInStudentCurriculum` (`EnrollmentService.java:170`) strictly depend on `student.getClassEntity().getMajor()` and `student.getClassEntity().getCohort()`.
However, `ClassRequest.java:8-20` contains only:
```java
private String code;
private String name;
private Integer departmentId;
private String academicYear;
```
`ClassService.create` and `ClassService.update` do not accept or persist `majorId` or `cohortId`. Any administrative class created via the web interface or API will have `major = null` and `cohort = null`.
Students enrolled in these classes will immediately receive errors when attempting to view their curriculum: `"Sinh viên chưa được gán chuyên ngành và khóa học để tra cứu chương trình đào tạo"`.

#### Actionable Recommendation
1. Update `ClassRequest.java` to include `majorId` and `cohortId`:
```java
@NotNull(message = "Chuyên ngành không được để trống")
private Integer majorId;
@NotNull(message = "Khóa học không được để trống")
private Integer cohortId;
```
2. Update `ClassService.java:36-63` to validate and set `Major` and `Cohort` references on `ClassEntity`.

---

### 11. ARCH-11: Grade Appeal Logic Inconsistency and Formula Distortion on Component 'ALL'
- **File Path (Relative)**: `backend/src/main/java/com/sms/service/GradeAppealService.java:130-149`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\GradeAppealService.java:130-149`
- **Related Locations**:
  - `backend/src/main/java/com/sms/entity/GradeAppeal.java:38`
- **Category**: Bug
- **Severity**: Medium

#### Description & Root Cause Analysis
In `GradeAppealService.java`:
1. When a student appeals with `ScoreComponent.ALL`, `readScore` returns the student's `totalScore`:
```java
// Line 135
case ALL -> grade.getTotalScore();
```
2. However, when the administrator approves the appeal, `applyNewScore` assigns `newScore` to `finalScore`:
```java
// Line 146
case FINAL, ALL -> grade.setFinalScore(newScore);
```
3. Immediately following, `grade.calculateTotalScore()` recalculates:
`totalScore = cc1 * 0.05 + cc2 * 0.05 + midterm * 0.3 + final * 0.6`.
If a student requested an adjustment of their total score from 7.0 to 8.0, the system sets `finalScore = 8.0` and recalculates `totalScore`, resulting in an unexpected, mathematically distorted grade.
4. Additionally, `ScoreComponent` contains `CC2`, `MIDTERM`, `FINAL`, `ALL`, but completely omits `CC1`.

#### Actionable Recommendation
1. If `ALL` represents direct manual override of the total score, prevent `calculateTotalScore()` from recalculating over it, or restrict appeals exclusively to specific constituent components (`CC1`, `CC2`, `MIDTERM`, `FINAL`).
2. Add `CC1` to `GradeAppeal.ScoreComponent` enum and handle it in `readScore` and `applyNewScore`.

---

### 12. ARCH-12: Non-Atomic In-Memory Sliding Window Rate Limiting and Unbounded Memory in Login Attempt Tracking
- **File Path (Relative)**: `backend/src/main/java/com/sms/config/RateLimitFilter.java:101-118`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\config\RateLimitFilter.java:101-118`
- **Related Locations**:
  - `backend/src/main/java/com/sms/service/LoginAttemptService.java:22-54`
- **Category**: Bad Practice / Performance
- **Severity**: Medium

#### Description & Root Cause Analysis
1. In `RateLimitFilter.java:105-117`:
```java
boolean tryConsume() {
    long now = System.currentTimeMillis();
    long start = windowStart.get();
    if (now - start > WINDOW_MS) {
        windowStart.set(now);
        count.set(1);
        return true;
    }
    return count.incrementAndGet() <= MAX_REQUESTS;
}
```
`windowStart.set(now)` and `count.set(1)` are not atomic together. Concurrent threads arriving simultaneously can race, overwriting each other's counts and allowing bursts beyond `MAX_REQUESTS`.
2. In `LoginAttemptService.java:22`:
```java
private final ConcurrentHashMap<String, AttemptInfo> attempts = new ConcurrentHashMap<>();
```
There is no periodic eviction for `attempts`. An attacker attempting logins with random non-existent usernames can continuously populate the map, leading to an unbounded memory leak. Furthermore, locking accounts solely by `username` allows unauthenticated attackers to lock out legitimate administrators.

#### Actionable Recommendation
1. Synchronize `tryConsume()` or use Bucket4j / Redis token bucket for atomic sliding window rate limiting.
2. In `LoginAttemptService`, add a `@Scheduled` cleanup task or use a bounded cache (such as Google Guava or Caffeine with `expireAfterWrite`) to auto-evict old attempts:
```java
private final Cache<String, AttemptInfo> attempts = Caffeine.newBuilder()
        .expireAfterWrite(15, TimeUnit.MINUTES)
        .maximumSize(10_000)
        .build();
```
3. Rate limit failed logins by `client_ip + username` rather than username alone.

---

### 13. ARCH-13: In-Memory Entity Caching and Leaky Transaction Management in SubjectController
- **File Path (Relative)**: `backend/src/main/java/com/sms/service/SubjectService.java:27-32`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\SubjectService.java:27-32`
- **Related Locations**:
  - `backend/src/main/java/com/sms/controller/SubjectController.java:20-38`
- **Category**: Architectural Flaw / Bad Practice
- **Severity**: Medium

#### Description & Root Cause Analysis
In `SubjectService.java:27-32`:
```java
@Cacheable(value = "subjects", key = "'all'")
public List<Subject> findAll() {
    List<Subject> subjects = subjectRepository.findAll();
    subjects.forEach(s -> org.hibernate.Hibernate.initialize(s.getPrerequisites()));
    return subjects;
}
```
Mutable JPA entities (`Subject`) are cached directly in Spring's default `ConcurrentMapCacheManager`.
Because `SubjectResponse.from(subject)` is called in `SubjectController`, the controller methods were annotated with `@Transactional(readOnly = true)`:
```java
// SubjectController.java:21
@GetMapping
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public ResponseEntity<ApiResponse<List<SubjectResponse>>> getAll() { ... }
```
Placing database transaction management onto web controllers violates MVC separation of concerns. If `Subject` entities stored in cache are modified in memory, the cache becomes corrupted across threads.

#### Actionable Recommendation
1. Cache immutable DTOs (`List<SubjectResponse>`) instead of JPA entities.
2. Perform the transformation inside `SubjectService`:
```java
@Cacheable(value = "subjects", key = "'all'")
public List<SubjectResponse> findAll() {
    return subjectRepository.findAllWithPrerequisites().stream()
            .map(SubjectResponse::from)
            .toList();
}
```
3. Remove all `@Transactional` annotations from `SubjectController.java`.

---

### 14. ARCH-14: Lack of Test Isolation and Embedded Test Database Setup
- **File Path (Relative)**: `backend/src/test/java/com/sms/StudentManagementApplicationTests.java:6-12`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\test\java\com\sms\StudentManagementApplicationTests.java:6-12`
- **Related Locations**:
  - `backend/pom.xml:90-100`
  - `backend/src/main/resources/application.properties:10-12`
- **Category**: Bad Practice / Build Setup
- **Severity**: Medium

#### Description & Root Cause Analysis
In `backend/src/test/java/com/sms/StudentManagementApplicationTests.java`:
```java
@SpringBootTest
class StudentManagementApplicationTests {
    @Test
    void contextLoads() {}
}
```
The test suite has no dedicated test database configuration:
- `backend/src/test/resources/application.properties` does not exist.
- H2 Database or Testcontainers are not declared in `pom.xml`.
When running `./mvnw test` or running tests in a CI/CD environment, Spring Boot attempts to connect to `jdbc:mysql://localhost:3306/student_management`. If MySQL is not running on port 3306, the entire test phase fails.

#### Actionable Recommendation
1. Add H2 database to `pom.xml`:
```xml
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>
```
2. Create `backend/src/test/resources/application-test.properties`:
```properties
spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=MySQL
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=create-drop
```
3. Annotate test classes with `@ActiveProfiles("test")`.

---

### 15. ARCH-15: Hardcoded Database Credentials and Plaintext Secrets in Compose Files
- **File Path (Relative)**: `docker-compose.yml:9, 36`, `docker-compose.override.yml:6`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\docker-compose.yml:9, 36`, `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\docker-compose.override.yml:6`
- **Related Locations**:
  - `backend/src/main/resources/application.properties:11-12, 45`
- **Category**: Security
- **Severity**: High

#### Description & Root Cause Analysis
1. `docker-compose.yml:9` specifies:
```yaml
MYSQL_ALLOW_EMPTY_PASSWORD: 'yes'
```
And line 36 sets `SPRING_DATASOURCE_PASSWORD: ""`. The database runs with an unauthenticated root user.
2. `docker-compose.override.yml:6` commits a hardcoded JWT secret:
```yaml
JWT_SECRET: "KY1L6HPEzkSRZBiJSxXIILsbKUwnCq8hxZ4sl6ZOjbPC1QNLrca/GeEebVpIHUue2zufgB0xddr68/Pjx4v6SA=="
```
Committing secret keys to version control allows anyone with repository access to forge administrative tokens.

#### Actionable Recommendation
1. Remove `MYSQL_ALLOW_EMPTY_PASSWORD` and configure strong passwords via a gitignored `.env` file.
2. Add `docker-compose.override.yml` to `.gitignore` and supply `docker-compose.override.yml.example` with placeholders.

---

### 16. ARCH-16: Dead / Orphan Domain Entities and Write-Only Data Flow
- **File Path (Relative)**: `backend/src/main/java/com/sms/entity/Notification.java:8-34`, `backend/src/main/java/com/sms/entity/StudentInvoice.java:9-56`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\entity\Notification.java:8-34`, `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\entity\StudentInvoice.java:9-56`
- **Related Locations**:
  - `backend/src/main/java/com/sms/service/scheduler/AcademicScheduler.java:65-70`
  - `backend/src/main/java/com/sms/service/SpecialClassService.java:128-138`
- **Category**: Architectural Flaw / Bad Practice
- **Severity**: Medium

#### Description & Root Cause Analysis
1. `AcademicScheduler.java:69` saves records to `NotificationRepository`:
```java
Notification notification = new Notification();
notification.setStudent(enrollment.getStudent());
notification.setMessage("Lớp " + section.getSectionCode() + " bị hủy do không đủ sĩ số đăng ký.");
notificationRepository.save(notification);
```
However, there is no `NotificationController`, no notification service, and no frontend notification UI. The table is purely write-only.
2. `SpecialClassService.java:136` creates records in `StudentInvoiceRepository`, but there are no controller endpoints for students to view their tuition invoices or for accountants to record payments.

#### Actionable Recommendation
1. Expose `NotificationController` with `GET /api/notifications/my` and `PUT /api/notifications/{id}/read` so students can receive and dismiss class cancellation alerts.
2. Expose `InvoiceController` with `GET /api/invoices/my` and `PUT /api/admin/invoices/{id}/pay` to close the billing feature loop.

---

### 17. ARCH-17: Lecturer Deactivation Incomplete (User Account Remains Active)
- **File Path (Relative)**: `backend/src/main/java/com/sms/service/LecturerService.java:122-126`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\LecturerService.java:122-126`
- **Related Locations**:
  - `backend/src/main/java/com/sms/service/StudentService.java:144-150`
- **Category**: Bug / Security
- **Severity**: High

#### Description & Root Cause Analysis
In `StudentService.updateStatus`, the linked `User` record's `isActive` flag is synchronized:
```java
// StudentService.java:146-148
boolean shouldBeActive = (parsedStatus == Student.StudentStatus.ACTIVE || ...);
user.setIsActive(shouldBeActive);
userRepository.save(user);
```
However, in `LecturerService.toggleActive`:
```java
// LecturerService.java:122-126
@Transactional
public void toggleActive(Long id) {
    Lecturer lecturer = findById(id);
    lecturer.setIsActive(!lecturer.getIsActive());
    lecturerRepository.save(lecturer);
}
```
The associated `User` entity (`lecturer.getUser().setIsActive(...)`) is completely ignored. Consequently, deactivating a lecturer disables only the lecturer record, leaving the login account active. Deactivated lecturers can still log in and view sensitive data.

#### Actionable Recommendation
Synchronize the associated user's `isActive` status in `LecturerService.toggleActive`:
```java
@Transactional
public void toggleActive(Long id) {
    Lecturer lecturer = findById(id);
    boolean newActive = !lecturer.getIsActive();
    lecturer.setIsActive(newActive);
    if (lecturer.getUser() != null) {
        lecturer.getUser().setIsActive(newActive);
        userRepository.save(lecturer.getUser());
    }
    lecturerRepository.save(lecturer);
}
```

---

### 18. ARCH-18: Excel Import Formula Rejection and Unbounded File Upload DOS
- **File Path (Relative)**: `backend/src/main/java/com/sms/service/ExcelImportService.java:184-233, 267`
- **File Path (Absolute)**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\ExcelImportService.java:184-233, 267`
- **Category**: Bug / Performance
- **Severity**: Medium

#### Description & Root Cause Analysis
In `ExcelImportService.java:184-233`:
1. `parseGradeImport` accepts `MultipartFile file` without verifying `file.getSize()`. An attacker or user uploading an extremely large spreadsheet (or a zip bomb) can exhaust server memory.
2. In `readScore(Cell cell, String label, List<String> errors)`:
```java
// Line 267
} else {
    return null; // BLANK / FORMULA / khác -> coi như bỏ trống
}
```
When teachers use formulas (such as `=(B2+C2)/2` or `=AVERAGE(...)`), Apache POI identifies the cell as `CellType.FORMULA`. The service treats all formula cells as blank and sets the score to `null`, silently losing the lecturer's calculated grades.

#### Actionable Recommendation
1. Enforce file size and format limits:
```java
if (file.getSize() > 5 * 1024 * 1024) {
    throw new BadRequestException("Kích thước file không được vượt quá 5MB");
}
```
2. Evaluate formulas using Apache POI's `FormulaEvaluator`:
```java
if (cell.getCellType() == CellType.FORMULA) {
    CellValue cellValue = wb.getCreationHelper().createFormulaEvaluator().evaluate(cell);
    if (cellValue.getCellType() == CellType.NUMERIC) {
        val = cellValue.getNumberValue();
    }
}
```

---

## Architecture Summary Matrix

| ID | Module / Component | Category | Severity | Primary Risk |
|---|---|---|---|---|
| ARCH-01 | Database / CourseSection | Bug / Architectural Flaw | Critical | Runtime DB errors when updating section status; unmanaged schema migrations |
| ARCH-02 | Security / GradeService | Security / Architecture | Critical | Unauthorized grade manipulation and bypass due to negative role check |
| ARCH-03 | Academic Warnings / Controller | Performance / Architecture | High | 5000+ query storm causing server timeouts and memory exhaustion |
| ARCH-04 | DTO & Controller Layer | Architectural Flaw | High | Data leakage and unpredictable null fields from direct entity serialization |
| ARCH-05 | CourseSection / DB Triggers | Bug / Concurrency | High | JPA entity saves silently overwriting database trigger enrollment counters |
| ARCH-06 | PasswordReset / EmailService | Performance / Architecture | High | Synchronous SMTP blocking HikariCP connections in active DB transactions |
| ARCH-07 | EmailService | Security | Medium | HTML injection in emails and open email relay exploitation |
| ARCH-08 | JwtAuthFilter / Security | Security / Architecture | High | Deactivated/suspended accounts remain active until JWT expiration |
| ARCH-09 | AuthController | Bug / Security | Medium | NullPointerException on unauthenticated change-password endpoint |
| ARCH-10 | Class Management / Curriculum | Architecture / Bug | Medium | Newly created classes break curriculum view due to missing major/cohort |
| ARCH-11 | GradeAppealService | Bug | Medium | Grade recalculation formula distorted when appealing component 'ALL' |
| ARCH-12 | Rate Limiting / Brute Force | Bad Practice / Performance | Medium | Race conditions in rate limiter and memory leak in login attempt tracker |
| ARCH-13 | SubjectService / Controller | Architecture / Bad Practice | Medium | Controller-level transactions and caching of mutable JPA entities |
| ARCH-14 | Build / Test Suite | Bad Practice / Build Setup | Medium | Unit tests fail in clean environment due to missing embedded test DB |
| ARCH-15 | Docker / Configuration | Security | High | Empty database root password and committed static JWT secret |
| ARCH-16 | Domain Model / Invoices | Architecture | Medium | Write-only orphan tables without corresponding retrieval endpoints |
| ARCH-17 | LecturerService | Bug / Security | High | Deactivated lecturers retain active user login access |
| ARCH-18 | ExcelImportService | Bug / Performance | Medium | Spreadsheets with formulas silently lose scores; unconstrained upload size |

---

## Synthesis & Implementation Roadmap

To systematically resolve these issues and elevate the codebase to enterprise production grade, the following phased approach is recommended:

### Phase 1: Security & Critical Data Integrity (Immediate)
1. **Fix Schema Mismatch & Migrations**: Update `database/schema.sql` enum and introduce Flyway for versioned migrations (ARCH-01).
2. **Harden Role Authorization**: Enforce strict `@PreAuthorize` on `GradeController` and replace negative `lecturer == null` checks with explicit `hasRole("ADMIN")` checks (ARCH-02).
3. **Protect Account Lifecycle in JWT**: Verify account status in `JwtAuthFilter` so deactivated users cannot access APIs (ARCH-08, ARCH-17).
4. **Sanitize Secrets**: Move JWT secrets and DB passwords strictly to environment variables (ARCH-15).

### Phase 2: Architecture & Concurrency Stability (High Priority)
1. **Decouple JPA and Triggers**: Make `CourseSection.currentStudents` read-only (`updatable=false`) or transition trigger logic cleanly into Java transaction services (ARCH-05).
2. **Decouple Email from DB Transactions**: Implement `@Async` and `@TransactionalEventListener(AFTER_COMMIT)` for SMTP operations (ARCH-06).
3. **Implement DTO Boundaries**: Introduce request/response DTOs for `ClassEntity`, `Student`, and `CourseSection`, eliminating entity leakage (ARCH-04).
4. **Link Classes to Academic Programs**: Add `majorId` and `cohortId` to `ClassRequest` and `ClassService` (ARCH-10).

### Phase 3: Performance & Robustness (Medium Priority)
1. **Refactor Academic Warnings**: Replace the N+1 loop in `AcademicWarningController` with a paginated DB aggregation query (ARCH-03).
2. **Formula & Upload Support in Excel**: Add POI `FormulaEvaluator` and file size validation (ARCH-18).
3. **Hermetic Test Suite**: Add H2 in-memory database configuration for Maven tests (ARCH-14).
4. **Complete Orphan Domain Features**: Expose notification and invoice endpoints for end-to-end functionality (ARCH-16).
