// Render each one-page temp .drawio (from split_pages.mjs) with --page-index 0 so the
// filename<->content mapping is exact. Overwrites report/assets/diagrams/<name>.png.
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DRAWIO = 'C:\\Program Files\\draw.io\\draw.io.exe';
const TMP = path.resolve('report/_tmp_pages');
const OUT = path.resolve('report/assets/diagrams');
fs.mkdirSync(OUT, { recursive: true });

const files = fs.readdirSync(TMP).filter((f) => f.endsWith('.drawio')).sort();
let done = 0; const failed = [];
for (const f of files) {
  const base = f.replace(/\.drawio$/, '');
  const out = path.join(OUT, `${base}.png`);
  let success = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      execFileSync(DRAWIO, [
        '--export', '--format', 'png', '--output', out,
        '--page-index', '0', '--scale', '2', '--border', '10', '--no-sandbox',
        path.join(TMP, f),
      ], { timeout: 120000, windowsHide: true, stdio: 'ignore' });
      if (fs.existsSync(out) && fs.statSync(out).size > 2000) {
        done++;
        console.log('OK', base);
        success = true;
        break;
      }
    } catch (e) {
      // retry after short pause
    }
  }
  if (!success) {
    failed.push(base);
    console.log('FAIL', base);
  }
}
console.log(`\nDONE rendered=${done} failed=${failed.length}`);
if (failed.length) { console.log('FAILED:', failed.join(', ')); process.exitCode = 1; }
