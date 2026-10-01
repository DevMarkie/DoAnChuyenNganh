#!/usr/bin/env node
/**
 * Generate additions that bring the current demo database to exact target totals.
 * Current baseline: 600 students, 25 lecturers, 37 subjects, 13 departments.
 *
 * Usage:
 *   node database/generate_target_scale_seed.js
 *   mysql ... < database/target_scale_seed.sql
 */

const fs = require("node:fs");
const path = require("node:path");

const args = Object.fromEntries(
  process.argv.slice(2).map((value) => {
    const [key, rawValue] = value.replace(/^--/, "").split("=");
    return [key, rawValue ?? true];
  }),
);

const targetStudents = Number(args.students || 10000);
const targetLecturers = Number(args.lecturers || 500);
const targetSubjects = Number(args.subjects || 37);
const currentStudents = Number(args["current-students"] || 600);
const currentLecturers = Number(args["current-lecturers"] || 25);
const currentSubjects = Number(args["current-subjects"] || 37);
const departmentCount = Number(args["departments"] || 13);
const firstUserId = Number(args["first-user-id"] || 627);
const firstLecturerId = Number(args["first-lecturer-id"] || 26);
const firstStudentId = Number(args["first-student-id"] || 601);
const firstSubjectId = Number(args["first-subject-id"] || 38);
const output = args.output || path.join(__dirname, "target_scale_seed.sql");

for (const [name, value] of Object.entries({
  students: targetStudents,
  lecturers: targetLecturers,
  subjects: targetSubjects,
  departments: departmentCount,
})) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`--${name} must be a positive integer`);
  }
}

const studentCount = targetStudents - currentStudents;
const lecturerCount = targetLecturers - currentLecturers;
const subjectCount = targetSubjects - currentSubjects;
if (studentCount < 0 || lecturerCount < 0 || subjectCount < 0) {
  throw new Error("Target totals must not be below current totals");
}

const passwordHash =
  "$2a$10$s2ivIIT7Cjhf0iL2WrXiteC.rcBvNLSbPq2c3CwV38YrpDgh4h0wm";
const sql = [
  "-- Generated additions for exact scale totals.",
  "-- Import after database/seed.sql into the matching baseline database.",
  "USE student_management;",
  "SET FOREIGN_KEY_CHECKS = 1;",
  "START TRANSACTION;",
  "",
];

const userRows = [];
const lecturerRows = [];
for (let offset = 0; offset < lecturerCount; offset += 1) {
  const userId = firstUserId + offset;
  const lecturerId = firstLecturerId + offset;
  const lecturerNumber = 2000001 + offset;
  const code = String(lecturerNumber);
  const email = `${code}@scale.sms.edu.vn`;
  const departmentId = (offset % departmentCount) + 1;
  const gender = offset % 2 === 0 ? "MALE" : "FEMALE";
  const name = `Scale Lecturer ${String(offset + 1).padStart(4, "0")}`;
  const birthDate = `${1975 + (offset % 15)}-04-${String((offset % 27) + 1).padStart(2, "0")}`;

  userRows.push(
    `(${userId}, '${code}', '${passwordHash}', '${email}', 2, TRUE, FALSE)`,
  );
  lecturerRows.push(
    `(${lecturerId}, ${userId}, '${code}', '${name}', '${birthDate}', '${gender}', '${email}', NULL, ${departmentId}, 'ThS', 'Scale testing', TRUE)`,
  );
}

const studentUserRows = [];
const studentRows = [];
for (let offset = 0; offset < studentCount; offset += 1) {
  const userId = firstUserId + lecturerCount + offset;
  const studentId = firstStudentId + offset;
  const studentNumber = 2700001 + offset;
  const code = String(studentNumber);
  const email = `${code}@scale.sms.edu.vn`;
  const classId = (offset % 9) + 1;
  const departmentId = (offset % departmentCount) + 1;
  const gender =
    offset % 3 === 0 ? "FEMALE" : offset % 3 === 1 ? "MALE" : "OTHER";
  const name = `Scale Student ${String(offset + 1).padStart(5, "0")}`;
  const birthDate = `${2000 + (offset % 5)}-09-${String((offset % 27) + 1).padStart(2, "0")}`;

  studentUserRows.push(
    `(${userId}, '${code}', '${passwordHash}', '${email}', 3, TRUE, FALSE)`,
  );
  studentRows.push(
    `(${studentId}, ${userId}, '${code}', '${name}', '${birthDate}', '${gender}', '${email}', NULL, 'Scale test department ${departmentId}', ${classId}, 'ACTIVE')`,
  );
}

const subjectRows = [];
for (let offset = 0; offset < subjectCount; offset += 1) {
  const subjectId = firstSubjectId + offset;
  throw new Error("Scale subjects are disabled; add verified academic catalog rows instead.");
}

function addInsert(table, columns, rows) {
  if (rows.length === 0) return;
  sql.push(
    `INSERT IGNORE INTO ${table} (${columns}) VALUES`,
    `${rows.join(",\n")};`,
    "",
  );
}

addInsert(
  "users",
  "id, username, password, email, role_id, is_active, must_change_password",
  [...userRows, ...studentUserRows],
);
addInsert(
  "lecturers",
  "id, user_id, lecturer_code, full_name, date_of_birth, gender, email, phone, department_id, degree, specialization, is_active",
  lecturerRows,
);
addInsert(
  "students",
  "id, user_id, student_code, full_name, date_of_birth, gender, email, phone, address, class_id, status",
  studentRows,
);
addInsert(
  "subjects",
  "id, subject_code, subject_name, credits, description, department_id, is_active",
  subjectRows,
);

sql.push(
  "COMMIT;",
  "",
  `-- Added students: ${studentCount}; lecturers: ${lecturerCount}; subjects: ${subjectCount}; departments: ${departmentCount}`,
  "",
);

fs.writeFileSync(output, sql.join("\n"), "utf8");
console.log(
  JSON.stringify(
    { output, studentCount, lecturerCount, subjectCount, departmentCount },
    null,
    2,
  ),
);
