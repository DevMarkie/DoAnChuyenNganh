# Handoff Report: Architectural & Backend Investigation

**Agent**: Architectural & Backend Explorer  
**Task Folder**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\.agents\teamwork\teamwork_preview_explorer_survey_1`  
**Handoff Type**: Hard (Task Complete)  
**Parent Orchestrator**: `ad291400-5188-4dc5-ad00-d758e825fdd5`  
**Detailed Report**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\.agents\teamwork\teamwork_preview_explorer_survey_1\survey_report.md`

---

## 1. Observation

Direct code observations with exact line numbers and quotations from the codebase:

1. **Schema Enum Mismatch**:
   - `database/schema.sql:288`: `status ENUM('OPEN', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',`
   - `backend/src/main/java/com/sms/entity/CourseSection.java:87-89`: `public enum SectionStatus { OPEN, ACTIVE, CLOSED, CANCELLED, PENDING_FEE, LOCKED_BILLING }`
   - `backend/src/main/java/com/sms/service/scheduler/AcademicScheduler.java:76`: `section.setStatus(CourseSection.SectionStatus.ACTIVE);`
   - `backend/src/main/java/com/sms/service/SpecialClassService.java:87, 123`: `section.setStatus(CourseSection.SectionStatus.PENDING_FEE);` and `LOCKED_BILLING`.
   - `database/migrations/migrate_special_class_billing.sql:10-12`: Contains an unapplied manual migration script adding these enum values, but no automated migration tool (Flyway/Liquibase) is present in `pom.xml:24-113`.

2. **Negative Authorization Flaw in Grade Management**:
   - `backend/src/main/java/com/sms/service/GradeService.java:66-69`:
     ```java
     Lecturer lecturer = lecturerRepository.findByUserId(userId).orElse(null);
     if (lecturer == null) {
         return; // admin — toàn quyền xem
     }
     ```
   - `backend/src/main/java/com/sms/service/GradeService.java:287-291`:
     ```java
     if (lecturer == null && Boolean.FALSE.equals(request.getFinalize())) {
         grade.setIsFinalized(false);
         grade.setFinalizedAt(null);
     ```
   - `backend/src/main/java/com/sms/controller/GradeController.java:99-111`: Methods `saveGrade` and `saveGrades` lack `@PreAuthorize`.
   - `backend/src/main/java/com/sms/config/SecurityConfig.java:73`: Only maps `HttpMethod.PUT, "/api/grades/**"` to `hasAnyRole('ADMIN', 'LECTURER')`. Exact URI `/api/grades` without trailing subpaths can fall through to `.anyRequest().authenticated()`.

3. **N+1 Query Storm in Academic Warnings**:
   - `backend/src/main/java/com/sms/controller/AcademicWarningController.java:33-46`:
     ```java
     List<AcademicWarningResponse> warnings = studentService.findAll().stream()
             .filter(...)
             .map(student -> transcriptService.getTranscript(student.getId()))
             .filter(...)
     ```
   - Executes 1 student fetch query plus N individual `gradeRepository.findFinalizedByStudentId` queries sequentially in the web thread.

4. **JPA Entity Leakage and Jackson Null Serialization**:
   - `backend/src/main/java/com/sms/controller/ClassController.java:25`: `public ResponseEntity<ApiResponse<List<ClassEntity>>> getAll()`
   - `backend/src/main/java/com/sms/controller/StudentController.java:28`: `public ResponseEntity<ApiResponse<List<Student>>> getAll()`
   - `backend/src/main/java/com/sms/config/JacksonConfig.java:14`: `module.configure(Hibernate6Module.Feature.FORCE_LAZY_LOADING, false);`
   - `backend/src/main/resources/application.properties:27`: `spring.jpa.open-in-view=false`. Uninitialized lazy proxies are silently serialized as `null`.

5. **Lost Updates Between Trigger and JPA Flush**:
   - `database/schema.sql:506-532`: `trg_enrollment_insert_after` increments `course_sections.enrolled_count`.
   - `backend/src/main/java/com/sms/entity/CourseSection.java:51-53`: `@Column(name = "enrolled_count", nullable = false) private Integer currentStudents = 0;` (no `@Generated` or dynamic update).
   - `backend/src/main/java/com/sms/service/CourseSectionService.java:116`: `courseSectionRepository.save(section)` writes stale Java in-memory `currentStudents` over the trigger-updated count.

6. **Synchronous SMTP Blocking HikariCP in Transaction**:
   - `backend/src/main/java/com/sms/service/PasswordResetService.java:140-209, 247-257`: `@Transactional` wraps `approveRequest` and `batchApprove`.
   - `backend/src/main/java/com/sms/service/EmailService.java:114`: Synchronous `mailSender.send(message)` with 5-second timeout while holding DB connection.
   - `backend/src/main/resources/application.properties:14`: `spring.datasource.hikari.maximum-pool-size=15`.

7. **Bypassing Inactive Status in Stateless JWT Filter**:
   - `backend/src/main/java/com/sms/security/JwtAuthFilter.java:56`: `UserPrincipal.createFromClaims(claims);` (never queries `userDetailsService`).
   - `backend/src/main/java/com/sms/security/UserPrincipal.java:52`: Hardcoded `true` for active status. Deactivated users retain access until token expiry.

8. **Unauthenticated Change Password Endpoint**:
   - `backend/src/main/java/com/sms/config/SecurityConfig.java:45`: `.requestMatchers("/api/auth/**").permitAll()`
   - `backend/src/main/java/com/sms/controller/AuthController.java:35-41`: `@PutMapping("/change-password")` accesses `user.getId()` where `user` is `null` for unauthenticated callers, producing `NullPointerException` (500).

9. **Academic Structure Disconnect**:
   - `backend/src/main/java/com/sms/dto/request/ClassRequest.java:8-20`: Omits `majorId` and `cohortId`.
   - `backend/src/main/java/com/sms/service/ClassService.java:44-51`: Creates classes without major or cohort.
   - `backend/src/main/java/com/sms/service/CurriculumService.java:34`: Throws exception for classes without major/cohort.

10. **Lecturer Deactivation Omission**:
    - `backend/src/main/java/com/sms/service/LecturerService.java:122-126`: Only toggles `lecturer.setIsActive()`, leaving `lecturer.getUser().getIsActive()` true.

---

## 2. Logic Chain

1. **From Observation 1**: Because `CourseSection.SectionStatus` contains `ACTIVE`, `PENDING_FEE`, and `LOCKED_BILLING` which do not exist in `schema.sql`'s enum column, any execution of `AcademicScheduler` or `SpecialClassService` on a freshly bootstrapped MySQL database will fail with a data truncation error. Because there is no Flyway/Liquibase migration tool, manual scripts in `database/migrations/` are not executed in Docker or deployment environments.
2. **From Observation 2**: Because `GradeService` checks `lecturerRepository.findByUserId(userId).orElse(null) == null` and treats that as admin, and because students also produce `null`, students can act as administrators if they reach `GradeService`. Because `PUT /api/grades` lacks method-level security and path pattern matching in `SecurityConfig` is incomplete, the system has a severe authorization bypass vulnerability.
3. **From Observation 3**: Because `AcademicWarningController` retrieves the full student list and loops through each student to query grades, running this endpoint executes O(N) queries on the database. In a production environment with thousands of students, this exhausts connection pools and causes HTTP 504 gateway timeouts.
4. **From Observation 4**: Because entities are returned directly while `open-in-view=false` and Jackson's `FORCE_LAZY_LOADING` is disabled, uninitialized lazy proxies serialize as `null`. This exposes internal DB schema, leaks internal User audit fields, and breaks frontend API contracts unpredictably.
5. **From Observation 5**: Because `CourseSection.enrolled_count` is updated directly by MySQL triggers on enrollment insertion, but JPA updates the entire entity without `@DynamicUpdate` or `@Generated`, saving a course section via `CourseSectionService.update` silently overwrites and resets the enrollment counter to stale values.
6. **From Observation 6**: Because SMTP calls are synchronous and embedded inside `@Transactional` methods (`approveRequest`, `batchApprove`), the HikariCP connection (limited to 15 connections) remains occupied during slow network I/O. A batch of 15 requests can exhaust the connection pool and lock the application. If the transaction rolls back, emails with invalid credentials will have already been dispatched.
7. **From Observation 7 & 10**: Because `JwtAuthFilter` constructs `UserPrincipal` solely from JWT claims with `active = true`, and because `LecturerService.toggleActive` leaves `User.isActive` untouched, deactivated lecturers and suspended students continue to access all authorized APIs until their JWT expires.

---

## 3. Caveats

- **Frontend Integration**: This investigation focused primarily on backend architecture, API endpoints, database schemas, security, and configurations. Frontend component behavior was checked for routing and DTO compatibility, but UI/UX design and browser rendering were not exhaustively profiled.
- **Dynamic Runtime Load**: Performance impacts (such as HikariCP pool starvation and the N+1 query storm) were deduced from static call chain analysis and configuration values (`maximum-pool-size=15`), but not executed against a 100,000-student benchmark database.
- No alternative interpretations exist for the schema enum mismatch or negative role authorization check; they are unambiguous logic and configuration flaws.

---

## 4. Conclusion

The system has a clean architectural blueprint and comprehensive functional modules, but suffers from **18 identifiable architectural, security, and concurrency issues**. The most critical vulnerabilities are:
1. Schema enum incompatibility breaking automated background schedulers (ARCH-01).
2. Negative role deduction in `GradeService` creating an authorization bypass hazard (ARCH-02).
3. Stateless JWT verification ignoring database account status / deactivation flags (ARCH-08, ARCH-17).
4. Synchronous network I/O inside database transactions starving HikariCP (ARCH-06).
5. O(N) sequential query storms in `AcademicWarningController` (ARCH-03).
6. JPA updates overwriting database trigger-managed `enrolled_count` (ARCH-05).

All 18 findings have been cataloged in `survey_report.md` with file locations, line numbers, category, severity, root causes, and actionable code recommendations.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Schema Enum Mismatch (ARCH-01)**:
   - Inspect `database/schema.sql:288` vs `backend/src/main/java/com/sms/entity/CourseSection.java:87-89`.
   - Attempt an insert or update in MySQL with `status = 'ACTIVE'`:
     ```sql
     UPDATE course_sections SET status = 'ACTIVE' WHERE id = 1;
     ```
   - In standard MySQL with `STRICT_TRANS_TABLES`, this fails with `Data truncated for column 'status'`.

2. **Verify Negative Authorization Check (ARCH-02)**:
   - Inspect `backend/src/main/java/com/sms/service/GradeService.java:66-69, 287-291`.
   - Check if `lecturerRepository.findByUserId(studentUserId)` returns empty `Optional`. Since it does, `lecturer == null` evaluates to true, verifying that students satisfy the admin branch condition.

3. **Verify N+1 Query Storm (ARCH-03)**:
   - Inspect `backend/src/main/java/com/sms/controller/AcademicWarningController.java:33-46`.
   - Observe `studentService.findAll().stream().map(student -> transcriptService.getTranscript(student.getId()))`.
   - Enable SQL query logging (`logging.level.org.hibernate.SQL=DEBUG` in `application.properties`) and call `GET /api/academic-warnings` to confirm N separate SELECT statements executed sequentially.

4. **Verify Trigger Overwrite Bug (ARCH-05)**:
   - Inspect `database/schema.sql:506-532` and `backend/src/main/java/com/sms/entity/CourseSection.java:51-53`.
   - Notice absence of `@org.hibernate.annotations.Generated` on `currentStudents` and absence of `@DynamicUpdate` on `CourseSection`.

5. **Verify Test Failure in Hermetic Environment (ARCH-14)**:
   - Run Maven test command in a clean terminal without local MySQL running:
     ```bash
     cd backend && ./mvnw test -Dtest=StudentManagementApplicationTests
     ```
   - It will fail with `CannotGetJdbcConnectionException: Could not create connection to database: Connection refused`.
