// One-shot: capture report screenshots for all 3 roles via headless Chrome (CDP).
// Adapted from scripts/capture_screenshots.mjs. Needs backend :8080 + frontend :5174 up.
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.resolve('report/assets');
fs.mkdirSync(OUT, { recursive: true });

const login = async (username) => {
  const res = await fetch(`http://localhost:8080/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: '123456' }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Login ${username} failed: ${data.message}`);
  return data.data; // { token, username, role, ... }
};

const TARGETS = [
  { role: 'pub', hash: '#/login', file: '01_portal_hub.png' },
  { role: 'pub', hash: '#/student/login', file: '02_login_student.png' },
  { role: 'student', hash: '#/student/dashboard', file: '03_student_dashboard.png' },
  { role: 'student', hash: '#/student/enroll', file: '04_student_enroll.png' },
  { role: 'student', hash: '#/student/schedule', file: '05_student_schedule.png' },
  { role: 'student', hash: '#/student/transcript', file: '06_student_transcript.png' },
  { role: 'student', hash: '#/student/curriculum', file: '07_student_curriculum.png' },
  { role: 'lecturer', hash: '#/lecturer/dashboard', file: '08_lecturer_dashboard.png' },
  { role: 'lecturer', hash: '#/lecturer/my-sections', file: '09_lecturer_sections.png' },
  { role: 'lecturer', hash: '#/lecturer/grades', file: '10_lecturer_grades.png' },
  { role: 'lecturer', hash: '#/lecturer/schedule', file: '11_lecturer_schedule.png' },
  { role: 'admin', hash: '#/admin/dashboard', file: '12_admin_dashboard.png' },
  { role: 'admin', hash: '#/admin/students', file: '13_admin_students.png' },
  { role: 'admin', hash: '#/admin/course-sections', file: '14_admin_course_sections.png' },
  { role: 'admin', hash: '#/admin/schedules', file: '15_admin_schedules.png' },
  { role: 'admin', hash: '#/admin/grades', file: '16_admin_grades.png' },
  { role: 'admin', hash: '#/admin/academic-warnings', file: '17_admin_warnings.png' },
];

async function run() {
  console.log('Logging in (admin/lecturer/student)...');
  const sessions = {
    admin: await login('admin'),
    lecturer: await login('1000001'),
    student: await login('2300001'),
  };

  // Dedicated profile dir, else Chrome hands off to the user's running instance and port 9333 never opens.
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'sms-shot-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=9333', '--disable-gpu',
    `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
    '--window-size=1440,900', '--hide-scrollbars', '--no-sandbox', 'about:blank',
  ]);
  await new Promise((r) => setTimeout(r, 2500));

  try {
    // Poll until a 'page' target with a ws URL exists (headless/new can report an empty list briefly).
    let wsUrl;
    for (let i = 0; i < 20 && !wsUrl; i++) {
      try {
        const list = await (await fetch('http://localhost:9333/json')).json();
        wsUrl = (list.find((t) => t.type === 'page') || list[0])?.webSocketDebuggerUrl;
      } catch { /* chrome not up yet */ }
      if (!wsUrl) await new Promise((r) => setTimeout(r, 500));
    }
    if (!wsUrl) throw new Error('CDP page target never appeared on :9333');
    console.log('CDP target ready');
    const ws = new WebSocket(wsUrl);
    let id = 1;
    const cbs = new Map();
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && cbs.has(m.id)) { const { resolve, reject } = cbs.get(m.id); cbs.delete(m.id); m.error ? reject(m.error) : resolve(m.result); }
    };
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = (e) => reject(new Error('WS error: ' + (e.message || 'unknown')));
      setTimeout(() => reject(new Error('WS open timeout')), 10000);
    });
    console.log('CDP connected');
    const send = (method, params = {}) => new Promise((resolve, reject) => { const i = id++; cbs.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params })); });

    await send('Page.enable');
    await send('Runtime.enable');
    // Load the origin once so localStorage is writable.
    await send('Page.navigate', { url: BASE + '/' });
    await new Promise((r) => setTimeout(r, 1200));

    for (const t of TARGETS) {
      const s = sessions[t.role];
      const setStorage = s
        ? `localStorage.setItem('token', ${JSON.stringify(s.token)}); localStorage.setItem('user', ${JSON.stringify(JSON.stringify(s))});`
        : `localStorage.removeItem('token'); localStorage.removeItem('user');`;
      await send('Runtime.evaluate', { expression: setStorage });
      // Cache-bust query before the hash forces a full reload so authStore re-reads the token.
      await send('Page.navigate', { url: `${BASE}/?_=${Date.now()}${t.hash}` });
      await new Promise((r) => setTimeout(r, t.role === 'pub' ? 3200 : 2800));
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(OUT, t.file), Buffer.from(data, 'base64'));
      console.log('saved', t.file);
    }
    ws.close();
  } finally {
    chrome.kill();
  }
}

run().then(() => console.log('DONE')).catch((e) => { console.error('FAIL', e); process.exit(1); });
