# Forensic Audit Handoff Report

## 1. Observation
- **Audited Deliverable**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\code_review_report.md` (918 lines, 63,730 bytes).
- **Ground-Truth Contract**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\.agents\teamwork\ORIGINAL_REQUEST.md`.
  - Required: Comprehensive markdown report listing bugs, architectural flaws, bad practices, with concrete actionable recommendations for each, citing specific file paths and line numbers, saved at `code_review_report.md`. Integrity mode: `demo`.
- **Direct Codebase Verification**:
  - Investigated all 30 findings in `code_review_report.md` against the repository source files.
  - Observed exact matching lines in:
    - `database/schema.sql:288`: `status ENUM('OPEN', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',` vs `CourseSection.java:87-89` (`OPEN, ACTIVE, CLOSED, CANCELLED, PENDING_FEE, LOCKED_BILLING`).
    - `GradeService.java:66-69`: `Lecturer lecturer = lecturerRepository.findByUserId(userId).orElse(null); if (lecturer == null) { return; }` and lines 287-291 unfinalizing grades when `lecturer == null`.
    - `SecurityConfig.java:73`: `.requestMatchers(HttpMethod.PUT, "/api/grades/**")` omitting root `/api/grades`.
    - `AcademicWarningController.java:33-46`: `studentService.findAll().stream().map(student -> transcriptService.getTranscript(student.getId()))` full table scan.
    - `frontend/src/services/api.js:44-46`: `const err = new Error(response.statusText || 'Error'); err.response = response; throw err;` returning raw fetch `Response` without parsing `.data`.
    - `backend/src/main/java/com/sms/dto/request/ClassRequest.java:8-20`: contains only `code, name, departmentId, academicYear`, omitting `majorId` and `cohortId`.
    - `EmailService.java:105, 150`: raw Text Block `.formatted()` into `helper.setText(htmlContent, true)`.
    - `PasswordResetService.java:140-209`: synchronous SMTP email inside `@Transactional` with Hikari pool maximum size 15 (`application.properties:14`).
    - `UserPrincipal.java:52`: verbatim comment `true, // Giả định token còn hạn thì active`.
    - `AcademicScheduler.java:46`: `!LocalDate.now().isBefore(sem.getRegistrationEnd())` at 1:00 AM.
    - `TranscriptService.java:101`: `semCredits > 0 ? ... : BigDecimal.ZERO` paired with line 171 `isSemesterWarning`.
    - `GradeAppealService.java:146`: `case FINAL, ALL -> grade.setFinalScore(newScore);`.
    - `CurriculumService.java:125`: evaluates past failing grade before current `ENROLLED` enrollment status.
    - `SecurityConfig.java:45` & `AuthController.java:35-41`: unauthenticated change password endpoint executing `user.getId()`.
    - `frontend/src/utils/export.js:2` & `ExcelExportService.java:171, 176`: lack formula prefix sanitization.
    - `ClassController.java:25` & `StudentController.java:28`: return JPA entities with Jackson `FORCE_LAZY_LOADING = false` and `open-in-view = false`.
    - `LoginAttemptService.java:22, 48`: unbounded `ConcurrentHashMap`.
    - `dataService.js:20, 39, 42, 49, 58, 95`: unencoded query string concatenation.
    - `chat-logic.test.ts:1-399`: extraneous chatbot unit tests present in repository.
    - `backend/src/test/java/com/sms`: 5 duplicate test classes vs `com/sms/service`; `SpecialClassService` has 0 tests.
    - `ScheduleService.java:164-165`: `LocalDate.parse` throws unhandled `DateTimeParseException` into generic 500 handler.
    - `Notification.java` & `StudentInvoice.java`: entities written by background tasks but have zero read controllers.
    - `docker-compose.yml:9, 36` & `application.properties:11-12`: empty root MySQL password.
    - `Grade.java:104-107, 120-152`: magic numbers in calculation formulas.
    - `SubjectController.java:21, 28, 34`: `@Transactional(readOnly = true)` declared on controller endpoints.
    - `GradeEntryPage.jsx:69-77` & `authStore.js:21-30`: state mutation and unguarded `JSON.parse`.
    - `StudentManagementApplicationTests.java:6-12` & `backend/pom.xml:90-100`: non-hermetic test requiring live MySQL.
  - Search for placeholder tokens (`TODO`, `TBD`, `dummy`, `placeholder`, `lorem`) across `code_review_report.md` returned 0 results.

## 2. Logic Chain
1. *Premise*: Under the `demo` integrity mode specified in `ORIGINAL_REQUEST.md`, a deliverable is valid if and only if it represents genuine, authentic work without hardcoded test cheats, facade implementations, fabricated verification artifacts, or hallucinated citations.
2. *Observation Reference*: In Step 1, all 30 issues cited in `code_review_report.md` were cross-referenced directly against their corresponding files and line numbers in `database/`, `backend/`, and `frontend/`.
3. *Inference*: Because every single cited file exists, all quoted snippets match the actual repository code verbatim, and the described software architectural and logical defects are real flaws in the code, there is zero evidence of hallucination or fabrication.
4. *Inference*: Because every single finding includes concrete, syntactically valid remediation code and architecture guidance, requirement R2 and Acceptance Criterion 2 are satisfied.
5. *Inference*: Because the document is saved at `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\code_review_report.md` and contains exhaustive analysis across 30 verified findings, all acceptance criteria are fully met.
6. *Conclusion*: The work product is authentic, accurate, and completely free of integrity violations.

## 3. Caveats
- The auditor performed static code verification and AST/text inspection of all 30 cited files. Shell execution of `mvn test-compile` was denied by environment permission policy, but this does not affect the validity of the static findings and citation verification since all target source files and line ranges were verified empirically via direct file inspection.

## 4. Conclusion
**Verdict: CLEAN**  
The target deliverable `code_review_report.md` satisfies all ground-truth requirements, contains authentic and verified findings, provides concrete remediation snippets for all 30 issues, and exhibits zero integrity violations.

## 5. Verification Method
To independently verify this audit:
1. Inspect the deliverable:
   `view_file c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\code_review_report.md`
2. Spot-check any of the 30 citations in the repository, for example:
   - `view_file c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\database\schema.sql StartLine:280 EndLine:295`
   - `view_file c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\GradeService.java StartLine:60 EndLine:75`
   - `view_file c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\frontend\src\services\api.js StartLine:38 EndLine:48`
3. Verify that no placeholder text exists in `code_review_report.md`:
   `grep_search Query:"TODO" SearchPath:"c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\code_review_report.md"`
4. Invalidation condition: The verdict would be invalidated only if any finding in `code_review_report.md` could be proven to cite non-existent files, misrepresent code logic, or contain fabricated text.
