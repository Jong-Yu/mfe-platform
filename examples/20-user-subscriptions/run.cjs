const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=__dirname,config=require('./example.json'),integration=path.join(root,'integration');
const read=p=>JSON.parse(fs.readFileSync(p));
const project=name=>path.join(root,'projects',name);
const release=name=>read(path.join(project(name),'dist/release.json'));
function command(cmd,args,cwd){const result=spawnSync(cmd,args,{cwd,env:{...process.env,NODE_PATH:''},stdio:'inherit'});if(result.error||result.status!==0)throw result.error||Error(cmd+' failed: '+cwd);}
function npm(args,cwd){command(process.platform==='win32'?'npm.cmd':'npm',args,cwd);}
function setup(){for(const name of ['integration',...config.projects.map(n=>'projects/'+n)])npm(['ci','--ignore-scripts','--no-audit','--no-fund',...(process.env.MFE_OFFLINE?['--offline']:[])],path.join(root,name));}
function store(){return require('./integration/tools/store.cjs');}
function plan(name='baseline'){
 const recipe=read(path.join(root,'composition.config.json'));
 const spec=recipe.profiles[name];if(!spec)throw Error('Unknown profile. Choose: '+Object.keys(recipe.profiles).join(', '));
 const merged={...recipe.base,...spec},id=n=>release(n).id;
 const selected={platform:id(merged.platform),shell:id(merged.shell),A:id(merged.A),C:id(merged.C)};
 const bindings={};
 for(const [owner,edges] of Object.entries(recipe.edges)){
  const actualOwner=merged[owner]||owner, meta=release(actualOwner);
  for(const [alias,target] of Object.entries(edges))if(meta.runtimeDependencies?.[alias])
   (bindings[id(actualOwner)]||={})[alias]=id(merged[target]||target);
 }
 const navigation=(merged.navigation||[]).map(x=>({...x,artifactId:id(x.project)})).map(({project,...x})=>x);
 const dashboard=merged.dashboard?.map(x=>({...x,artifactId:id(x.project)})).map(({project,...x})=>x);
 return{selected,bindings,navigation,dashboard};
}
function select(name){const p=plan(name);return store().activate(p.selected,p.bindings,{replaceBindings:true,navigation:p.navigation,dashboard:p.dashboard??null});}
function build(names){
 const recipe=read(path.join(root,'composition.config.json'));
 for(const name of names){
  if(name==='platform-build-tools')continue;
  const original=name.replace(/-next$/,'');
  const file=path.join(project(name),'mf.dependencies.json'),deps=read(file);
  for(const alias of recipe.fixed[original]||[])deps[alias]=release(recipe.edges[original][alias]);
  fs.writeFileSync(file,JSON.stringify(deps,null,2)+'\n');
  npm(['run','build'],project(name));
  const artifact=store().publish(project(name));
  if(name==='platform-admin')store().selectAdmin(artifact.id);
  if(name==='subscription-console')store().updateMetadata('subscription-console.json',()=>({artifactId:artifact.id}));
 }
}
function ensureStore(){const dest=path.join(root,'artifact-store');if(!fs.existsSync(dest)){if(!fs.existsSync(path.join(root,'seed-store')))throw Error('No seed store. Build and select a baseline first.');fs.cpSync(path.join(root,'seed-store'),dest,{recursive:true});}}
module.exports={plan,select,build,config,project,release};
if(require.main===module){
 try{
  const [action,...args]=process.argv.slice(2);
  // CLI operations are confined to this example even if the caller has a global store variable.
  process.env.MFE_ARTIFACT_STORE=path.join(root,'artifact-store');
  if(action==='setup')setup();
  else if(action==='pins')require('./pins.cjs').check();
  else if(action==='build'){
   const names=args.length?args:config.buildOrder;for(const name of names)if(!config.projects.includes(name))throw Error('Unknown project: '+name);
   build(names);console.log('Published. Select a profile explicitly: npm run select -- baseline');
  }else if(action==='reset'){
   if(!fs.existsSync(path.join(root,'seed-store/current.json')))throw Error('Frozen seed missing.');
   fs.rmSync(path.join(root,'artifact-store'),{recursive:true,force:true});ensureStore();console.log('Restored only this example. Reload or close its existing tabs.');
  }else if(action==='select'){ensureStore();console.log(JSON.stringify(select(args[0]||'baseline'),null,2));}
  else if(action==='prepare:dev'){ensureStore();command(process.execPath,['tools/prepare-dev.cjs'],integration);}
  else if(action==='start'){ensureStore();process.env.PORT=process.env.PORT||String(config.port);require('./integration/tools/serve.cjs');}
  else if(action==='test'){
   ensureStore();command(process.execPath,['verify.mjs'],root);
   if(config.specialTest)command(process.execPath,['tests/'+config.specialTest+'.mjs'],integration);
  }else throw Error('Use setup, build, select, start, test, pins, reset, prepare:dev');
 }catch(e){console.error(e.message);process.exitCode=1;}
}
