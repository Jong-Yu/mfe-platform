const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '../artifacts/nested-demo');
const latest = path.join(root, 'latest.json');
if (!fs.existsSync(latest)) {
  const result = spawnSync(process.execPath, [path.join(__dirname, 'prepare-nested.cjs')], { stdio: 'inherit', env: process.env });
  if (result.status !== 0) process.exit(result.status || 1);
}
const { directory } = JSON.parse(fs.readFileSync(latest, 'utf8'));
process.env.MFE_ARTIFACT_STORE = path.join(directory, 'store');
process.env.PORT ||= '4174';
console.log(`중첩 예제: http://127.0.0.1:${process.env.PORT}/?empty=1 에서 'A 불러오기'를 누르세요.`);
require('./serve.cjs');
