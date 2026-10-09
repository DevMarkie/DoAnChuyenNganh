# Handoff Report — Challenger 2 (Recommendation Feasibility)

## 1. Observation
Across `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\code_review_report.md` and the SMS repository:
- **Obs 1 (BUG-02 Syntax Error)**: In `code_review_report.md:405`, snippet specifies `if (section.getLecturer() != null && !scheduleRepository.findLecturerConflicts(section.getLecturer().getId(), ...))`. In `ScheduleRepository.java`, `findLecturerConflicts` returns `List<Schedule>`. In Java, the operator `!` is undefined for type `List<Schedule>`.
- **Obs 2 (BUG-06 Access Violation)**: In `code_review_report.md:579`, snippet calls `grade.calculateLetterGrade()`. In `backend/src/main/java/com/sms/entity/Grade.java:116`, declaration is `private void calculateLetterGrade()`. In Java, invoking this from `GradeAppealService` generates `calculateLetterGrade() has private access in com.sms.entity.Grade`.
- **Obs 3 (PERF-03 Missing Dependency)**: In `code_review_report.md:667`, snippet uses `Caffeine.newBuilder()`. In `backend/pom.xml:70-113`, no Caffeine dependency (`com.github.ben-manes.caffeine:caffeine`) is present.
- **Obs 4 (SEC-04 Authentication Lockout)**: In `code_review_report.md:615-623`, recommendation secures `PUT /api/auth/change-password` via `SecurityConfig` and `AuthController`. In `backend/src/main/java/com/sms/security/JwtAuthFilter.java:25-45`, `PUBLIC_PATHS` includes `"/api/auth/**"`, causing `shouldNotFilter()` to bypass JWT parsing for `/api/auth/change-password`. Spring Security sees an unauthenticated request and always responds with HTTP 401 Unauthorized.
- **Obs 5 (ARCH-01 Schema Duplication)**: In `code_review_report.md:117`, recommendation splits migration into `V1__initial_schema.sql` (from `schema.sql`) and `V2__special_class_billing.sql` (from `migrate_special_class_billing.sql`). In `database/schema.sql:281-285, 300-346`, the columns (`section_type`, `scale_coefficient`, etc.) and tables (`class_opening_requests`, `student_invoices`) from `migrate_special_class_billing.sql` are already declared. Flyway will crash on V2 execution with `Duplicate column name` / `Table already exists`.
- **Obs 6 (ARCH-03 Frontend UI Breakage)**: In `code_review_report.md:300-307`, recommendation adds `@NotNull majorId` and `@NotNull cohortId` to `ClassRequest`. In `frontend/src/pages/admin/ClassesPage.jsx:45-75, 258-305`, the modal form only submits `{ code, name, departmentId, academicYear }`, omitting both fields and causing all admin class creations/updates to fail with HTTP 400 Bad Request.
- **Obs 7 (ARCH-04 Broken Nested DTO)**: In `code_review_report.md:654`, recommendation proposes `ClassResponse(Integer id, String code, String name, Integer departmentId, String departmentName)`. In `frontend/src/pages/admin/ClassesPage.jsx:93, 97, 175`, code accesses `c.department?.id`, `c.department?.name`, `c.department?.code`. Flattening the DTO causes department filters and displays to become undefined.
- **Obs 8 (PERF-01 Business Rule Distortion & Field Dropping)**: In `code_review_report.md:204-224`, native query filters `v.cumulative_gpa < 2.0`. In `TranscriptService.java:184`, university regulations only apply CPA warnings from semester 2 onward (`semesters.size() >= 2`), while semester warnings depend on consecutive semesters with `semesterGpa < 1.0`. The proposed query misclassifies freshmen, drops semester warnings, ignores `AcademicWarningsPage.jsx` filters (`semesterId`, `level`), and omits UI fields (`warningLevel`, `warningNotice`, `semesterGpa`, `semesterName`).
- **Obs 9 (BUG-05 Incomplete GPA Nulling)**: In `code_review_report.md:538`, recommendation sets `semesterGpa = null` when `semCredits == 0`. In `TranscriptService.java:146-148`, `cumulativeGpa` remains `BigDecimal.ZERO` when `gpaCredits == 0`, continuing to trigger `"Kém"` classification and warnings.
- **Obs 10 (PERF-02 Silent Synchronous Fallback)**: In `code_review_report.md:455`, recommendation applies `@Async` and `@TransactionalEventListener(AFTER_COMMIT)`. Across `backend/src/main/java`, `@EnableAsync` is not declared on any `@Configuration` class, making `@Async` a silent no-op.

## 2. Logic Chain
1. If code snippets in a report fail Java compilation (Obs 1, 2, 3), developers or automated pipelines attempting to apply them will encounter broken builds.
2. If an authentication endpoint is made `.authenticated()` while the JWT filter skips all tokens under that parent path (Obs 4), the endpoint becomes completely unreachable, locking users out of essential account operations.
3. If an incremental database migration repeats DDL statements that already executed in the baseline schema (Obs 5), the migration tool aborts on duplicate object definitions, crashing application startup.
4. If a backend request DTO introduces mandatory `@NotNull` fields that the frontend form neither collects nor transmits (Obs 6), all UI-initiated operations against that endpoint fail with HTTP 400 client validation errors.
5. If response DTO restructuring flattens nested object graphs that client-side components rely on (Obs 7), UI state and rendering will silently degrade or fail.
6. If an SQL query designed to replace an in-memory loop fails to implement the institutional business logic rules and drops parameters used by the frontend (Obs 8), the optimization corrupts domain data integrity.
7. Therefore, while `code_review_report.md` delivers high-quality problem discovery (score: 95/100), its proposed recommendations require technical remediation (feasibility score: 68/100) before implementation.

## 3. Caveats
- The audit focused specifically on the feasibility, correctness, safety, and side-effects of the 30 recommendations against the existing backend, frontend, database, and configuration files.
- Live HTTP load-testing of concurrent client traffic was evaluated via static concurrency model inspection (HikariCP pool size 15 vs transaction boundaries) rather than real stress harnesses.

## 4. Conclusion
The recommendation set in `code_review_report.md` cannot be applied blindly. While the issues identified are genuine and critical, 9 specific recommendations require immediate technical correction:
- Correct compile errors in `BUG-02`, `BUG-06`, `PERF-03`.
- Update `JwtAuthFilter` alongside `SecurityConfig` in `SEC-04`.
- Unify Flyway baseline in `ARCH-01`.
- Coordinate frontend form updates in `ARCH-03` and preserve nested objects in `ARCH-04`.
- Re-architect academic warnings aggregation in `PERF-01`.
- Complete cumulative GPA null handling in `BUG-05`.
- Add `@EnableAsync` in `PERF-02`.

## 5. Verification Method
1. **Compilation Check**:
   - Inspect `Grade.java:116` to verify visibility of `calculateLetterGrade()`.
   - Inspect `ScheduleRepository.java` to verify return type of `findLecturerConflicts()`.
   - Inspect `pom.xml` to verify absence of `caffeine`.
2. **Filter Bypass Check**:
   - View `JwtAuthFilter.java:25-45` and verify `PUBLIC_PATHS` includes `"/api/auth/**"`.
3. **Database Schema Check**:
   - View `database/schema.sql:280-346` and compare against `database/migrations/migrate_special_class_billing.sql:4-57` to verify column and table duplication.
4. **Frontend Form Contract Check**:
   - View `frontend/src/pages/admin/ClassesPage.jsx:45-75` to verify submitted payload fields.
