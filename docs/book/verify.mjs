import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(root,'examples/20-user-subscriptions/integration/package.json'));
const {chromium}=require('playwright');
const output=path.join(root,'docs/verification/self-study');fs.mkdirSync(output,{recursive:true});
const book=path.join(root,'docs/mfe-self-study.html');
const report={status:'running',startedAt:new Date().toISOString(),scope:'Document browser QA only. The separate 20-example execution and 205 feature checks are recorded in ../walkthrough/report.json.',checks:[]};
let browser;
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'mfe-book-alone-'));
async function check(name,fn){await fn();report.checks.push({name,status:'passed'});console.log('PASS',name);}
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE_PATH||(fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined)});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage();const errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.goto(pathToFileURL(book).href);
 await check('20개 실습·4개 상세 문서·12개 개념 장과 해설 수록',async()=>{
  assert.equal(await page.locator('article.lab').count(),20);
  assert.equal(await page.locator('details.archive').count(),4);
  assert.equal(await page.locator('.chapter').count(),19);
  assert.equal(await page.locator('details.answer').count(),33);
  assert.equal(await page.locator('.reference').count(),24);
 });
 await check('권장 학습 순서와 이전·다음 예제 이동 일치',async()=>{
  const expected=[1,2,3,4,12,10,11,18,19,13,14,15,16,17,5,6,7,8,9,20];
  assert.deepEqual(await page.locator('article.lab').evaluateAll(xs=>xs.map(x=>Number(x.id.slice(4)))),expected);
  assert.equal(await page.locator('#lab-12 .lab-navigation a').last().getAttribute('href'),'#lab-10');
  assert.equal(await page.locator('#test-preparation').count(),1);
  assert.match(await page.locator('#lab-05 .lab-guidance').textContent(),/다시 ‘조합 검사’/);
  assert.match(await page.locator('#lab-10 .lab-guidance').textContent(),/내 OTA 화면 수정/);
  assert.match(await page.locator('#reader-review').textContent(),/205\/205/);
 });
 await check('모든 내부 목차·링크·로컬 자료 존재',async()=>{
  const links=await page.evaluate(()=>{
   const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
   const duplicates=ids.filter((x,i)=>ids.indexOf(x)!==i);
   const missing=[...document.querySelectorAll('a[href^="#"]')].filter(x=>!document.getElementById(decodeURIComponent(x.hash.slice(1)))).map(x=>x.hash);
   return{duplicates,missing,files:[...document.querySelectorAll('a')].map(x=>x.href).filter(x=>x.startsWith('file:'))};
  });
  assert.deepEqual(links.duplicates,[]);assert.deepEqual(links.missing,[]);
  for(const url of links.files)assert(fs.existsSync(fileURLToPath(url)),url);
  report.localLinks=links.files.length;
 });
 await page.screenshot({path:path.join(output,'desktop-cover.png')});
 await check('단어 검색에서 접힌 상세 부록까지 찾아 이동',async()=>{
  await page.locator('#search').fill('outbox_jobs');
  const result=page.locator('#search-results a').filter({hasText:'상세: DB 상세 설계'});
  await result.click();
  assert.equal(await page.locator('#ref-database').getAttribute('open'),'');
  assert.equal(await page.locator('#ref-database h4').count()>5,true);
  await page.locator('#search').fill('');
  await page.evaluate(()=>{document.querySelector('#ref-database').open=false;});
 });
 await check('목차에서 본문·예제·해설로 이동',async()=>{
  await page.locator('.toc a[href="#roles"]').click();
  assert.equal(new URL(page.url()).hash,'#roles');
  await page.locator('#roles .answer summary').click();
  assert.equal(await page.locator('#roles .answer').getAttribute('open'),'');
  await page.evaluate(()=>document.querySelector('#roles').scrollIntoView({behavior:'instant'}));
  await page.screenshot({path:path.join(output,'desktop-roles.png')});
  await page.locator('#lab-20-reference > summary').click();
  assert.equal(await page.locator('#lab-20-reference').getAttribute('open'),'');
  await page.locator('#lab-20-reference > summary').click();
 });
 await check('학습 체크 저장 후 새로 열어 복원',async()=>{
  await page.locator('[data-progress="foundation"]').check();
  await page.reload();
  assert.equal(await page.locator('[data-progress="foundation"]').isChecked(),true);
  assert.match(await page.locator('#progress-label').textContent(),/1 \/ 6/);
  await page.locator('[data-progress="foundation"]').uncheck();
 });
 await check('390px 화면에서 본문·예제·상세 문서 넘침 없음',async()=>{
  await page.setViewportSize({width:390,height:844});await page.reload();
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:path.join(output,'mobile-cover.png')});
  for(const id of ['roles','isolation','lab-11','lab-19','lab-20','reader-review','ref-database']){
   await page.evaluate(id=>{const e=document.getElementById(id);if(e.tagName==='DETAILS')e.open=true;e.scrollIntoView({behavior:'instant'});},id);
   const widths=await page.evaluate(()=>({w:innerWidth,s:document.documentElement.scrollWidth}));
   assert(widths.s<=widths.w+1,JSON.stringify({id,...widths}));
  }
  await page.evaluate(()=>{document.querySelector('#ref-database').open=false;document.querySelector('#lab-20').scrollIntoView({behavior:'instant'});});
  await page.waitForFunction(()=>Math.abs(document.querySelector('#lab-20').getBoundingClientRect().top)<200);
  await page.screenshot({path:path.join(output,'mobile-lab20.png')});
 });
 await check('인쇄 모드의 본문/전체 부록 선택과 화면 상태 복원',async()=>{
  const before=await page.locator('details[open]').count();
  await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
  assert.equal(await page.locator('.print-expand[open]').count(),0);
  assert.equal(await page.locator('.answer[open]').count(),33);
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('.sidebar').isVisible(),false);
  assert.equal(await page.locator('#roles').isVisible(),true);
  await page.emulateMedia({media:'screen'});
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  assert.equal(await page.locator('details[open]').count(),before);
  await page.locator('#print-appendices').check();
  await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
  assert.equal(await page.locator('.print-expand[open]').count(),24);
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await page.locator('#print-appendices').uncheck();
 });
 await check('HTML 한 파일만 다른 폴더로 복사해 오프라인 열기',async()=>{
  const standalone=path.join(temp,'book.html');fs.copyFileSync(book,standalone);
  const isolated=await browser.newContext({offline:true,viewport:{width:1280,height:900}});
  const p=await isolated.newPage(),network=[];p.on('request',r=>network.push(r.url()));p.on('pageerror',e=>errors.push(e.message));
  await p.goto(pathToFileURL(standalone).href);
  assert.equal(await p.locator('.lab').count(),20);
  await p.locator('#lab-20-reference > summary').click();
  await p.locator('#lab-20-reference img').first().scrollIntoViewIfNeeded();
  await p.evaluate(()=>document.querySelectorAll('#lab-20-reference img').forEach(x=>x.loading='eager'));
  await p.waitForFunction(()=>[...document.querySelectorAll('#lab-20-reference img')].every(x=>x.complete&&x.naturalWidth>0));
  assert.deepEqual(network.filter(x=>!x.startsWith('file:')&&!x.startsWith('data:')),[]);
  assert.equal(network.filter(x=>x.startsWith('file:')).length,1);
  await isolated.close();
 });
 await check('자바스크립트 없이도 본문·상세·해설 읽기',async()=>{
  const c=await browser.newContext({javaScriptEnabled:false});const p=await c.newPage();
  await p.goto(pathToFileURL(book).href);
  assert.equal(await p.locator('#basics').isVisible(),true);
  await p.locator('#lab-20-reference > summary').click();
  assert.equal(await p.locator('#lab-20-reference .reference-body').isVisible(),true);
  await c.close();
 });
 await check('추가 네트워크 의존과 브라우저 예외 없음',async()=>{
  assert.deepEqual(errors,[]);
  assert.deepEqual(requests.filter(x=>!x.startsWith('file:')&&!x.startsWith('data:')),[]);
 });
 report.status='passed';
}catch(e){report.status='failed';report.error=e.stack;process.exitCode=1;console.error(e);}
finally{await browser?.close();fs.rmSync(temp,{recursive:true,force:true});report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
