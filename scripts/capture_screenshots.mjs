import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve('screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 1. First get login token
async function getStudentToken() {
  const res = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: '2300001', password: '123456' }),
  });
  const data = await res.json();
  if (!data.success) throw new Error('Login failed: ' + data.message);
  return data.data;
}

async function captureViaCDP() {
  console.log('Fetching auth token...');
  const authData = await getStudentToken();
  console.log('Logged in as:', authData.username, authData.role);

  console.log('Launching headless Chrome with debugging port 9222...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--window-size=1440,900',
    '--no-sandbox',
    'about:blank',
  ]);

  // Wait 1.5s for Chrome to start
  await new Promise((r) => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://localhost:9222/json');
    const pages = await listRes.json();
    const wsUrl = pages[0]?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error('No WebSocket URL from Chrome');

    const ws = new WebSocket(wsUrl);
    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const { resolve, reject } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    await new Promise((resolve) => (ws.onopen = resolve));

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const currentId = id++;
        callbacks.set(currentId, { resolve, reject });
        ws.send(JSON.stringify({ id: currentId, method, params }));
      });

    await send('Page.enable');
    await send('Runtime.enable');

    const capturePage = async (url, filename, setupStorage = false) => {
      console.log(`Navigating to ${url}...`);
      await send('Page.navigate', { url });
      await new Promise((r) => setTimeout(r, 1000));

      if (setupStorage) {
        await send('Runtime.evaluate', {
          expression: `
            localStorage.setItem('token', ${JSON.stringify(authData.token)});
            localStorage.setItem('user', ${JSON.stringify(JSON.stringify(authData))});
          `,
        });
        await send('Page.navigate', { url });
        await new Promise((r) => setTimeout(r, 2000));
      }

      console.log(`Taking screenshot for ${filename}...`);
      const { data } = await send('Page.captureScreenshot', {
        format: 'png',
      });
      const filePath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
      console.log(`Saved screenshot: ${filePath}`);
    };

    // Capture Portal Hub
    await capturePage('http://localhost:5173/login', '1_portal_hub.png', false);
    // Capture Student Login
    await capturePage('http://localhost:5173/student/login', '2_student_login.png', false);
    // Capture Student Dashboard
    await capturePage('http://localhost:5173/student/dashboard', '3_student_dashboard.png', true);
    // Capture Enroll Page
    await capturePage('http://localhost:5173/student/enroll', '4_enroll_page.png', true);
    // Capture My Enrollments Page
    await capturePage('http://localhost:5173/student/my-enrollments', '5_my_enrollments.png', true);

    ws.close();
  } finally {
    chromeProcess.kill();
  }
}

captureViaCDP()
  .then(() => console.log('All screenshots captured successfully!'))
  .catch((err) => {
    console.error('Error during capture:', err);
    process.exit(1);
  });
