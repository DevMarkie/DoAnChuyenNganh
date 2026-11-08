const { execSync } = require('child_process');

function runSql(sql) {
  return execSync('docker exec -i student_management_db mysql -u sms_app -psms_dev_pw student_management -B', {
    input: sql,
    encoding: 'utf8'
  });
}

function queryRows(sql) {
  const raw = runSql(sql).trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter(l => !l.startsWith('mysql: [Warning]'));
  if (lines.length < 2) return [];
  const headers = lines[0].split('\t');
  return lines.slice(1).map(line => {
    const parts = line.split('\t');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = parts[i] !== 'NULL' ? parts[i] : null;
    });
    return obj;
  });
}

console.log('--- Checking Student 11 ---');
const student11 = queryRows('SELECT s.id, s.student_code, s.full_name, c.major_id, c.cohort_id, p.id AS program_id, p.total_credits FROM students s JOIN classes c ON s.class_id = c.id JOIN curriculum_programs p ON c.major_id = p.major_id AND c.cohort_id = p.cohort_id WHERE s.id = 11;')[0];
console.log('Student 11:', student11);

const passedRows = queryRows(`
  SELECT SUM(s.credits) as curr_credits
  FROM grades g
  JOIN enrollments e ON g.enrollment_id = e.id
  JOIN course_sections sec ON e.section_id = sec.id
  JOIN subjects s ON sec.subject_id = s.id
  WHERE e.student_id = 11 AND g.is_finalized = 1 AND g.gpa_point >= 1.0;
`);
console.log('Current Passed Credits:', passedRows[0].curr_credits);

const takenSubjectIds = new Set(queryRows(`
  SELECT DISTINCT sec.subject_id
  FROM enrollments e
  JOIN course_sections sec ON e.section_id = sec.id
  WHERE e.student_id = 11;
`).map(r => Number(r.subject_id)));
console.log('Taken subjects count:', takenSubjectIds.size);

const programBlocksSubjects = queryRows(`
  SELECT DISTINCT cb.display_order, cbs.subject_id, s.subject_code, s.subject_name, s.credits, cb.code AS block_code, cb.name AS block_name
  FROM curriculum_blocks cb
  JOIN curriculum_block_subjects cbs ON cb.id = cbs.block_id
  JOIN subjects s ON cbs.subject_id = s.id
  WHERE cb.program_id = ${student11.program_id}
  ORDER BY cb.display_order, s.subject_code;
`);
console.log('Total subjects in program blocks:', programBlocksSubjects.length);

const uncompleted = programBlocksSubjects.filter(s => !takenSubjectIds.has(Number(s.subject_id)) && !['262', '34'].includes(s.subject_id));
console.log('Uncompleted available subjects:', uncompleted.length);
uncompleted.forEach(s => console.log(`  - [${s.block_code}] ${s.subject_code} - ${s.subject_name} (${s.credits} TC)`));
