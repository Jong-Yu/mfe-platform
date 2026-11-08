const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname,'../..');
process.env.MFE_ARTIFACT_STORE = path.join(root,'artifact-store');
const store = require('./store.cjs'), { select, release, config } = require('../../run.cjs');
if (Object.keys(store.read('subscriptions.json',{users:{}}).users).length) throw Error('구독 기록이 있는 저장소는 초기화하지 않습니다. 서버·탭을 닫고 npm run reset으로 제공 상태를 복원하세요.');
for (const name of config.buildOrder) {
  const a = store.publish(path.join(root,'projects',name));
  if (name === 'platform-admin') store.selectAdmin(a.id);
  if (name === 'subscription-console') store.updateMetadata('subscription-console.json',()=>({artifactId:a.id}));
}
const previous = select('previous'), baseline = select('baseline');
require('./publish-subscription-options.cjs').publishOptions();
const seed = path.join(root,'seed-store');
fs.rmSync(seed,{recursive:true,force:true});
fs.cpSync(store.store,seed,{recursive:true,filter:file=>!['demo-auth.json','usage.json','subscription-launches.json'].includes(path.basename(file))});
console.log('독립 예제의 두 배포 조합을 고정했습니다. 사용자 구독은 비어 있습니다.');
