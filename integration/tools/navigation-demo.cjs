const fs = require('node:fs');
const path = require('node:path');
const pointer = path.join(__dirname, '../artifacts/navigation-demo/latest.json');
if (!fs.existsSync(pointer)) throw new Error('먼저 npm run test:navigation을 실행하세요.');
const { directory } = JSON.parse(fs.readFileSync(pointer, 'utf8'));
process.env.MFE_ARTIFACT_STORE = path.join(directory, 'store');
process.env.PORT ||= '4177';
console.log(`서비스·메뉴 관리: http://127.0.0.1:${process.env.PORT}/admin#services`);
require('./serve.cjs');
