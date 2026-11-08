import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../../', import.meta.url));
const integration = path.join(root, 'integration');
const output = path.join(integration, 'artifacts/verification');
const replay = path.join(integration, 'artifacts/onboarding-demo');
fs.mkdirSync(output, { recursive: true }); fs.mkdirSync(replay, { recursive: true });
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'mfe-onboarding-'));
const directory = path.join(temporary, 'walkthrough');
const env = { ...process.env, MFE_ROOT: root, MFE_ONBOARDING_DIR: directory,
  MFE_ARTIFACT_STORE: path.join(directory, 'store'), PORT: '0',
  npm_config_cache: process.env.NPM_CACHE || '/private/tmp/mfe-npm-cache', npm_config_offline: 'true', npm_config_update_notifier: 'false' };
const html = fs.readFileSync(path.join(root, 'docs/mfe-project-handbook.html'), 'utf8');
const decode = text => text.replace(/&(amp|lt|gt|quot|#x27);/g, (_, name) => ({amp:'&',lt:'<',gt:'>',quot:'"','#x27':"'"})[name]);
const step = id => {
  const match = html.match(new RegExp(`<code id="${id}">([\\s\\S]*?)</code>`));
  assert(match, `Missing documented command: ${id}`); return decode(match[1]);
};
const sha = value => createHash('sha256').update(value).digest('hex');
function tree(dir) {
  const hash = createHash('sha256');
  function visit(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
      if (['node_modules', '.mfe-dev', '.git'].includes(entry.name)) continue;
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) visit(file);
      else hash.update(path.relative(dir, file)).update(fs.readFileSync(file));
    }
  }
  visit(dir); return hash.digest('hex');
}
const protectedProjects = Object.fromEntries(fs.readdirSync(path.join(root, 'projects')).map(name => [name, tree(path.join(root, 'projects', name))]));
const originalPointer = fs.readFileSync(path.join(root, 'artifact-store/current.json'), 'utf8');
const report = { status: 'running', startedAt: new Date().toISOString(), documentSha256: sha(html), commands: [], checks: [],
  originalGaps: ['No complete starting project with lockfile and MF development kit', 'prepare:dev targets only existing A/C/B projects', 'No concrete procedure for placing a new service in Shell'],
  scope: 'Execute the handbook code blocks, independently install and run a new E project, edit and build it, publish and connect via a rebuilt Shell copy, then rollback. Local isolated store; S3 and production CI are not exercised.' };
const processes = [];
let browser, currentPage;
async function check(name, action) {
  try { const detail = await action(); report.checks.push({ name, status: 'passed', detail }); console.log('PASS', name); }
  catch (e) { report.checks.push({ name, status: 'failed', error: e.message }); throw e; }
}
function launch(id, overrides = {}) {
  const command = step(id); report.commands.push({ id, command });
  const child = spawn('/bin/bash', ['-c', command], { cwd: root, env: { ...env, ...overrides }, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  processes.push(child); child.log = '';
  child.stdout.on('data', data => { child.log += data; }); child.stderr.on('data', data => { child.log += data; });
  return child;
}
async function run(id, overrides) {
  const child = launch(id, overrides);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { process.kill(-child.pid, 'SIGTERM'); reject(new Error(`${id} timed out: ${child.log}`)); }, 90000);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('exit', code => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(`${id}: ${child.log}`)); });
  });
  report.commands.at(-1).output = child.log;
}
async function server(id, prefix) {
  const child = launch(id);
  const url = await new Promise((resolve,reject) => {
    const timer = setTimeout(() => reject(new Error(child.log)), 45000);
    child.on('error', e => { clearTimeout(timer); reject(e); });
    child.on('exit', code => { clearTimeout(timer); reject(new Error(`Server ${code}: ${child.log}`)); });
    child.stdout.on('data', () => { const match = child.log.match(new RegExp(prefix + ' (http://127\\.0\\.0\\.1:\\d+)')); if (match) { clearTimeout(timer); resolve(match[1]); } });
  });
  return { child, url };
}
async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise(resolve => { child.once('exit', resolve); process.kill(-child.pid, 'SIGTERM'); });
}
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
try {
  await check('platform prepares a complete starter and an isolated store from the documented command', async () => {
    await run('onboard-prepare', { MFE_ARTIFACT_STORE: path.join(root, 'artifact-store') });
    for (const name of ['src/Widget.jsx','package-lock.json',`vendor/mfe-platform-build-tools-${json(path.join(root,'projects/platform-build-tools/package.json')).version}.tgz`,'dev/manifest.json']) assert(fs.existsSync(path.join(directory,'starter',name)));
    assert.equal(json(path.join(directory, 'baseline.json')).compositionId, json(path.join(root, 'artifact-store/current.json')).compositionId);
  });
  const service = path.join(directory, 'team-e/service-e');
  await check('service team copies and installs only its own independent project', async () => {
    await run('onboard-create'); assert.deepEqual(fs.readdirSync(path.join(directory, 'team-e')), ['service-e']);
    assert(!json(path.join(service, 'package.json')).workspaces);
    const lock = json(path.join(service, 'package-lock.json'));
    assert(!Object.values(lock.packages).some(p => p.link));
  });
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const errors = []; context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  const dev = await server('onboard-dev', 'Service Dev Host:');
  const page = await context.newPage(); currentPage = page;
  const requests = [];
  await page.route('**/*', route => { requests.push(route.request().url()); return route.request().url().startsWith(dev.url + '/') ? route.continue() : route.abort(); });
  await check('E boots alone using the actual MF SDK, shared React/Context and exactly one layout/container', async () => {
    await page.goto(dev.url); await page.getByTestId('service-e-dev-1').waitFor();
    assert.equal(await page.locator('[data-dev-layout]').count(),1); assert.equal(await page.locator('[data-page-container]').count(),1);
    assert.equal(await page.getByTestId('e-user').innerText(),'E 개발자'); assert.equal(await page.getByTestId('e-sdk').innerText(),'1.3.1');
    const proof = await page.evaluate(async () => {
      const r=window.__MFE_RUNTIME__, d=window.__MFE_DEV__, sdk=(await(await r.getContainer('platform')).get('./sdk'))();
      return { react:d.sdkReactMatches && d.getIdentity().react===sdk.ReactIdentity, context:d.getIdentity().context===sdk.PlatformContext, entry:d.registry.artifacts.platform.entry, diagnostics:d.getDiagnostics() };
    });
    assert(proof.react && proof.context); assert(requests.includes(dev.url+proof.entry)); assert(requests.every(url=>url.startsWith(dev.url+'/')));
    return proof;
  });
  await check('independent widget copies preserve separate input and counter state', async () => {
    await page.getByTestId('e-increment').click(); await page.getByTestId('e-input').fill('E 개인 메모');
    await page.getByRole('button',{name:'인스턴스 복제',exact:true}).click();
    assert.equal(await page.getByTestId('service-e-dev-2').getByTestId('e-count').innerText(),'0');
    assert.equal(await page.getByTestId('service-e-dev-2').getByTestId('e-input').inputValue(),'');
    assert.equal(await page.getByTestId('service-e-dev-1').getByTestId('e-count').innerText(),'1');
    await page.getByRole('button',{name:'복제 제거',exact:true}).click();
  });
  await check('the documented source edit rebuilds E and appears in the standalone browser', async () => {
    await run('onboard-edit'); await page.getByText('E 팀이 직접 수정한 알림 화면',{exact:true}).waitFor({timeout:20000});
    assert.equal(await page.getByTestId('e-input').inputValue(),'');
    await page.screenshot({path:path.join(output,'onboarding-dev.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844}); assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:path.join(output,'onboarding-dev-mobile.png'),fullPage:true});
    await page.close(); await stop(dev.child);
  });
  await check('E builds and publishes through the documented CLI without activating it', async () => {
    await run('onboard-build'); await run('onboard-publish');
    const release=json(path.join(service,'dist/release.json')); report.service=release;
    assert.equal(release.service,'e'); assert.equal(release.version,'1.0.0');
    assert.equal(json(path.join(directory,'store/current.json')).compositionId,json(path.join(directory,'baseline.json')).compositionId);
    assert.deepEqual(fs.readFileSync(path.join(service,'dist/remoteEntry.js')),fs.readFileSync(path.join(directory,'store/artifacts',release.id,'remoteEntry.js')));
    assert(!fs.readFileSync(path.join(service,'dist/remoteEntry.js'),'utf8').includes('LOCAL WORKSPACE'));
  });
  await check('platform connects E in a Shell copy and builds/publishes only that changed consumer', async () => {
    await run('onboard-shell'); report.shell=json(path.join(directory,'shell/dist/release.json'));
    assert.deepEqual(report.shell.runtimeDependencies.e,{service:'e',requires:'>=1.0.0 <2.0.0'});
  });
  process.env.MFE_ARTIFACT_STORE=env.MFE_ARTIFACT_STORE;
  const store=createRequire(import.meta.url)('../tools/store.cjs');
  await check('missing Shell-to-E binding is rejected before activation', async () => {
    assert.throws(()=>store.activate({shell:report.shell.id,platform:json(path.join(directory,'baseline.json')).sdk}),/Missing runtime binding/);
  });
  await check('documented activation selects SDK/Shell/E and retains the original A/C/B/D bindings', async () => {
    const before=store.current();await run('onboard-activate');const after=store.current();report.composition=after;
    assert.equal(after.runtimeBindings[report.shell.id].e,report.service.id);
    for(const [owner,aliases]of Object.entries(before.runtimeBindings))assert.deepEqual(after.runtimeBindings[owner],aliases);
    assert.equal(after.selected.A,before.selected.A);assert.equal(after.selected.C,before.selected.C);
  });
  const host=await server('onboard-serve','MF proof:');
  const product=await context.newPage(); currentPage=product;
  const productRequests=[];product.on('request',r=>productRequests.push(r.url()));
  await check('Shell loads the published E using the same SDK and keeps A/C operational', async () => {
    await product.goto(host.url+'/?empty=1');await product.getByTestId('service-e-E').waitFor();
    assert.equal(await product.locator('[data-dev-layout]').count(),0);assert.equal(await product.locator('header.header').count(),1);
    assert.equal(await product.getByTestId('e-user').innerText(),'김개발');assert.equal(await product.getByTestId('e-sdk').innerText(),'1.3.1');
    assert(productRequests.includes(host.url+report.service.entry));
    await product.getByTestId('add-a').click();await product.getByTestId('widget-A').waitFor();
    await product.getByTestId('add-c').click();await product.getByTestId('widget-C').waitFor();
    await product.getByTestId('e-increment').click();await product.getByTestId('e-input').fill('제품 입력 유지');
    assert.equal(await product.getByTestId('widget-A').getByTestId('count').innerText(),'0');
    const proof=await product.evaluate(async id=>{const r=window.__MFE_RUNTIME__, sdk=(await(await r.getContainer('platform')).get('./sdk'))(),e=(await(await r.getArtifactContainer(r.registry.artifacts[id])).get('./Widget'))().getIdentity();return{react:e.react===sdk.ReactIdentity,context:e.context===sdk.PlatformContext,diagnostics:r.getDiagnostics()};},report.service.id);
    assert(proof.react&&proof.context);report.runtime=proof;
    await product.screenshot({path:path.join(output,'onboarding-shell.png'),fullPage:true});
    await product.setViewportSize({width:390,height:844});assert(await product.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await product.screenshot({path:path.join(output,'onboarding-shell-mobile.png'),fullPage:true});
  });
  await check('documented rollback changes new tabs while existing E state is preserved', async () => {
    await run('onboard-rollback');const fresh=await context.newPage();await fresh.goto(host.url+'/?empty=1');await fresh.getByTestId('add-a').waitFor();
    assert.equal(await fresh.getByTestId('service-e-E').count(),0);
    assert.equal(await product.getByTestId('e-input').inputValue(),'제품 입력 유지');assert.equal(await product.getByTestId('e-count').innerText(),'1');
    await fresh.close();await run('onboard-activate');
  });
  await check('retain the new independent project and demo while leaving original projects and selection unchanged', async () => {
    for(const [name,hash] of Object.entries(protectedProjects))assert.equal(tree(path.join(root,'projects',name)),hash,name);
    assert.equal(fs.readFileSync(path.join(root,'artifact-store/current.json'),'utf8'),originalPointer);
    assert.deepEqual(errors,[]);
    const retained=fs.mkdtempSync(path.join(replay,'verified-'));
    fs.cpSync(directory,retained,{recursive:true,filter:file=>!['node_modules','.mfe-dev'].includes(path.basename(file))});
    fs.rmSync(path.join(retained,'store/usage.json'),{force:true});
    fs.writeFileSync(path.join(retained,'scenario.json'),JSON.stringify({composition:report.composition,service:report.service,shell:report.shell,builtOnly:['service-e','shell-copy']},null,2)+'\n');
    fs.writeFileSync(path.join(replay,'latest.json'),JSON.stringify({directory:retained},null,2)+'\n');
    report.retained=retained;report.protectedProjects=protectedProjects;
  });
  report.status='passed';
} catch(error) {
  report.status='failed';report.error=error.stack;process.exitCode=1;console.error(error);
  await currentPage?.screenshot({path:path.join(output,'onboarding-failure.png'),fullPage:true}).catch(()=>{});
} finally {
  await browser?.close();for(const child of processes)await stop(child);
  fs.rmSync(temporary,{recursive:true,force:true});report.finishedAt=new Date().toISOString();report.passedChecks=report.checks.filter(x=>x.status==='passed').length;
  fs.writeFileSync(path.join(output,'onboarding.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`Onboarding ${report.status}: ${report.passedChecks}/${report.checks.length}`);
}
