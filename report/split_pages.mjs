// Split each multi-page .drawio into one-page temp .drawio files, so each can be
// rendered unambiguously with --page-index 0 (the multi-page --page-index is off-by-one here).
// Also emits report/diagram_captions.json: { "<prefix>_<NN>": "<clean Vietnamese caption>" }.
import fs from 'fs';
import path from 'path';

const SRC = path.resolve('drawio');
const TMP = path.resolve('report/_tmp_pages');
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });

const JOBS = [
  ['uc',  'UseCase_Diagrams.drawio',           'Sơ đồ Use Case'],
  ['act', 'Activity_Diagrams.drawio',          'Biểu đồ hoạt động'],
  ['bce', 'AnalysisClass_BCE_Diagrams.drawio', 'Biểu đồ lớp phân tích (BCE)'],
  ['seq', 'Sequence_Diagrams.drawio',          'Biểu đồ tuần tự'],
];

const HEADER = '<?xml version="1.0" encoding="utf-8"?>\n'
  + '<mxfile host="app.diagrams.net" type="device">\n';
const unesc = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#10;/g, ' ');

const captions = {};
let total = 0;
for (const [prefix, file, kind] of JOBS) {
  const data = fs.readFileSync(path.join(SRC, file), 'utf-8');
  const blocks = [...data.matchAll(/<diagram\b([^>]*)>([\s\S]*?)<\/diagram>/g)];
  blocks.forEach((m, i) => {
    const nn = String(i + 1).padStart(2, '0');
    const tag = `<diagram${m[1]}>${m[2]}</diagram>`;
    fs.writeFileSync(path.join(TMP, `${prefix}_${nn}.drawio`), HEADER + '  ' + tag + '\n</mxfile>\n');
    const nameAttr = (m[1].match(/name="([^"]*)"/) || [, ''])[1];
    const rest = unesc(nameAttr).replace(/^\s*\d+\.\s*/, '').trim(); // drop leading "N. "
    captions[`${prefix}_${nn}`] = `${kind} – ${rest}`;
    total++;
  });
  console.log(`${prefix}: ${blocks.length} pages`);
}
fs.writeFileSync(path.resolve('report/diagram_captions.json'), JSON.stringify(captions, null, 2));
console.log(`DONE split=${total} -> ${TMP}`);
