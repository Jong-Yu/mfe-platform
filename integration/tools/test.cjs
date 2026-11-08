const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
// Browser heartbeats write operational metadata. Keep proof sessions out of the
// user's live usage history, just like the upgrade and management proofs.
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'mfe-coexistence-proof-'));
const source = process.env.MFE_ARTIFACT_STORE || path.resolve(root, '../artifact-store');
fs.cpSync(source, path.join(temporary, 'store'), { recursive: true, filter: (file) => !['usage.json', '.write-lock'].includes(path.basename(file)) });
const server = spawn(process.execPath, ['tools/serve.cjs'], { cwd: root, env: { ...process.env, MFE_ARTIFACT_STORE: path.join(temporary, 'store'), PORT: '0' }, stdio: ['ignore', 'pipe', 'inherit'] });
let finished = false;
const ready = new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Test server did not start')), 10000);
  const fail = (error) => { clearTimeout(timeout); reject(error); };
  server.on('error', fail);
  server.on('exit', (code) => { if (!finished) fail(new Error(`Test server exited: ${code}`)); });
  server.stdout.on('data', (data) => {
    const match = String(data).match(/http:\/\/127\.0\.0\.1:\d+/);
    if (match) { clearTimeout(timeout); resolve(match[0]); }
  });
});
(async () => {
  try {
    const baseURL = await ready;
    process.exitCode = await new Promise((resolve, reject) => {
      const test = spawn(process.execPath, ['tests/verify.mjs'], { cwd: root, env: { ...process.env, BASE_URL: baseURL }, stdio: 'inherit' });
      test.on('error', reject);
      test.on('exit', (code) => resolve(code ?? 1));
    });
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally {
    finished = true;
    if (server.exitCode === null && server.signalCode === null) await new Promise((resolve) => { server.once('exit', resolve); server.kill('SIGTERM'); });
    fs.rmSync(temporary, { recursive: true, force: true });
  }
})();
