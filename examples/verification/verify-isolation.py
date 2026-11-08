from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
import json,shutil,subprocess,os,tempfile,hashlib
EX=Path(__file__).resolve().parents[1]
ENV={**os.environ,'npm_config_cache':os.environ.get('NPM_CACHE',os.environ.get('npm_config_cache',str(Path.home()/'.npm'))),'NPM_CACHE':os.environ.get('NPM_CACHE',os.environ.get('npm_config_cache',str(Path.home()/'.npm'))),'MFE_OFFLINE':'1'}
def j(p):return json.loads(p.read_text())
def run(args,cwd,log):
 r=subprocess.run(args,cwd=cwd,env=ENV,stdout=log,stderr=log)
 if r.returncode:raise Exception(str(args)+' failed; '+str(cwd))
def inventory(p):
 return {str(f.relative_to(p)):hashlib.sha256(f.read_bytes()).hexdigest() for f in p.rglob('*') if f.is_file() and not any(x in ['node_modules','artifact-store','verification','.mfe-dev'] for x in f.relative_to(p).parts) and not str(f.relative_to(p)).startswith('integration/artifacts/')}
OUT=EX/'verification';OUT.mkdir(exist_ok=True)
before={x['id']:inventory(EX/x['id']) for x in j(EX/'catalog.json')}
def check(item):
 name=item['id'];source=EX/name;temp=Path(tempfile.mkdtemp(prefix='mfe-independent-'));target=temp/name
 result={'id':name,'copiedOutsideWorkspace':True,'status':'running','checks':[]}
 try:
  shutil.copytree(source,target,ignore=shutil.ignore_patterns('node_modules','artifact-store','verification','.mfe-dev'))
  # Test reports are not prerequisites and are removed from the relocated copy.
  shutil.rmtree(target/'integration/artifacts',ignore_errors=True)
  with open(OUT/(name+'.log'),'w') as log:
   run(['npm','ci','--offline','--ignore-scripts','--no-audit','--no-fund'],target/'integration',log)
   run(['node','run.cjs','pins'],target,log);result['checks'].append('copied source/config/artifact hashes match')
   run(['node','run.cjs','test'],target,log);result['checks'].append('own server and full browser tests pass after relocation')
   if name in ['02-runtime-sdk','15-transitive-retry','19-dashboard-widgets']:
    old=j(target/'seed-store/current.json')
    run(['node','run.cjs','setup'],target,log);run(['node','run.cjs','build'],target,log);run(['node','run.cjs','select','baseline'],target,log)
    assert j(target/'artifact-store/current.json')==old,'Rebuilt composition differs from frozen seed'
    run(['node','run.cjs','pins'],target,log);result['checks'].append('full source rebuild reproduces pinned files and composition')
   if name=='15-transitive-retry':
    f=target/'projects/service-a/src/index.jsx';f.write_text(f.read_text().replace('A의 직접·간접 B 사용','분리된 예제의 독립 수정'))
    run(['node','run.cjs','build','service-a'],target,log);run(['node','run.cjs','select','baseline'],target,log)
    assert j(target/'artifact-store/current.json')!=old
    # verify starts from seed, so copy the edited store into this disposable seed for a real edited render.
    shutil.rmtree(target/'seed-store');shutil.copytree(target/'artifact-store',target/'seed-store')
    run(['node','verify.mjs'],target,log);result['checks'].append('edited A rebuilt and executed in relocated project')
  result['status']='passed'
 except Exception as e:result['status']='failed';result['error']=str(e)
 finally:shutil.rmtree(temp,ignore_errors=True)
 return result
results=[]
with ThreadPoolExecutor(max_workers=3) as pool:
 for task in as_completed([pool.submit(check,c) for c in j(EX/'catalog.json')]):
  r=task.result();results.append(r);print(r,flush=True)
after={x['id']:inventory(EX/x['id']) for x in j(EX/'catalog.json')}
unchanged=before==after
report={'status':'passed' if unchanged and all(r['status']=='passed' for r in results) else 'failed','originalExamplesUnchanged':unchanged,'examples':sorted(results,key=lambda x:x['id']),'scope':'All 19 complete example folders moved outside workspace with own npm install and full tests. Full source rebuild in 02/15/19; source edit and browser execution in 15. No outer source imports or prior test reports.'}
(OUT/'isolation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
if report['status']!='passed':raise SystemExit(1)
