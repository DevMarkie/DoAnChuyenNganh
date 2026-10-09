## 2026-10-08T17:24:24Z

You are a Worker subagent (Code Review Report Author).
Your working directory is: c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\.agents\teamwork\teamwork_preview_worker_m2
Your parent is the Project Orchestrator (conversation ID: ad291400-5188-4dc5-ad00-d758e825fdd5).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY FIRST STEP:
Read the user's original request file verbatim before doing anything else:
Path: c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\.agents\teamwork\ORIGINAL_REQUEST.md

EXCLUSIVELY OWNED TARGET FILE:
c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\code_review_report.md
You exclusively own this file. You are authorized to write and finalize it.

Relevant Skill:
Review and apply the principles from:
`c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\.agents\skills\code-review-and-quality\SKILL.md`

Input Sources to Review:
1. `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\.agents\teamwork\orchestrator_1\PROJECT.md`
2. `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\.agents\teamwork\teamwork_preview_explorer_survey_1\survey_report.md`
3. `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\.agents\teamwork\teamwork_preview_explorer_survey_2\survey_report.md`
4. `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\.agents\teamwork\teamwork_preview_explorer_survey_3\survey_report.md`
5. You may also inspect the codebase files directly to verify exact line numbers and code snippets.

Mission & Acceptance Criteria:
Generate the comprehensive master code review report at:
`c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\code_review_report.md`

The report MUST satisfy all user requirements and acceptance criteria:
1. R1: Detailed Finding Report - Comprehensive markdown report detailing all identified bugs, architectural flaws, security vulnerabilities, performance bottlenecks, and bad practices.
2. R2: Actionable Recommendations - For EVERY issue identified, provide a concrete, actionable recommendation on how to fix or improve it, including replacement code snippets or concrete configuration diffs.
3. Acceptance Criteria 1: Every issue MUST cite specific file paths and exact line numbers (e.g., `backend/src/main/java/com/sms/service/GradeService.java:66-69`).
4. Acceptance Criteria 2: Every issue MUST have a concrete, actionable recommendation for fixing it.
5. Acceptance Criteria 3: Saved as `code_review_report.md` in the project root (`c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\code_review_report.md`).

Report Structure Requirements:
1. Title and Metadata (Project Name, Review Date, Scope, Reviewers, Overall Health Score)
2. Executive Summary (High-level architecture assessment, breakdown of findings by severity and category)
3. Severity Matrix & Summary Table (ID, Category, Severity, Title, File Location & Line Numbers, Recommendation Summary)
4. Deep-Dive Section 1: Critical & High Severity Issues (Detailed description, Root Cause, Exact File & Line Range, Vulnerability/Bug Impact, Concrete Remediation Code Snippet)
5. Deep-Dive Section 2: Medium & Low Severity Issues (Detailed description, Root Cause, Exact File & Line Range, Impact, Concrete Remediation Code Snippet)
6. Architectural & Design Flaws Analysis (System boundaries, DB schema vs Entity mapping, Data consistency, Concurrency & Transactions)
7. Security & Hardening Analysis (OWASP assessment: Injection, Auth, CORS, Secrets)
8. Performance & Scalability Analysis (Query efficiency, N+1 patterns, Connection pool contention, Memory leaks)
9. Code Quality, Smells & Test Suite Evaluation (Code duplication, Dead code, Extraneous test suites, Missing test coverage)
10. Prioritized Remediation Roadmap (Phase 1: Immediate/Blockers, Phase 2: High Priority, Phase 3: Medium/Architectural, Phase 4: Quality & Hygiene)

Deliverables:
- Save the master report to `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\code_review_report.md`.
- Save your completion handoff report to `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\.agents\teamwork\teamwork_preview_worker_m2\handoff.md`.
- Send a completion message via `send_message` back to parent `ad291400-5188-4dc5-ad00-d758e825fdd5`.
