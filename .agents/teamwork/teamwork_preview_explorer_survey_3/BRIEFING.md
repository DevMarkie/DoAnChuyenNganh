# BRIEFING — 2026-10-08T17:21:40Z

## Mission
Investigate workspace for Security vulnerabilities (OWASP Top 10, Auth, Secrets, Injections), Performance bottlenecks (N+1, leaks, streams, computations), and Code Smells / Bad Practices (God classes, DRY/SOLID violations, magic numbers). Produce a comprehensive survey report and handoff.

## 🔒 My Identity
- Archetype: explorer
- Roles: Security & Clean Code Explorer
- Working directory: c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\.agents\teamwork\teamwork_preview_explorer_survey_3
- Original parent: ad291400-5188-4dc5-ad00-d758e825fdd5
- Milestone: Security & Clean Code Survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Every finding MUST cite exact relative and absolute file paths, and exact line numbers/ranges
- Every finding MUST classify category and severity (Critical, High, Medium, Low)
- Every finding MUST provide risk/impact and concrete, actionable recommendation
- Write findings to survey_report.md and completion handoff to handoff.md

## Current Parent
- Conversation ID: ad291400-5188-4dc5-ad00-d758e825fdd5
- Updated: 2026-10-08T17:21:40Z

## Investigation State
- **Explored paths**: `backend/src/main/resources/application.properties`, `SecurityConfig.java`, `JwtAuthFilter.java`, `UserPrincipal.java`, `EmailService.java`, `PasswordResetService.java`, `GradeService.java`, `CourseSectionService.java`, `StudentService.java`, `LecturerService.java`, `AcademicWarningController.java`, `TranscriptService.java`, `SpecialClassService.java`, `CurriculumService.java`, `LoginAttemptService.java`, `RateLimitFilter.java`, `frontend/src/utils/export.js`, `frontend/src/services/api.js`, `frontend/src/services/dataService.js`, `frontend/src/pages/lecturer/GradeEntryPage.jsx`, `frontend/src/pages/admin/AcademicWarningsPage.jsx`, `frontend/nginx.conf`, `database/schema.sql`, `database/seed.sql`, `docker-compose.yml`, test directories.
- **Key findings**: 22 high-fidelity findings cataloged: 7 security vulnerabilities (HTML injection/spam relay, wildcard CORS + credentials, formula injection, stateless JWT revocation bypass, blank db passwords, auth NPE, nginx headers), 6 performance bottlenecks (critical O(N) warnings query with no pagination, broken UI pagination contract, unbounded login attempts map, repeated queries in billing, nested N+1 in curriculum, full table re-render on keystroke), and 9 code smells (NPE risks on null lecturer, unencoded query string concatenation, broken class-curriculum contract, dead notification/invoice data, alien Antigravity tests, magic numbers, entity coupling).
- **Unexplored areas**: None within the requested scope. All primary backend, frontend, database, and infrastructure layers inspected.

## Key Decisions Made
- Structured findings into clear severity levels (1 Critical, 3 High, 11 Medium, 7 Low) with verifiable line references and concrete code recommendations.
- Produced detailed `survey_report.md` and complete 5-component `handoff.md`.

## Artifact Index
- survey_report.md — Detailed survey report with all 22 security, performance, and code smell findings
- handoff.md — 5-component handoff report (Observation, Logic Chain, Caveats, Conclusion, Verification Method)
- progress.md — Liveness and status heartbeat
