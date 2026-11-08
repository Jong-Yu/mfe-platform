from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
import subprocess,json,os,sys
EX=Path(__file__).resolve().parents[1]
cases=json.loads((EX/'catalog.json').read_text())
if len(sys.argv)>1:cases=[c for c in cases if c['id'] in sys.argv[1:]]
def run(c):
 p=EX/c['id']; (p/'verification').mkdir(exist_ok=True)
 with open(p/'verification/test.log','w') as log:
  r=subprocess.run(['node','run.cjs','test'],cwd=p,env={**os.environ,'npm_config_cache':os.environ.get('NPM_CACHE',os.environ.get('npm_config_cache',str(Path.home()/'.npm'))),'NPM_CACHE':os.environ.get('NPM_CACHE',os.environ.get('npm_config_cache',str(Path.home()/'.npm')))},stdout=log,stderr=log)
 return {'id':c['id'],'exitCode':r.returncode}
results=[]
with ThreadPoolExecutor(max_workers=3) as pool:
 for task in as_completed([pool.submit(run,c) for c in cases]):
  r=task.result();results.append(r);print(r,flush=True)
(EX/'verification/test-results.json').write_text(json.dumps(results,indent=2)+'\n')
if any(r['exitCode'] for r in results):sys.exit(1)
