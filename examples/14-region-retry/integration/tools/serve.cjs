const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {store,current}=require('./store.cjs');
const root=path.resolve(__dirname,'../..');
const types={'.js':'text/javascript','.json':'application/json','.html':'text/html; charset=utf-8','.css':'text/css','.map':'application/json'};
const server=http.createServer((req,res)=>{
 try {
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  const url=new URL(req.url,'http://localhost'); let name=decodeURIComponent(url.pathname);
  if(name==='/registry.json'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(current()));return;}
  const base=name==='/guide'?path.join(root,'docs'):store;
  if(name==='/guide')name='/index.html';
  if(name==='/')name='/compositions/'+current().compositionId+'.html';
  if(base===store&&!/^\/(artifacts|compositions)\//.test(name)){res.writeHead(404).end();return;}
  const file=path.resolve(base,'.'+name);
  if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()||!fs.realpathSync(file).startsWith(fs.realpathSync(base)+path.sep)){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
 }catch(e){res.writeHead(500).end(e.message);}
});
server.listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('MF proof: http://127.0.0.1:'+server.address().port));
for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>server.close(()=>process.exit(0)));
