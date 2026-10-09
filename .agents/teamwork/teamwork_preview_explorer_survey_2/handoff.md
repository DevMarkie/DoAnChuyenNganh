# Handoff Report — Logic & Quality Explorer

**Agent**: Logic & Quality Explorer (`teamwork_preview_explorer_survey_2`)  
**Parent**: Project Orchestrator (`ad291400-5188-4dc5-ad00-d758e825fdd5`)  
**Timestamp**: 2026-10-08T17:21:00Z  
**Report Artifact**: `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\.agents\teamwork\teamwork_preview_explorer_survey_2\survey_report.md`

---

## 1. Observation

Direct code inspections across `backend` and `frontend` revealed specific discrepancies:

1. **Frontend API Error Extraction**: In `frontend/src/services/api.js:44-46`:
   ```javascript
   const err = new Error(response.statusText || 'Error');
   err.response = response;
   throw err;
   ```
   Directly assigning the raw fetch `Response` to `err.response` ensures `err.response.data` is always `undefined`. In `frontend/src/pages/student/EnrollPage.jsx:70`, `const message = err.response?.data?.message;` evaluates to `undefined`, triggering the fallback on line 75: `toast.error(message || "Đăng ký thất bại. Vui lòng thử lại.")`. This pattern is replicated across 25+ UI pages.
2. **Curriculum Status Resolution**: In `backend/src/main/java/com/sms/service/CurriculumService.java:124-128`:
   ```java
   private SubjectStatus resolveStatus(Grade grade, Enrollment enrollment) {
       if (grade != null) return gradeScore(grade).compareTo(BigDecimal.ONE) >= 0 ? SubjectStatus.PASSED : SubjectStatus.RETAKE_REQUIRED;
       return enrollment != null && enrollment.getStatus() == Enrollment.EnrollmentStatus.ENROLLED
               ? SubjectStatus.ENROLLED : SubjectStatus.NOT_ENROLLED;
   }
   ```
   When a student is actively retaking a course they previously failed (`grade != null` with F and active `enrollment`), `grade != null` is evaluated first, producing `SubjectStatus.RETAKE_REQUIRED` instead of `ENROLLED`.
3. **Class Entity Relations Missing in DTO**: In `backend/src/main/java/com/sms/dto/request/ClassRequest.java:1-21`, fields `majorId` and `cohortId` are absent. In `ClassService.java:45-50`, `cls.setMajor()` and `cls.setCohort()` are never invoked. In `CurriculumService.java:34-36`, `classEntity.getMajor() == null` throws `BadRequestException`.
4. **Zero Graded Credits in GPA Calculation**: In `backend/src/main/java/com/sms/service/TranscriptService.java:99-109`:
   ```java
   BigDecimal semesterGpa = semCredits > 0
           ? semWeightedGpa.divide(BigDecimal.valueOf(semCredits), 2, RoundingMode.HALF_UP)
           : BigDecimal.ZERO;
   ```
   Line 108 passes `BigDecimal.ZERO` to `classifyAcademicStanding`, returning `"Kém"`. Line 171 checks `semesterGpa.compareTo(BigDecimal.ONE) < 0`, returning `true` (warning level 1).
5. **Grade Appeal Score Calculation**: In `backend/src/main/java/com/sms/service/GradeAppealService.java:146-148`:
   ```java
   case FINAL, ALL -> grade.setFinalScore(newScore);
   ...
   grade.calculateTotalScore();
   ```
   An appeal for `ALL` (Total Score) overwrites `finalScore` with `newScore` and recomputes the weighted formula `CC1*0.05 + CC2*0.05 + Midterm*0.30 + newScore*0.60`.
6. **Premature Auto-Cancellation**: In `backend/src/main/java/com/sms/service/scheduler/AcademicScheduler.java:46`:
   ```java
   if (sem.getRegistrationEnd() != null && !LocalDate.now().isBefore(sem.getRegistrationEnd()))
   ```
   On the last day of registration (`now.isEqual(registrationEnd)`), `!now.isBefore(registrationEnd)` is true at 1:00 AM, cancelling classes while `Semester.isRegistrationOpen()` remains true until midnight.
7. **Security & Unhandled Exceptions**:
   - `backend/src/main/java/com/sms/service/LecturerService.java:121-126`: `toggleActive` does not update `user.setIsActive()`.
   - `backend/src/main/java/com/sms/controller/AuthController.java:35-41`: `@PutMapping("/change-password")` under `permitAll()` throws unhandled NPE on unauthenticated requests.
   - `backend/src/main/java/com/sms/service/ScheduleService.java:164`: `LocalDate.parse()` produces unhandled `DateTimeParseException` mapped to HTTP 500.
   - `backend/src/main/java/com/sms/service/EmailService.java:105-111`: Raw `.formatted()` without HTML escaping introduces HTML injection vectors.
   - `backend/src/main/java/com/sms/controller/AcademicWarningController.java:33-46`: `studentService.findAll().stream().map(student -> transcriptService.getTranscript(student.getId()))` causes full table scans and sequential N+1 query execution.

---

## 2. Logic Chain

1. **Client Error Masking Chain**:
   - *Observation*: `api.js` throws an error with `err.response = response` (Fetch Response instance) without parsing the body.
   - *Reasoning*: Because `fetch` Response does not have a `.data` property, `err.response.data` is `undefined`.
   - *Impact*: Every page calling `err.response?.data?.message` receives `undefined` and displays a generic fallback string. Users never receive actionable backend validation error messages.

2. **Curriculum Roadmap Inaccessibility Chain**:
   - *Observation*: `ClassRequest` has no `majorId` or `cohortId`.
   - *Reasoning*: Any class created via the admin UI has `major == null` and `cohort == null`.
   - *Impact*: Students in newly created classes trigger `CurriculumService.getMyCurriculum:35`, blocking access to their degree progress roadmap.

3. **Academic Standing Inaccuracy Chain**:
   - *Observation*: `TranscriptService` defaults `semesterGpa` to `BigDecimal.ZERO` when `semCredits == 0`.
   - *Reasoning*: Students with non-numeric marks (e.g. Incomplete 'I', Exemption 'M') have `semCredits == 0`.
   - *Impact*: `0.00` is evaluated as `< 1.0`, triggering false-positive academic warnings and ranking the student as "Kém".

4. **Premature Class Cancellation Chain**:
   - *Observation*: `AcademicScheduler` checks `!LocalDate.now().isBefore(sem.getRegistrationEnd())` at 1:00 AM.
   - *Reasoning*: On the last day of registration, `now.equals(end)` satisfies `!isBefore()`.
   - *Impact*: Open classes under minimum capacity are cancelled 23 hours before registration ends, denying students their final enrollment window.

5. **Performance Degradation Chain**:
   - *Observation*: `AcademicWarningController` loads `studentService.findAll()` and executes `getTranscript` per student in a stream.
   - *Reasoning*: `getTranscript` makes multiple DB queries for enrollments, sections, subjects, and grades.
   - *Impact*: For thousands of students, this triggers tens of thousands of sequential SQL calls, freezing backend threads and exhausting database connections.

---

## 3. Caveats

- **Runtime Test Execution Denied**: Execution of `.\mvnw.cmd test` was denied by the user environment prompt during the turn. Analysis was performed through comprehensive static code analysis, AST inspection, and direct test file review.
- **Database Trigger Integration**: The database schema includes triggers (`trg_enrollment_insert_after`, `trg_enrollment_update_after`). In-memory JPA dirty checking alongside database triggers requires careful coordination to avoid stale state overwrites in `SpecialClassService`.

---

## 4. Conclusion

The SMS codebase contains robust core architectural foundations, but suffers from critical integration disconnects:
1. The frontend error handling contract is broken at the foundational `api.js` abstraction layer.
2. Key academic workflows (curriculum tracking, class creation, grade appeals, academic standing) contain edge-case logic defects that distort student academic records.
3. Automated test coverage is uneven: `SpecialClassService` is untested, duplicate legacy test suites exist in `backend`, and frontend tests test third-party slash commands rather than student portal workflows.

A total of 22 findings have been documented with file paths, line ranges, categories, severities, and concrete replacement code in `survey_report.md`.

---

## 5. Verification Method

1. **Verify Frontend API Error Handling**:
   - Inspect `frontend/src/services/api.js` lines 38–47 and verify that `err.response` lacks `.data`.
   - In a test browser or test runner, mock a 400 Bad Request with `{ "success": false, "message": "Custom Error" }` and observe whether `err.response.data.message` is accessible.
2. **Verify Curriculum Retake Status Logic**:
   - Inspect `backend/src/main/java/com/sms/service/CurriculumService.java` lines 124–128.
   - Trace with a student having a previous failing grade (`grade.getGpaPoint() = 0.0`) and an active enrollment (`enrollment.getStatus() = ENROLLED`).
3. **Verify Class Entity Relations**:
   - Inspect `backend/src/main/java/com/sms/dto/request/ClassRequest.java` lines 1–21 and `backend/src/main/java/com/sms/service/ClassService.java` lines 36–63.
   - Observe that `majorId` and `cohortId` are missing.
4. **Verify Academic Scheduler Date Boundary**:
   - Inspect `backend/src/main/java/com/sms/service/scheduler/AcademicScheduler.java` line 46 and compare with `backend/src/main/java/com/sms/entity/Semester.java` line 79.
   - Evaluate both when `LocalDate.now().isEqual(sem.getRegistrationEnd())`.
5. **Verify Email HTML Injection**:
   - Inspect `backend/src/main/java/com/sms/service/EmailService.java` lines 105–111 and 137–151.
   - Note the absence of `HtmlUtils.htmlEscape()`.
