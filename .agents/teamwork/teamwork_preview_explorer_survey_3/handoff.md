# Handoff Report — Codebase Survey: Security, Performance & Code Quality

**Agent**: `teamwork_preview_explorer_survey_3` (Explorer Archetype)  
**Parent Agent**: `ad291400-5188-4dc5-ad00-d758e825fdd5`  
**Timestamp**: 2026-10-08T17:23:00Z  
**Type**: Hard Handoff (Investigation & Survey Complete)  
**Artifact Reference**: Full 22-finding detailed catalog located at `survey_report.md` in the current working directory (`c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\.agents\teamwork\teamwork_preview_explorer_survey_3\survey_report.md`).

---

## 1. Observation

A systematic read-only investigation of the entire Student Management System repository (`DoAnChuyenNganh`) was performed covering:
- **Backend**: Spring Boot 3.3.4, Java 21, Spring Security 6.3, Spring Data JPA, Hibernate, JWT (`io.jsonwebtoken 0.12.5`).
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios.
- **Database & Deployment**: MySQL 8.0 (`database/schema.sql`, `seed.sql`), Docker Compose, Nginx.
- **Test Suites**: Backend JUnit 5 unit/integration tests and frontend Vitest/Playwright tests.

The following primary observations were directly verified and cataloged across 22 specific findings:

### 1.1 Critical Performance Bottleneck: Unbounded Full-Dataset Traversal & N+1 Queries
- **File**: `backend/src/main/java/com/sms/academicwarning/AcademicWarningController.java`, lines 33-45
```java
List<Student> allStudents = studentService.findAll();
List<AcademicWarningResponse> warnings = allStudents.stream()
        .map(student -> {
            TranscriptResponse transcript = transcriptService.getTranscript(student.getId());
            return evaluateWarnings(student, transcript);
        })
        .flatMap(List::stream)
        .toList();
return ResponseEntity.ok(ApiResponse.success(warnings));
```
- **File**: `frontend/src/pages/admin/AcademicWarningsPage.jsx`, lines 32-39
```javascript
const res = await warningService.getAll({ page: currentPage, size: 10, ...filters });
// Backend actually returns ApiResponse<List<AcademicWarningResponse>> without Spring Page pagination metadata!
```
- **Impact**: In a realistic cohort of 2,000+ students, hitting `/api/academic-warnings` triggers 4,000+ SQL queries within a single HTTP request, loading the entire student transcript history into heap memory simultaneously. Furthermore, the frontend pagination controls expect `{ totalPages, totalElements }`, causing pagination controls to break completely.

### 1.2 High Severity Security Vulnerabilities: HTML Injection / Open Spam Relay & Wildcard CORS
- **File**: `backend/src/main/java/com/sms/mail/EmailService.java`, lines 45-114, 137-154
```java
// Lines 45-114: sendRegistrationRejectionEmail
String body = """
        ...
        <p>Lý do từ chối: <strong>%s</strong></p>
        ...
        """.formatted(reason);
helper.setText(body, true); // HTML mode enabled
helper.setTo(toEmail);      // Sent to unverified recipient supplied in registration request
```
- **File**: `backend/src/main/java/com/sms/auth/PasswordResetService.java`, line 234
```java
emailService.sendPasswordResetEmail(user.getEmail(), resetUrl);
// resetUrl contains unescaped token parameter concatenated into HTML template
```
- **File**: `backend/src/main/resources/application.properties`, line 55
- **File**: `backend/src/main/java/com/sms/common/config/SecurityConfig.java`, lines 100-117
```properties
cors.allowed-origins=http://localhost:5173,http://localhost:3000,https://*.trycloudflare.com,https://*.github.io
```
```java
configuration.setAllowedOriginPatterns(Arrays.asList(allowedOrigins.split(",")));
configuration.setAllowCredentials(true);
```
- **Impact**: Any user or external script can submit arbitrary HTML/CSS via the rejection `reason` parameter to an unverified email address, creating an authenticated spam relay and credential phishing vector. The wildcard CORS patterns (`https://*.trycloudflare.com`, `https://*.github.io`) paired with `allowCredentials(true)` allow any attacker hosting a script on TryCloudflare or GitHub Pages to steal or manipulate session-authenticated data.

### 1.3 High Severity Reliability Bug: Null Lecturer Dereference (HTTP 500)
- **File**: `backend/src/main/java/com/sms/grade/GradeService.java`, line 229
```java
if (currentUser.getRole() == Role.LECTURER && 
    !section.getLecturer().getId().equals(currentUser.getId())) {
    throw new AppException(ErrorCode.FORBIDDEN);
}
```
- **File**: `backend/src/main/java/com/sms/coursesection/CourseSectionService.java`, line 157
```java
if (currentUser.getRole() == Role.LECTURER && 
    !section.getLecturer().getId().equals(currentUser.getId())) { ... }
```
- **Impact**: `section.getLecturer()` can be null when a course section is newly created or unassigned. If any lecturer attempts to view or verify access to such a section, a raw `NullPointerException` is thrown, resulting in an unhandled HTTP 500 error instead of a graceful access check.

### 1.4 Additional Key Security & Architectural Observations
- **CSV / Excel Formula Injection**: `frontend/src/utils/export.js:2` and `backend/src/main/java/com/sms/grade/ExcelExportService.java:171` output user strings directly without prepending `'` or sanitizing leading `=`, `+`, `-`, `@`.
- **JWT Status Bypass**: `backend/src/main/java/com/sms/security/JwtAuthFilter.java:56` and `backend/src/main/java/com/sms/security/UserPrincipal.java:52` hardcode `user.isActive = true` or only check username from claims; suspended accounts retain access until token expiration.
- **Database Credentials Exposure**: `backend/src/main/resources/application.properties:11-12` and `docker-compose.yml:9` configure `spring.datasource.password=` (blank root password) and `root` user by default.
- **Unbounded Memory Leak**: `backend/src/main/java/com/sms/auth/LoginAttemptService.java:22,48` stores failed attempts in a raw `ConcurrentHashMap<String, Integer>` without TTL, eviction policy, or maximum capacity.
- **Client-Side URI Injection**: `frontend/src/services/dataService.js:20,39,42,49,58,95` interpolates search parameters (`?keyword=${keyword}`) without `encodeURIComponent()`.
- **Foreign / Contaminating Test Suites**: `frontend/src/tests/chat-logic.test.ts`, `tests/chat-logic.test.ts`, and `tests/slash-command-menu.spec.ts` test AI chat agents and slash menus, completely unrelated to the Student Management System.

---

## 2. Logic Chain

1. **Step 1 (Performance Exhaustion)**:
   - *Premise*: `AcademicWarningController.java` streams through `studentService.findAll()`.
   - *Observation*: For each student, `transcriptService.getTranscript()` is invoked sequentially.
   - *Deduction*: Because `transcriptService.getTranscript()` issues multiple queries per student (grades, course sections, subjects), the overall query complexity is $\mathcal{O}(N)$ in queries and $\mathcal{O}(N)$ in memory loading.
   - *Conclusion*: A single request from an administrator on `/api/academic-warnings` can saturate the database connection pool, exhaust heap memory, and trigger a denial-of-service condition for the entire application.

2. **Step 2 (Security Boundary Breaches)**:
   - *Premise*: Trusting external inputs in emails and cross-origin requests.
   - *Observation*: `EmailService.java` injects `reason` into an HTML template formatted string and sends it to `request.getEmail()` before account verification. `SecurityConfig.java` enables credentials on wildcard origin patterns.
   - *Deduction*: An unauthenticated registrant can trigger an email containing arbitrary HTML formatting (such as phishing forms or deceptive links) to any target email address under the legitimate institutional domain. Furthermore, an attacker hosting a page on `*.trycloudflare.com` or `*.github.io` can make authenticated cross-site requests with user cookies/tokens.
   - *Conclusion*: Institutional reputation is exposed to blacklisting via open spam/phishing relays, and authenticated user sessions can be hijacked cross-origin.

3. **Step 3 (Data Integrity and Reliability Gaps)**:
   - *Premise*: Optional relationships in relational models must be safely handled in service layers.
   - *Observation*: In `CourseSection`, `lecturer` is nullable, but `GradeService` and `CourseSectionService` invoke `section.getLecturer().getId()` without null guards.
   - *Deduction*: Any business operation on unassigned sections by a lecturer user results in an uncaught `NullPointerException`.
   - *Conclusion*: The application crashes with 500 Internal Server Errors under common operational workflows where courses have not yet been assigned a lecturer.

4. **Step 4 (Architectural & Maintenance Overhead)**:
   - *Premise*: Unused code, alien test suites, and schema disconnects increase cognitive load and defect rates.
   - *Observation*: Notification and Invoice entities are persisted but lack retrieval endpoints; Antigravity chat tests reside in the test suite; class creation API drops major/cohort associations.
   - *Deduction*: Engineers working on features inherit dead code paths and failing/misleading tests.
   - *Conclusion*: Removing dead code, fixing entity contracts, and cleaning tests directly reduces future maintenance debt.

---

## 3. Caveats

1. **Static Analysis & Code-Level Verification Scope**:
   - Findings were identified via direct source inspection, call-hierarchy tracing, and architectural auditing.
   - Live load testing (e.g., JMeter, k6) was not executed due to read-only explorer constraints; performance impacts are inferred mathematically from algorithmic complexity ($\mathcal{O}(N)$ database round-trips).
2. **Environment Variable Configuration**:
   - `application.properties` defines default fallback values (`root` with blank password, wildcard CORS). In production deployments, these may be overridden via environment variables or container configurations (`MYSQL_PASSWORD`, `CORS_ALLOWED_ORIGINS`). However, insecure defaults in the repository represent an inherent supply-chain vulnerability.
3. **Mail Server Availability**:
   - Email sending failures will bubble up if SMTP is unconfigured; however, when configured, the HTML injection and relay mechanisms remain fully exploitable as written.

---

## 4. Conclusion

The SMS codebase possesses a well-structured foundational architecture (Spring Boot 3 + React + Tailwind) with clear layered packaging, standardized `ApiResponse<T>` wrappers, and comprehensive JPA entities. However, critical vulnerabilities and architectural bottlenecks require remediation before production readiness:

1. **Immediate Priorities (Critical & High)**:
   - **PERF-01**: Refactor `/api/academic-warnings` to support server-side pagination and execute a dedicated batch query (e.g., query students with GPA < threshold directly in MySQL) rather than scanning the entire student population in JVM memory.
   - **SEC-01**: Sanitize all email input parameters with OWASP Java HTML Sanitizer or `HtmlUtils.htmlEscape()`, and restrict rejection notifications to verified addresses.
   - **SEC-02**: Remove wildcard CORS origin patterns (`*.trycloudflare.com`, `*.github.io`) from `SecurityConfig.java` and enforce strict whitelist domains.
   - **SMELL-01**: Add null safety checks (`section.getLecturer() != null`) in `GradeService.java:229` and `CourseSectionService.java:157`.

2. **Secondary Priorities (Medium)**:
   - Implement formula escaping in `export.js` and `ExcelExportService.java`.
   - Add database user lookup in `JwtAuthFilter` to verify `user.isActive == true`.
   - Evict or enforce Guava Cache TTL on `LoginAttemptService` memory structures.
   - Encode query parameters in `frontend/src/services/dataService.js`.
   - Clean up alien chatbot tests (`tests/chat-logic.test.ts`, etc.).

---

## 5. Verification Method

To independently verify these findings, run the following inspection commands and test executions:

### 5.1 Verification Commands
```bash
# 1. Verify compilation and test suite status of Backend
cd "c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend"
./mvnw clean test

# 2. Verify compilation and test suite status of Frontend
cd "c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\frontend"
npm test
npm run build
```

### 5.2 Direct Code Line Inspection Points
1. **Academic Warning N+1**: Inspect `backend/src/main/java/com/sms/academicwarning/AcademicWarningController.java:33-45`. Notice the call to `studentService.findAll()` followed by `stream().map(student -> transcriptService.getTranscript(student.getId()))`.
2. **Email Injection**: Inspect `backend/src/main/java/com/sms/mail/EmailService.java:45-114`. Verify `reason` is formatted directly into HTML without escaping.
3. **CORS Wildcards**: Inspect `backend/src/main/resources/application.properties:55` and `backend/src/main/java/com/sms/common/config/SecurityConfig.java:100-117`.
4. **Lecturer Null Dereference**: Inspect `backend/src/main/java/com/sms/grade/GradeService.java:229` and `backend/src/main/java/com/sms/coursesection/CourseSectionService.java:157`.
5. **CSV Injection**: Inspect `frontend/src/utils/export.js:2` and `backend/src/main/java/com/sms/grade/ExcelExportService.java:171`.

### 5.3 Invalidation Conditions
- **PERF-01 is invalidated if**: `AcademicWarningController` is refactored to take `Pageable` and delegates evaluation to a single JPQL/SQL query joining `Student` and `Grade`.
- **SEC-01 is invalidated if**: `HtmlUtils.htmlEscape(reason)` is applied before template formatting, and destination addresses are strictly validated against existing student profiles.
- **SEC-02 is invalidated if**: Origin patterns strictly enforce explicit non-wildcard domains or disable `allowCredentials(true)` for wildcard domains.
- **SMELL-01 is invalidated if**: `section.getLecturer() == null` is handled explicitly before accessing `.getId()`.
