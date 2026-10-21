# BA SPECIFICATION: ACADEMIC CURRICULUM STRUCTURE

**Document status:** Approved for implementation  
**Owner:** Business Analysis  
**Scope:** Database, Backend API, Frontend curriculum and enrollment experience  
**Priority:** P0 for data access and API; P1 for redesigned UI

## 1. Business Objective

The current product exposes academic data as a flat `Department -> Subject` relationship. This is insufficient for a university because the subjects a student must complete depend on the student's **major** and **cohort**.

The target business hierarchy is:

```text
Department
  -> Major
      -> Cohort
          -> Curriculum Program
              -> Curriculum Block
                  -> Subject
```

Lecturers belong to a department and teach course sections. Students belong to a class, and every class MUST resolve to exactly one major and one cohort.

### Business outcomes

1. A student sees the curriculum for their own major and cohort only.
2. A student can distinguish compulsory subjects from electives.
3. A student can see subject progress: passed, failed, enrolled, or not enrolled.
4. Registration exposes only subjects that belong to the student's curriculum.
5. Existing enrollment, transcript, grading, and admin APIs remain backward compatible during rollout.

## 2. Approved Business Rules

| Rule      | Requirement                                                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-CUR-01 | Every active student MUST resolve to one active `Major` and one `Cohort` through their class.                                                       |
| BR-CUR-02 | Every active major MUST belong to exactly one department.                                                                                           |
| BR-CUR-03 | Every curriculum program MUST belong to exactly one major/cohort pair.                                                                              |
| BR-CUR-04 | A subject MUST be linked to at least one curriculum block before it is shown as part of a program.                                                  |
| BR-CUR-05 | A curriculum block MUST declare `COMPULSORY` or `ELECTIVE`.                                                                                         |
| BR-CUR-06 | A student MUST NOT see curriculum progress belonging to another student, major, or cohort.                                                          |
| BR-CUR-07 | `GET /api/curriculum/me` MUST be derived from the authenticated user. A client-supplied student ID MUST NOT control the result.                     |
| BR-CUR-08 | Registration MUST enforce curriculum eligibility in the Backend. Frontend filtering alone is not sufficient.                                        |
| BR-CUR-09 | A passed subject MUST NOT be offered for registration unless an explicit retake/improvement policy allows it.                                       |
| BR-CUR-10 | A failed subject MAY be shown as `RETAKE_REQUIRED` and may be registered when an open section exists.                                               |
| BR-CUR-11 | The program credit total MUST be calculated from configured blocks/subjects. It MUST NOT be hard-coded in the frontend.                             |
| BR-CUR-12 | If a subject is shared by multiple programs, the API MUST return the subject once per block/program response and preserve its canonical subject ID. |

## 3. Data Model Contract

The migration MUST provide these tables/entities:

| Entity                      | Meaning                           | Required relationship                    |
| --------------------------- | --------------------------------- | ---------------------------------------- |
| `departments`               | Faculty/unit                      | Existing table                           |
| `majors`                    | Training major                    | `major.department_id`                    |
| `cohorts`                   | Admission cohort, e.g. K19        | Unique cohort code                       |
| `classes`                   | Administrative student class      | Add `major_id`, `cohort_id`              |
| `curriculum_programs`       | Curriculum for major + cohort     | Unique `(major_id, cohort_id)`           |
| `curriculum_blocks`         | Required/elective knowledge block | `block.program_id`                       |
| `subjects`                  | Canonical subject catalog         | Existing subject identity remains stable |
| `curriculum_block_subjects` | Subject membership in a block     | Unique `(block_id, subject_id)`          |

The following database constraints are mandatory:

- Foreign keys for every relationship above.
- Unique major code.
- Unique cohort code.
- Unique curriculum program per major/cohort.
- Unique subject membership per block.
- `classes.major_id` and `classes.cohort_id` MUST be non-null after data backfill validation.
- No deletion of a department, major, cohort, program, block, or subject that is referenced by academic history; use inactive status instead.

## 4. Required Backend Deliverables

### 4.1 Entity and repository layer

Implement entities, repositories, DTOs, and service methods for:

- `Major`
- `Cohort`
- `CurriculumProgram`
- `CurriculumBlock`
- `CurriculumBlockSubject`

Entities MUST use DTO responses. Do not expose JPA entities directly from the new curriculum API.

### 4.2 Student curriculum API

**Endpoint:** `GET /api/curriculum/me`  
**Authentication:** Required  
**Allowed role:** `STUDENT`  
**Source of identity:** JWT principal only

Expected response envelope:

```json
{
  "success": true,
  "data": {
    "program": {
      "id": 1,
      "code": "CNTT-K19",
      "name": "Chuong trinh dao tao Cong nghe thong tin - Khoa 19",
      "major": { "id": 1, "code": "CNTT", "name": "Cong nghe thong tin" },
      "cohort": { "id": 4, "code": "K19", "name": "Khoa 19" }
    },
    "progress": {
      "requiredCredits": 145,
      "completedCredits": 45,
      "inProgressCredits": 12,
      "remainingCredits": 88,
      "completionPercent": 31.03
    },
    "blocks": [
      {
        "id": 1,
        "code": "GDDC",
        "name": "Khoi kien thuc giao duc dai cuong",
        "type": "COMPULSORY",
        "requiredCredits": 47,
        "completedCredits": 25,
        "subjects": [
          {
            "id": 101,
            "code": "IT101",
            "name": "Nhap mon lap trinh",
            "credits": 3,
            "required": true,
            "status": "NOT_ENROLLED",
            "grade": null,
            "openSections": []
          }
        ]
      }
    ]
  }
}
```

### 4.3 Subject status contract

The Backend MUST use exactly these statuses:

- `PASSED`: finalized grade meets the pass rule.
- `FAILED`: finalized grade does not meet the pass rule.
- `ENROLLED`: active enrollment exists without a finalized grade.
- `NOT_ENROLLED`: no active enrollment and no finalized grade.
- `RETAKE_REQUIRED`: failed subject eligible for retake.
- `NOT_IN_CURRICULUM`: internal validation only; MUST NOT be returned in the student's curriculum list.

The Backend MUST document the pass rule used by the existing grade policy. It MUST NOT infer pass/fail from frontend letter-grade strings.

### 4.4 Registration API changes

`POST /api/enrollments` MUST validate:

1. Student identity from JWT.
2. Current semester and registration window.
3. Section status and capacity.
4. Duplicate enrollment.
5. Schedule conflict.
6. Credit limit.
7. Curriculum eligibility from the student's program.

If the section subject is outside the curriculum, return a business error with HTTP `409` or the project's documented business-error status. The response MUST identify the reason using a stable error code:

```json
{
  "success": false,
  "code": "SUBJECT_NOT_IN_CURRICULUM",
  "message": "Hoc phan khong nam trong chuong trinh dao tao cua ban"
}
```

`GET /api/course-sections/open` MAY include `inCurriculum`, but this field is informational only. Backend registration validation remains mandatory.

### 4.5 Admin APIs

The following endpoints are required before the new admin UI is accepted:

- `GET /api/majors?departmentId=`
- `GET /api/cohorts`
- `GET /api/curriculum/programs?majorId=&cohortId=`
- `GET /api/curriculum/programs/{id}`
- `POST/PUT /api/curriculum/programs/{id}`
- `POST/PUT /api/curriculum/blocks/{id}`
- `POST/DELETE /api/curriculum/blocks/{blockId}/subjects/{subjectId}`

All write endpoints MUST be `ADMIN` only and MUST validate duplicate relationships.

## 5. Frontend Deliverables

### 5.1 Curriculum page

Create a student page named `AcademicProgressPage` or an equivalent view.

It MUST show:

- Major and cohort.
- Required, completed, in-progress, and remaining credits.
- Progress percentage.
- Accordion sections for curriculum blocks.
- Required/elective labels.
- Subject status and grade.
- Open sections for eligible subjects.
- Empty, loading, retry, and session-expired states.

The UI MUST NOT display a registration button when:

- The subject is `PASSED`.
- No open section exists.
- The subject is outside the curriculum.
- Registration is closed.

### 5.2 Enrollment page

The existing enrollment page MUST retain:

- Synchronous double-click protection.
- No retry of write requests.
- Background refresh without table layout shift.
- Backend business-error messages/codes.

It MUST add:

- Curriculum-only filter by default.
- Optional “All open subjects” view for ADMIN only.
- Clear reason when a subject cannot be registered.

## 6. Migration and Compatibility Plan

### Phase 0: Data readiness

- Run migration in a backup/staging database first.
- Validate every active class resolves to major/cohort.
- Validate every active student resolves to a curriculum program.
- Validate every subject shown in a program belongs to a block.
- Record row counts before and after migration.

### Phase 1: Backend read path

- Add entities and `GET /api/curriculum/me`.
- Do not remove old department/subject APIs.
- Add unit and integration tests.
- Feature flag the curriculum response if needed.

### Phase 2: Registration enforcement

- Enable curriculum eligibility validation in Backend.
- Return stable error codes.
- Test old students, new scale students, failed subjects, passed subjects, and missing curriculum mappings.

### Phase 3: Frontend rollout

- Release curriculum view behind a feature flag.
- Keep the old enrollment list as fallback until integration sign-off.
- Remove fallback only after all P0 acceptance criteria pass.

### Rollback

- Rollback MUST be possible by disabling the feature flag and reverting API reads.
- No migration rollback may delete academic history.
- Any destructive cleanup requires a backup and a written restore procedure.

## 7. Acceptance Criteria

### P0

- [ ] A K19 CNTT student receives only the CNTT-K19 curriculum.
- [ ] A student cannot read another student's curriculum by changing URL/query parameters.
- [ ] Every active student has exactly one resolvable program.
- [ ] Every curriculum subject has a block and canonical subject ID.
- [ ] A subject outside the student's curriculum cannot be registered through direct API calls.
- [ ] Passed subjects are not offered as normal registration choices.
- [ ] Failed subjects follow the approved retake rule.
- [ ] Existing login, transcript, enrollment, grade, and admin APIs remain green.
- [ ] No enrollment, grade, schedule, or student history is deleted by the migration.

### P1

- [ ] Curriculum page displays progress accurately against a hand-calculated fixture.
- [ ] Required and elective blocks are visually distinct.
- [ ] Open sections appear under the correct subject.
- [ ] Loading, empty, retry, and API-error states are tested.
- [ ] Mobile layout works without horizontal content loss.

## 8. QA Test Matrix

| ID     | Scenario                                        | Expected                                        |
| ------ | ----------------------------------------------- | ----------------------------------------------- |
| CUR-01 | K19 CNTT student opens curriculum               | Receives `CNTT-K19` only                        |
| CUR-02 | Student calls another student's endpoint/ID     | `403` or ignored ID; no data leak               |
| CUR-03 | Student with passed subject opens enrollment    | No normal registration action                   |
| CUR-04 | Student with failed subject opens enrollment    | `RETAKE_REQUIRED` according to policy           |
| CUR-05 | Direct POST for subject outside curriculum      | Stable `SUBJECT_NOT_IN_CURRICULUM` error        |
| CUR-06 | Student has no class/program mapping            | Controlled `422`/supportable error, not `500`   |
| CUR-07 | Program contains compulsory and elective blocks | Correct block type and credit totals            |
| CUR-08 | Existing enrollment/transcript regression suite | No regression in current P0 tests               |
| CUR-09 | 10k students across departments                 | Counts and mappings remain consistent           |
| CUR-10 | Migration rerun in staging                      | No duplicate majors, programs, blocks, or links |

## 9. Definition of Done

This work is complete only when:

1. Database migration, seed data, Backend DTO/API, Frontend UI, and QA tests are all merged.
2. All P0 acceptance criteria pass.
3. API contract is published in OpenAPI.
4. Migration row-count and rollback evidence is attached.
5. No P0/P1 defect remains open.
6. BA signs off the final curriculum totals and the pass/retake policy.

## 10. Decisions Required From BA Before Coding

The following cannot be guessed by Dev:

1. Official credit total per major/cohort. The current generated data uses `145`; the API example MUST not use `130` unless BA approves that value.
2. Whether general subjects are owned by CNTT or by a shared General Education major.
3. Exact pass/retake rule for D, D+, and repeated subjects.
4. Whether a subject may appear in multiple blocks or programs.
5. Whether students may register outside their curriculum with an Admin override.
6. Official names and codes of the 13 departments and 13 majors.
