#!/usr/bin/env node
/**
 * Generate deterministic student data for scale testing.
 *
 * Usage:
 *   node database/generate_scale_seed.js --students=10000 --output=database/scale_seed.sql
 *
 * Import the generated file after the normal seed.sql. Adjust the starting IDs
 * when the target database already contains records beyond the defaults.
 */

const fs = require("node:fs");
const path = require("node:path");

const args = Object.fromEntries(
  process.argv.slice(2).map((value) => {
    const [key, rawValue] = value.replace(/^--/, "").split("=");
    return [key, rawValue ?? true];
  }),
);

const studentCount = Number(args.students || 10000);
const firstStudentId = Number(args["first-student-id"] || 601);
const firstUserId = Number(args["first-user-id"] || 627);
const firstStudentNumber = Number(args["first-student-number"] || 2600001);
const output = args.output || path.join(__dirname, "scale_seed.sql");

if (!Number.isInteger(studentCount) || studentCount < 1) {
  throw new Error("--students must be a positive integer");
}

const passwordHash =
  "$2a$10$s2ivIIT7Cjhf0iL2WrXiteC.rcBvNLSbPq2c3CwV38YrpDgh4h0wm";
const sql = [
  "-- Generated scale-test data. Import after database/seed.sql.",
  "USE student_management;",
  "START TRANSACTION;",
  "",
  "INSERT IGNORE INTO users (id, username, password, email, role_id, is_active)",
  "VALUES",
];

const userRows = [];
const studentRows = [];
for (let offset = 0; offset < studentCount; offset += 1) {
  const studentId = firstStudentId + offset;
  const userId = firstUserId + offset;
  const studentNumber = firstStudentNumber + offset;
  const username = String(studentNumber);
  const email = `${username}@scale.sms.edu.vn`;
  const classId = (offset % 9) + 1;
  const gender =
    offset % 3 === 0 ? "FEMALE" : offset % 3 === 1 ? "MALE" : "OTHER";
  const name = `Scale Student ${String(offset + 1).padStart(5, "0")}`;
  const birthYear = 2000 + (offset % 5);
  const birthDate = `${birthYear}-09-${String((offset % 27) + 1).padStart(2, "0")}`;

  userRows.push(
    `(${userId}, '${username}', '${passwordHash}', '${email}', 3, TRUE)`,
  );
  studentRows.push(
    `(${studentId}, ${userId}, '${username}', '${name}', '${birthDate}', '${gender}', '${email}', NULL, 'Scale test data', ${classId}, 'ACTIVE')`,
  );
}

sql.push(
  `${userRows.join(",\n")};`,
  "",
  "INSERT IGNORE INTO students (id, user_id, student_code, full_name, date_of_birth, gender, email, phone, address, class_id, status)",
  "VALUES",
  `${studentRows.join(",\n")};`,
  "",
  "COMMIT;",
  "",
);

fs.writeFileSync(output, sql.join("\n"), "utf8");
console.log(`Generated ${studentCount} students at ${output}`);
