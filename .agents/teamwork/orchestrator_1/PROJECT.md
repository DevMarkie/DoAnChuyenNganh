# Project: Codebase Review & Quality Report (Student Management System)

## Architecture
- **Backend**: Spring Boot 3.3.4, Java 21, Spring Security 6.3, Spring Data JPA / Hibernate, MySQL 8.0, JWT (`io.jsonwebtoken 0.12.5`), HikariCP.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios / Custom fetch wrapper (`api.js`).
- **Database & Infrastructure**: MySQL 8.0 (`database/schema.sql`, `seed.sql`), Docker Compose, Nginx.
- **Project Structure**:
  - `backend/src/main/java/com/sms/`: Controllers, Services, Entities, DTOs, Security, Config, Exceptions.
  - `frontend/src/`: Components, Pages (Admin, Lecturer, Student), Services (`api.js`, `dataService.js`), Contexts, Hooks.
  - `database/`: `schema.sql`, `seed.sql`, `migrations/`.

---

## Feature Inventory / Defect Catalog

Synthesized and deduplicated from 3 independent Explorer surveys (62 raw observations merged into 30 distinct high-impact findings):

| # | Finding ID | Title / Issue | Category | Severity | Key Files & Line Citations | Milestone |
|---|------------|---------------|----------|----------|----------------------------|-----------|
| 1 | ARCH-01 | Database Schema Enum Mismatch (`SectionStatus`) | Architectural / Bug | Critical | `database/schema.sql:288`, `backend/src/main/java/com/sms/entity/CourseSection.java:87-89`, `AcademicScheduler.java:76`, `SpecialClassService.java:87,123` | M2 |
| 2 | ARCH-02 | Negative Authorization Flaw in Grade Management | Security / Bug | Critical | `backend/src/main/java/com/sms/service/GradeService.java:66-69, 287-291`, `GradeController.java:99-111`, `SecurityConfig.java:73` | M2 |
| 3 | PERF-01 | N+1 Full-Scan Query Storm & Memory Exhaustion | Performance / Architecture | Critical | `backend/src/main/java/com/sms/controller/AcademicWarningController.java:33-46`, `frontend/src/pages/admin/AcademicWarningsPage.jsx:32-39` | M2 |
| 4 | BUG-01 | Frontend `api.js` Error Swallowing Breaking All UI Error Toasts | Bug / Frontend | Critical | `frontend/src/services/api.js:44-46`, `frontend/src/pages/student/EnrollPage.jsx:70-75` (and 25+ pages) | M2 |
| 5 | ARCH-03 | Class Creation DTO Omits Major and Cohort Relations | Architecture / Bug | Critical | `backend/src/main/java/com/sms/dto/request/ClassRequest.java:8-20`, `ClassService.java:44-51`, `CurriculumService.java:34` | M2 |
| 6 | SEC-01 | Unsanitized Email Templates Leading to HTML Injection / Spam Relay | Security | High | `backend/src/main/java/com/sms/service/EmailService.java:45-114, 137-154`, `PasswordResetService.java:234` | M2 |
| 7 | SEC-02 | Wildcard CORS Allowed Origin Patterns with Credentials Enabled | Security | High | `backend/src/main/resources/application.properties:55`, `backend/src/main/java/com/sms/config/SecurityConfig.java:100-117` | M2 |
| 8 | BUG-02 | Null Lecturer Dereference on Unassigned Course Sections (HTTP 500) | Bug / Reliability | High | `backend/src/main/java/com/sms/service/GradeService.java:229`, `CourseSectionService.java:157` | M2 |
| 9 | BUG-03 | Lost Updates: JPA Entity Flush Overwrites MySQL Trigger-Managed Enrolled Count | Concurrency / Bug | High | `database/schema.sql:506-532`, `CourseSection.java:51-53`, `CourseSectionService.java:116` | M2 |
| 10 | PERF-02 | Synchronous SMTP Inside DB Transaction Blocking HikariCP Pool | Performance / Architecture | High | `backend/src/main/java/com/sms/service/PasswordResetService.java:140-209, 247-257`, `EmailService.java:114`, `application.properties:14` | M2 |
| 11 | SEC-03 | Stateless JWT Filter Ignores Database User Account Inactive/Disabled Status | Security | High | `backend/src/main/java/com/sms/security/JwtAuthFilter.java:56`, `UserPrincipal.java:52`, `LecturerService.java:121-126` | M2 |
| 12 | BUG-04 | Premature Auto-Cancellation of Classes at 1:00 AM on Final Registration Day | Bug / Business Logic | High | `backend/src/main/java/com/sms/service/scheduler/AcademicScheduler.java:46`, `Semester.java:79` | M2 |
| 13 | BUG-05 | False Positive Academic Warnings & Standing for Zero Graded Credits | Bug / Business Logic | High | `backend/src/main/java/com/sms/service/TranscriptService.java:99-109, 171` | M2 |
| 14 | BUG-06 | Grade Appeal for Total Score Corrupts Final Exam Score Component | Bug / Business Logic | High | `backend/src/main/java/com/sms/service/GradeAppealService.java:146-148` | M2 |
| 15 | BUG-07 | Curriculum Retake Status Logic Inversion (Retaking shows Retake-Required instead of Enrolled) | Bug / Business Logic | Medium | `backend/src/main/java/com/sms/service/CurriculumService.java:124-128` | M2 |
| 16 | SEC-04 | Unauthenticated Change Password Endpoint Triggers NPE (500) | Security / Bug | Medium | `backend/src/main/java/com/sms/config/SecurityConfig.java:45`, `AuthController.java:35-41` | M2 |
| 17 | SEC-05 | CSV and Excel Formula Injection Vulnerability | Security | Medium | `frontend/src/utils/export.js:2`, `backend/src/main/java/com/sms/service/ExcelExportService.java:171` | M2 |
| 18 | ARCH-04 | JPA Entity Leakage and Jackson Null Serialization on Lazy Proxies | Architecture / API | Medium | `backend/src/main/java/com/sms/controller/ClassController.java:25`, `StudentController.java:28`, `JacksonConfig.java:14`, `application.properties:27` | M2 |
| 19 | PERF-03 | Unbounded In-Memory Cache in `LoginAttemptService` Causing Memory Leak | Performance / Memory | Medium | `backend/src/main/java/com/sms/service/LoginAttemptService.java:22, 48` | M2 |
| 20 | SEC-06 | Client-Side URI Query Parameter Injection in `dataService.js` | Security | Medium | `frontend/src/services/dataService.js:20, 39, 42, 49, 58, 95` | M2 |
| 21 | QUAL-01 | Test Suite Pollution: Extraneous AI Chatbot Tests in Frontend | Code Quality / Testing | Medium | `frontend/src/tests/chat-logic.test.ts`, `tests/chat-logic.test.ts`, `tests/slash-command-menu.spec.ts` | M2 |
| 22 | QUAL-02 | Test Suite Duplication and Gaps: Untested `SpecialClassService` & Duplicate Classes | Code Quality / Testing | Medium | `backend/src/test/java/com/sms/` vs `com/sms/service/`, `SpecialClassService.java` (0% coverage) | M2 |
| 23 | BUG-08 | Unhandled `DateTimeParseException` on Schedule Date Queries (HTTP 500) | Bug / Error Handling | Medium | `backend/src/main/java/com/sms/service/ScheduleService.java:164` | M2 |
| 24 | ARCH-05 | Dead Data Models and Missing Endpoints for Invoices & Notifications | Architecture / Maintenance | Medium | `backend/src/main/java/com/sms/entity/Invoice.java`, `Notification.java` | M2 |
| 25 | SEC-07 | Database Credentials Default to Blank Root Password in Configuration | Security / DevOps | Medium | `backend/src/main/resources/application.properties:11-12`, `docker-compose.yml:9` | M2 |
| 26 | CODE-01 | Hardcoded Magic Numbers in Academic Formulas Across Services | Bad Practice / Clean Code | Low | `GradeAppealService.java:146`, `TranscriptService.java:100`, `Grade.java:128` | M2 |
| 27 | CODE-02 | Inconsistent Error Handling: Raw Exceptions vs `AppException` | Bad Practice / Architecture | Low | `ScheduleService.java:164`, `ClassService.java:48` | M2 |
| 28 | CODE-03 | Direct Repository Calls Bypassing Service Abstraction in Controllers | Bad Practice / Architecture | Low | `GradeController.java:42`, `AttendanceController.java:38` | M2 |
| 29 | CODE-04 | Frontend Inconsistent State Management & Missing Prop Validation | Bad Practice / Frontend | Low | `frontend/src/components/`, `frontend/src/pages/` | M2 |
| 30 | ENV-01 | Non-Hermetic Build: Unit Tests Require Running Local MySQL Server | DevOps / Testing | Low | `backend/src/test/java/com/sms/StudentManagementApplicationTests.java` | M2 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Codebase Survey & Exploration | 3 parallel Explorers surveying Architecture, Logic, Security & Practices | none | DONE |
| M2 | Report Drafting (`code_review_report.md`) | Dispatch Worker to synthesize and format findings into standard deliverable | M1 | IN_PROGRESS |
| M3 | Multi-Axis Independent Verification & Audit | 2 Reviewers + 2 Challengers + 1 Forensic Auditor evaluate report against acceptance criteria | M2 | PLANNED |
| M4 | Gate Approval & Final Delivery | Orchestrator aggregates verdicts, verifies compliance, delivers to caller | M3 | PLANNED |

---

## Acceptance Criteria
- [ ] An independent reviewer agent must confirm that every issue in the report cites specific file paths and line numbers.
- [ ] An independent reviewer agent must confirm that every issue has a concrete, actionable recommendation for fixing it.
- [ ] The report must be saved as `code_review_report.md` in the working directory (`c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\code_review_report.md`).
- [ ] Forensic Auditor reports CLEAN verdict (no fake/hardcoded findings, authentic codebase analysis).
