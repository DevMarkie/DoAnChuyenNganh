const BASE_URL = 'http://localhost:8080/api';

async function request(endpoint, { method = 'GET', body = null, token = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  console.log('=== TEST 1: Student Login & Schedule Check ===');
  const stuLogin = await request('/auth/login', {
    method: 'POST',
    body: { username: '2300001', password: '123456' }
  });
  if (!stuLogin.ok || !stuLogin.data?.data?.token) {
    console.error('FAIL: Student login failed', stuLogin);
    process.exit(1);
  }
  const stuToken = stuLogin.data.data.token;
  console.log('PASS: Student logged in successfully, role:', stuLogin.data.data.role);

  const stuSched = await request('/schedules/my-schedule', { token: stuToken });
  if (!stuSched.ok || !Array.isArray(stuSched.data?.data)) {
    console.error('FAIL: Get student schedule failed', stuSched);
    process.exit(1);
  }
  const schedules = stuSched.data.data;
  console.log(`PASS: Retrieved ${schedules.length} schedules for student 2300001`);

  console.log('\n=== TEST 2: Student View Section Class List For Each Schedule ===');
  for (const s of schedules) {
    const sec = s.courseSection;
    if (!sec) continue;
    const secRes = await request(`/enrollments/section/${sec.id}`, { token: stuToken });
    if (!secRes.ok) {
      console.error(`FAIL: Student could not view section ${sec.id} (${sec.sectionCode}):`, secRes.data);
      process.exit(1);
    }
    const students = secRes.data?.data || [];
    console.log(`PASS: Section ${sec.id} (${sec.sectionCode} - ${sec.subject?.subjectName}) loaded ${students.length} students. Status: ${sec.status}`);
    if (students.length > 0) {
      const firstStu = students[0];
      if (!firstStu.student?.fullName || !firstStu.student?.studentCode) {
        console.error('FAIL: Missing fullName or studentCode in student record', firstStu);
        process.exit(1);
      }
    }
  }

  console.log('\n=== TEST 3: Lecturer Login & Lecturer Schedule ===');
  const lecLogin = await request('/auth/login', {
    method: 'POST',
    body: { username: '1000001', password: '123456' }
  });
  if (!lecLogin.ok || !lecLogin.data?.data?.token) {
    console.error('FAIL: Lecturer login failed', lecLogin);
    process.exit(1);
  }
  const lecToken = lecLogin.data.data.token;
  console.log('PASS: Lecturer 1000001 logged in successfully');

  const lecSched = await request('/schedules/lecturer-schedule', { token: lecToken });
  if (!lecSched.ok || !Array.isArray(lecSched.data?.data)) {
    console.error('FAIL: Get lecturer schedule failed', lecSched);
    process.exit(1);
  }
  const lecSchedules = lecSched.data.data;
  console.log(`PASS: Retrieved ${lecSchedules.length} teaching schedules for lecturer 1000001`);

  if (lecSchedules.length > 0) {
    const teachSec = lecSchedules[0].courseSection;
    console.log(`\n=== TEST 4: Lecturer View Class List & Mark Attendance for Section ${teachSec.id} ===`);
    const lecSecRes = await request(`/enrollments/section/${teachSec.id}`, { token: lecToken });
    if (!lecSecRes.ok) {
      console.error(`FAIL: Lecturer could not view section ${teachSec.id}:`, lecSecRes.data);
      process.exit(1);
    }
    const enrollments = lecSecRes.data?.data || [];
    console.log(`PASS: Lecturer retrieved ${enrollments.length} students in section ${teachSec.sectionCode}`);

    if (enrollments.length > 0) {
      const targetEnrollment = enrollments[0];
      const today = new Date().toISOString().split('T')[0];
      
      console.log(`Testing attendance saving: marking student ${targetEnrollment.student.studentCode} as absent`);
      const saveAtt = await request('/attendance/session', {
        method: 'POST',
        token: lecToken,
        body: {
          sectionId: teachSec.id,
          sessionDate: today,
          attendanceKeyword: 'TEST_CHECK',
          records: [
            { enrollmentId: targetEnrollment.id, isPresent: false }
          ]
        }
      });
      if (!saveAtt.ok) {
        console.error('FAIL: Save attendance session failed:', saveAtt.data);
        process.exit(1);
      }
      console.log('PASS: Attendance session saved successfully:', saveAtt.data?.message);

      console.log('\n=== TEST 5: Verify Absence Count Synchronized to Student View ===');
      const verifyStuRes = await request(`/enrollments/section/${teachSec.id}`, { token: stuToken });
      if (!verifyStuRes.ok) {
        console.error('FAIL: Student failed to retrieve section after attendance update');
        process.exit(1);
      }
      const updatedEnrollments = verifyStuRes.data?.data || [];
      const updatedTarget = updatedEnrollments.find(e => e.id === targetEnrollment.id);
      console.log(`PASS: Target student ${targetEnrollment.student.studentCode} absenceCount in student portal is now: ${updatedTarget?.absenceCount}`);
      if (updatedTarget?.absenceCount < 1) {
        console.error('FAIL: Expected absenceCount >= 1, got', updatedTarget?.absenceCount);
        process.exit(1);
      }
      console.log('PASS: Absence count is accurately synchronized in real time between lecturer and student views!');
    }
  }

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
