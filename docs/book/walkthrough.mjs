import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(root,'examples/20-user-subscriptions/integration/package.json'));
const {chromium}=require('playwright');
const out=path.join(root,'docs/verification/walkthrough');fs.mkdirSync(out,{recursive:true});
const order=[1,2,3,4,12,10,11,18,19,13,14,15,16,17,5,6,7,8,9,20];
const wanted=process.argv.slice(2).map(Number), sequence=wanted.length?order.filter(n=>wanted.includes(n)):order;
const catalog=JSON.parse(fs.readFileSync(path.join(root,'examples/catalog.json')));
const reportFile=path.join(out,'report.json');
const previous=fs.existsSync(reportFile)?JSON.parse(fs.readFileSync(reportFile)):{};
const sourceBook=path.join(root,'docs/mfe-self-study.html');
const report={...previous,status:'running',learningOrder:order,scope:'Fresh relocated copies; documented install/start/select and visible browser workflows, then npm test. Warm npm cache used; source projects and original stores are untouched.',examples:previous.examples||[],startedAt:previous.startedAt||new Date().toISOString(),bookSHA256:createHash('sha256').update(fs.readFileSync(sourceBook)).digest('hex')};
const env={...process.env,npm_config_cache:process.env.NPM_CACHE||'/private/tmp/mfe-npm-cache',npm_config_offline:process.env.READER_ONLINE==='1'?'false':'true',NPM_CACHE:process.env.NPM_CACHE||'/private/tmp/mfe-npm-cache',MFE_OFFLINE:process.env.READER_ONLINE==='1'?'':'1'};
delete env.MFE_ARTIFACT_STORE;delete env.PORT;delete env.NODE_PATH;
const fileJSON=p=>JSON.parse(fs.readFileSync(p));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function save(){report.examples.sort((a,b)=>order.indexOf(a.number)-order.indexOf(b.number));fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');}
function copy(source,target){fs.cpSync(source,target,{recursive:true,filter:p=>{const rel=path.relative(source,p);return !rel.split(path.sep).some(x=>['node_modules','artifact-store','verification','.mfe-dev'].includes(x))&&!rel.startsWith('integration/artifacts');}});}
async function command(args,cwd,record,extra={}){
 const shown=args.join(' ');record.commands.push({command:shown,cwd});
 return new Promise((resolve,reject)=>{let output='';const child=spawn(args[0],args.slice(1),{cwd,env:{...env,...extra},stdio:['ignore','pipe','pipe']});const timer=setTimeout(()=>{child.kill('SIGTERM');reject(Error('Command timeout: '+shown));},600000);
 const append=d=>{output+=d;fs.appendFileSync(path.join(out,record.id+'.log'),d);};child.stdout.on('data',append);child.stderr.on('data',append);child.on('error',reject);child.on('close',code=>{clearTimeout(timer);record.commands.at(-1).exitCode=code;code===0?resolve(output):reject(Object.assign(Error(shown+' failed: '+output.slice(-2200)),{output}));});});
}
async function available(port){return new Promise(resolve=>{const s=net.createServer();s.on('error',()=>resolve(false));s.listen(port,'127.0.0.1',()=>s.close(()=>resolve(true)));});}
async function stop(server){if(server&&server.exitCode===null)await new Promise(resolve=>{const timer=setTimeout(()=>{server.kill('SIGKILL');resolve();},3000);server.once('exit',()=>{clearTimeout(timer);resolve();});server.kill('SIGTERM');});}
async function start(args,cwd,record,port){
 if(!await available(port)){record.notes.push(`Documented port ${port} occupied; used documented PORT override.`);port=4600+record.number;}
 record.commands.push({command:'PORT='+port+' '+args.join(' '),cwd});
 const server=spawn(args[0],args.slice(1),{cwd,env:{...env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
 try{const url=await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Start timeout: '+log.slice(-1500))),60000);function append(d){log+=d;fs.appendFileSync(path.join(out,record.id+'.log'),d);const m=log.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}}server.stdout.on('data',append);server.stderr.on('data',append);server.on('error',reject);server.on('exit',code=>{if(code){clearTimeout(timer);reject(Error('Server exit: '+log.slice(-1500)));}});});return{server,url};}catch(e){await stop(server);throw e;}
}
const widget=(p,id='A')=>p.getByTestId('widget-'+id);
async function textIs(locator,value){await locator.waitFor();await locator.page().waitForFunction(({id,v})=>[...document.querySelectorAll('[data-testid]')].some(e=>e.dataset.testid===id&&e.textContent.trim()===v),{id:await locator.getAttribute('data-testid'),v:value});assert.equal((await locator.innerText()).trim(),value);}
async function exercise(p,id='A'){await widget(p,id).getByTestId('increment').click();await widget(p,id).getByTestId('input').fill('학습 중인 메모');await widget(p,id).getByTestId('cache-write').click();}
async function kept(p,id='A'){assert.equal(await widget(p,id).getByTestId('count').innerText(),'1');assert.equal(await widget(p,id).getByTestId('input').inputValue(),'학습 중인 메모');}
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const bookPage=await browser.newPage();await bookPage.goto(pathToFileURL(sourceBook).href);
 const cards=await bookPage.locator('.lab').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[Number(n.id.slice(4)),{title:n.querySelector('h2').textContent,command:n.querySelector('pre').textContent,steps:[...n.querySelector(':scope > ol').children].map(x=>x.textContent)}])));await bookPage.close();
 for(const n of sequence){
  const item=catalog.find(x=>Number(x.id.slice(0,2))===n), temp=fs.mkdtempSync(path.join(os.tmpdir(),'mfe-reader-')), work=path.join(temp,'mfe','examples',item.id);
  const r={id:item.id,number:n,status:'running',startedAt:new Date().toISOString(),work,document:cards[n],commands:[],checks:[],notes:[],installMode:process.env.READER_ONLINE==='1'?'online with a newly created empty npm cache':'offline with prepared cache',npmCache:env.NPM_CACHE};
  report.examples=report.examples.filter(x=>x.number!==n);report.examples.push(r);save();console.log('START',n,item.title);
  let server,dev,context;const pages=[];let last;
  const note=s=>{r.checks.push(s);console.log('  PASS',s);save();};
  try{
   copy(path.join(root,'examples',item.id),work);
   await command(['npm','--prefix','integration','ci'],work,r);note('학습서의 설치 명령을 독립 복사본에서 실행');
   const running=await start(['npm','start'],work,r,4500+n);server=running.server;const url=running.url;
   context=await browser.newContext({viewport:{width:1440,height:1000}});
   async function open(route='/'){const p=await context.newPage();pages.push(p);last=p;await p.goto(url+route);return p;}
   const old=await open(n===20?'/subscriptions':n===12?'/?empty=1':'/');
   if(n===12)await old.getByTestId('add-a').click();
   if(n===19){await old.getByText('표시할 위젯이 없습니다.',{exact:false}).waitFor();note('19번의 초기 빈 대시보드가 정상임을 확인');}
   else if(n!==20){await widget(old).waitFor();if(n<12||n>17)await widget(old,'C').waitFor();note('문서의 시작 주소에서 실제 MF 화면 확인');}
   if([1,2,3,4,12,17].includes(n)){
    await exercise(old);if(n===1){await old.getByTestId('add-a-copy').click();await widget(old,'A-copy').waitFor();assert.equal(await widget(old,'A-copy').getByTestId('count').innerText(),'0');await old.getByTestId('remove-a-copy').click();await kept(old);note('복제·제거 후 원래 위젯의 메모·카운터 유지');}
    if(n===12){await textIs(widget(old).getByTestId('version'),'1.4.0');await textIs(widget(old,'A--c').getByTestId('version'),'2.1.0');note('A의 직접 B와 C 안의 다른 B를 동시에 조작');}
    const profiles=n===2||n===17?['upgraded','baseline']:n===3||n===4?['a-only','c-only','upgraded']:[];
    for(const profile of profiles){await command(['npm','run','select','--',profile],work,r);const fresh=await open();await widget(fresh).waitFor();
     if(n===2||n===17){await textIs(widget(fresh).getByTestId('platform-version'),n===2?(profile==='baseline'?'1.3.1':'1.4.0'):(profile==='baseline'?'1.3.0':'1.3.1'));}
     if(n===3){await textIs(widget(fresh).getByTestId('version'),profile==='c-only'?'1.4.0':'1.5.0');await textIs(widget(fresh,'C').getByTestId('version'),profile==='a-only'?'2.1.0':'2.2.0');}
     if(n===4){await widget(fresh,'C').waitFor();assert((await widget(fresh).getByTestId('dependency').innerText()).includes(profile==='c-only'?'1.0.0':'1.1.0'));assert((await widget(fresh,'C').getByTestId('dependency').innerText()).includes(profile==='a-only'?'2.0.0':'2.1.0'));}
     await kept(old);note(profile+' 선택 후 새 탭 변경·기존 탭 상태 유지');
    }
   }
   if(n===10){
    const project=path.join(work,'projects/service-a');await command(['npm','ci'],project,r);const d=await start(['npm','run','dev'],project,r,4201);dev=d.server;
    const p=await context.newPage();last=p;await p.goto(d.url);await p.getByText('OTA 서비스 A',{exact:true}).first().waitFor();
    const source=path.join(project,'src/index.jsx'),text=fs.readFileSync(source,'utf8');assert(text.includes('return <BWidget {...props} />;'));
    r.notes.push('A가 B만 반환하는 위치에 학습서의 구체적인 JSX 문단을 삽입하여 확인.');
    fs.writeFileSync(source,text.replace('return <BWidget {...props} />;','return <><p>내 OTA 화면 수정</p><BWidget {...props} /></>;'));
    await p.getByText('내 OTA 화면 수정',{exact:true}).waitFor({timeout:30000});note('단독 A 설치·개발 실행·소스 저장 후 화면 반영');
    await stop(dev);dev=null;
    await command(['npm','run','prepare:dev'],work,r);note('문서의 개발 키트 갱신 명령 실행');
    if(process.env.READER_ONLINE==='1'){
     await command(['npm','run','setup'],work,r);note('새 npm 캐시로 온라인 setup 수행 후 자동 검증 준비');
    }
   }
   if(n===11){
    const project=path.join(work,'..','service-e-learning');await command(['cp','-R','projects/service-e','../service-e-learning'],work,r);
    await command(['npm','ci'],project,r);const d=await start(['npm','run','dev'],project,r,4207);dev=d.server;
    const p=await context.newPage();last=p;await p.goto(d.url);await p.getByText('새 서비스의 첫 화면',{exact:true}).waitFor();
    const source=path.join(project,'src/Widget.jsx');fs.writeFileSync(source,fs.readFileSync(source,'utf8').replace('새 서비스의 첫 화면','E 팀 학습 화면'));
    await p.getByText('E 팀 학습 화면',{exact:true}).waitFor({timeout:30000});await stop(dev);dev=null;
    await command(['npm','version','1.0.1','--no-git-tag-version'],project,r);await command(['npm','run','build'],project,r);
    const published=JSON.parse(await command(['node','tools/publish.cjs','../../service-e-learning'],path.join(work,'integration'),r));
    const shell=(await command(['node','-e','const fs=require("node:fs");const c=JSON.parse(fs.readFileSync("../artifact-store/current.json"));const s=JSON.parse(fs.readFileSync("../artifact-store/compositions/"+c.compositionId+".json"));console.log(s.selected.shell);'],path.join(work,'integration'),r)).trim();
    await command(['node','tools/activate.cjs','--bind',shell+':e='+published.published],path.join(work,'integration'),r);
    const fresh=await open();await fresh.getByText('E 팀 학습 화면',{exact:true}).waitFor();assert.equal(await old.getByText('E 팀 학습 화면',{exact:true}).count(),0);
    note('별도 E 생성·SDK 단독 실행·수정·버전 변경·발행·고정 Shell 연결');
    r.notes.push('보완된 상대 복사/발행 경로와 Shell ID 출력 명령을 실제 실행. published와 Shell ID를 연결 명령에 대입.');
   }
   if(n===18||n===19){
    const profile=n===18?'registered':'dashboard';await command(['npm','run','select','--',profile],work,r);
    const fresh=await open();
    if(n===18){await fresh.getByTestId('menu-link-notifications').click();await fresh.getByTestId('service-e-menu-notifications').waitFor();assert.equal(await old.getByTestId('menu-link-notifications').count(),0);}
    else{for(const id of ['b14','b14-copy','b21'])await widget(fresh,'dashboard-'+id).waitFor();await exercise(fresh,'dashboard-b14');assert.equal(await widget(fresh,'dashboard-b14-copy').getByTestId('count').innerText(),'0');}
    note('문서의 '+profile+' 프로필로 새 메뉴/위젯 배치·기존 탭 비교');
   }
   if(n===5){
    const a=await open('/admin');const baseline=fileJSON(path.join(work,'artifact-store/current.json')).compositionId;
    const select=a.getByTestId('select-sdk');await select.waitFor();const choices=await select.locator('option').evaluateAll(xs=>xs.map(x=>({value:x.value,text:x.textContent,disabled:x.disabled})));
    const oldValue=await select.inputValue(),next=choices.find(x=>x.value&&x.value!==oldValue&&!x.disabled);assert(next,'A selectable alternate SDK');await select.selectOption(next.value);
    await a.getByTestId('preview').click();await a.getByTestId('preview-valid').waitFor();await a.getByTestId('apply').click();await a.getByTestId('admin-notice').filter({hasText:'조합을 적용했습니다'}).waitFor();
    const fresh=await open();await widget(fresh).waitFor();assert.notEqual(await widget(fresh).getByTestId('platform-version').innerText(),await widget(old).getByTestId('platform-version').innerText());
    await a.getByTestId('history-'+baseline).getByRole('button',{name:'불러오기',exact:true}).click();await a.getByTestId('preview').click();await a.getByTestId('preview-valid').waitFor();await a.getByTestId('apply').click();await a.getByTestId('current-sdk').filter({hasText:await widget(old).getByTestId('platform-version').innerText()}).waitFor();note('관리 UI에서 SDK 선택·검사·적용·이전 조합 불러오기·재검사·롤백');
   }
   if(n>=6&&n<=9){
    const a=await open('/admin#lifecycle');await a.getByTestId('lifecycle-panel').waitFor();await a.locator('[data-testid^="release-b_1_4_0_"]').click();await a.getByTestId('release-detail').waitFor();
    if(n===6){await a.locator('#support-end').fill('2030-12-31');await a.locator('#notice-reference').fill('학습용 종료 공지 기록');await a.getByRole('button',{name:'지원 정책 저장'}).click();await a.getByTestId('lifecycle-saved').waitFor();note('UI에서 종료 예정일·공지 기록 저장 및 삭제 보류 확인');}
    if(n===7){await a.locator('[data-testid^="release-b_1_5_0_"]').click();await a.locator('#support-end').fill('2020-01-01');await a.locator('#notice-reference').fill('학습용 종료 공지 기록');await a.getByRole('button',{name:'지원 정책 저장'}).click();await a.getByTestId('lifecycle-saved').waitFor();let rejected=false;try{await command(['npm','run','select','--','upgraded'],work,r);}catch(e){rejected=true;r.expectedRejection=e.message.slice(0,700);}assert(rejected);note('종료한 B 1.5를 신규 선택하면 실제 거절');}
    if(n===8||n===9){note('정상 시연의 탭·버전 관리 화면 확인; 시간/구형 탭 재현은 분리된 npm test에서 확인');}
   }
   if(n===20){
    const contexts=[];
    async function user(id){const c=await browser.newContext({viewport:{width:1440,height:1000}});contexts.push(c);const p=await c.newPage();last=p;await p.goto(url+'/subscriptions');await p.getByTestId('demo-user').selectOption(id);await p.getByTestId('login').click();await p.getByTestId('saved-user').waitFor();return{c,p};}
    async function saveUser(u,version,baseIndex){await u.p.getByTestId('subscription-base').selectOption({index:baseIndex});if(!await u.p.locator('[data-testid^="subscription-row-"]').count())await u.p.getByTestId('add-subscription-widget').click();const s=u.p.getByTestId('subscription-widget-0');const value=await s.locator('option').evaluateAll((xs,v)=>xs.find(x=>x.textContent.includes('B '+v)&&x.value.endsWith('|car-picker'))?.value,version);assert(value,'Visible widget option B '+version);await s.selectOption(value);await u.p.getByTestId('preview-subscription').click();await u.p.getByTestId('subscription-preview').waitFor();await u.p.getByTestId('save-subscription').click();await u.p.getByTestId('subscription-notice').filter({hasText:'저장했습니다'}).waitFor();}
    const alice=await user('alice'),bob=await user('bob'),carol=await user('carol');await saveUser(alice,'1.4.0',0);await saveUser(bob,'2.1.0',1);
    const ap=await alice.c.newPage();await ap.goto(url+'/');await widget(ap,'dashboard-widget-1').waitFor();await exercise(ap,'dashboard-widget-1');const bp=await bob.c.newPage();await bp.goto(url+'/');await textIs(widget(bp,'dashboard-widget-1').getByTestId('version'),'2.1.0');
    await saveUser(alice,'1.5.0',0);const an=await alice.c.newPage();await an.goto(url+'/');await textIs(widget(an,'dashboard-widget-1').getByTestId('version'),'1.5.0');await kept(ap,'dashboard-widget-1');
    await saveUser(carol,'1.4.0',0);await carol.c.close();const a=await open('/admin#lifecycle');await a.locator('[data-testid^="release-b_1_4_0_"]').click();await a.getByTestId('saved-subscription-references').getByText('Carol',{exact:true}).waitFor();
    note('Alice/Bob 다른 구독 동시 사용·Alice 전환과 기존 탭 유지·미접속 Carol 보호 표시');
    for(const c of contexts)await c.close();
   }
   await last.screenshot({path:path.join(out,item.id+'.png')});
   await context.close();context=null;await stop(server);server=null;
   // The guide uses this command for failure injection and time/retirement scenarios.
   const testLog=await command(['npm','test'],work,r);r.featureChecks=(testLog.match(/^PASS /gm)||[]).length;assert(r.featureChecks>0);
   note('문서의 npm test: '+r.featureChecks+'개 기능 검사 통과');
   fs.cpSync(path.join(work,'verification'),path.join(out,item.id,'verification'),{recursive:true});
   const detailed=path.join(work,'integration/artifacts/verification');if(fs.existsSync(detailed))fs.cpSync(detailed,path.join(out,item.id,'integration-verification'),{recursive:true});
   r.status='passed';
  }catch(e){r.status='failed';r.error=e.stack;console.error('FAIL',n,e.message);if(last&&!last.isClosed())await last.screenshot({path:path.join(out,item.id+'-failure.png')}).catch(()=>{});}
  finally{await context?.close();await stop(dev);await stop(server);r.finishedAt=new Date().toISOString();if(r.status==='passed'){fs.rmSync(temp,{recursive:true,force:true});delete r.work;}save();console.log('FINISH',n,r.status);}
 }
}finally{await browser?.close();report.status=report.examples.length===20&&report.examples.every(x=>x.status==='passed')?'passed':'incomplete';report.featureChecks=report.examples.reduce((n,x)=>n+(x.featureChecks||0),0);report.finishedAt=new Date().toISOString();if(report.examples.some(x=>sequence.includes(x.number)&&x.status!=='passed'))process.exitCode=1;save();}
