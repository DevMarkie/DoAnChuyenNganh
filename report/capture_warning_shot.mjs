import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.resolve('report/assets');

const login = async (username) => {
  const res = await fetch(`http://localhost:8080/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: '123456' }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Login ${username} failed: ${data.message}`);
  return data.data;
};

async function run() {
  console.log('Logging in student & admin...');
  const studentSession = await login('2300001');
  const adminSession = await login('admin');

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'sms-shot-extra-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=9335', '--disable-gpu',
    `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
    '--window-size=1440,900', '--hide-scrollbars', '--no-sandbox', 'about:blank',
  ]);
  await new Promise((r) => setTimeout(r, 2500));

  try {
    let wsUrl;
    for (let i = 0; i < 20 && !wsUrl; i++) {
      try {
        const list = await (await fetch('http://localhost:9335/json')).json();
        wsUrl = (list.find((t) => t.type === 'page') || list[0])?.webSocketDebuggerUrl;
      } catch {}
      if (!wsUrl) await new Promise((r) => setTimeout(r, 500));
    }
    if (!wsUrl) throw new Error('CDP target ready failed');

    const ws = new WebSocket(wsUrl);
    let id = 1;
    const cbs = new Map();
    ws.onmessage = (msg) => {
      const parsed = JSON.parse(msg.data);
      if (parsed.id && cbs.has(parsed.id)) {
        const { resolve, reject } = cbs.get(parsed.id);
        cbs.delete(parsed.id);
        if (parsed.error) reject(parsed.error);
        else resolve(parsed.result);
      }
    };
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const i = id++;
      cbs.set(i, { resolve, reject });
      ws.send(JSON.stringify({ id: i, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: BASE + '/' });
    await new Promise((r) => setTimeout(r, 1200));

    // 1. Capture 07_student_curriculum.png
    console.log('Capturing 07_student_curriculum.png...');
    const setStudentStorage = `localStorage.setItem('token', ${JSON.stringify(studentSession.token)}); localStorage.setItem('user', ${JSON.stringify(JSON.stringify(studentSession))});`;
    await send('Runtime.evaluate', { expression: setStudentStorage });
    await send('Page.navigate', { url: `${BASE}/?_=${Date.now()}#/student/curriculum` });
    await new Promise((r) => setTimeout(r, 3500));
    const currShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, '07_student_curriculum.png'), Buffer.from(currShot.data, 'base64'));
    console.log('Saved 07_student_curriculum.png');

    // 2. Capture 17_admin_warnings.png
    console.log('Capturing 17_admin_warnings.png...');
    const setAdminStorage = `localStorage.setItem('token', ${JSON.stringify(adminSession.token)}); localStorage.setItem('user', ${JSON.stringify(JSON.stringify(adminSession))});`;
    await send('Runtime.evaluate', { expression: setAdminStorage });
    await send('Page.navigate', { url: `${BASE}/?_=${Date.now()}#/admin/academic-warnings` });

    for (let wait = 0; wait < 20; wait++) {
      await new Promise((r) => setTimeout(r, 1000));
      const res = await send('Runtime.evaluate', {
        expression: `(() => {
          const rows = document.querySelectorAll('tbody tr');
          const skeleton = document.querySelector('.animate-pulse');
          return rows.length > 0 && !skeleton;
        })()`,
        returnByValue: true,
      });
      if (res?.result?.value === true) {
        console.log(`Warnings table loaded after ${wait + 1}s!`);
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
    const warnShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, '17_admin_warnings.png'), Buffer.from(warnShot.data, 'base64'));
    console.log('Saved 17_admin_warnings.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().then(() => console.log('DONE ALL')).catch((e) => {
  console.error(e);
  process.exit(1);
});
