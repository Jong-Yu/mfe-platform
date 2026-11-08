const fs = require('node:fs');
const path = require('node:path');
const pointer = path.join(__dirname, '../artifacts/onboarding-demo/latest.json');
if (!fs.existsSync(pointer)) throw new Error('Run npm run test:onboarding first.');
const { directory } = JSON.parse(fs.readFileSync(pointer, 'utf8'));
process.env.MFE_ARTIFACT_STORE = path.join(directory, 'store');
process.env.PORT ||= '4176';
console.log(`새 서비스 E: http://127.0.0.1:${process.env.PORT}/?empty=1`);
require('./serve.cjs');
