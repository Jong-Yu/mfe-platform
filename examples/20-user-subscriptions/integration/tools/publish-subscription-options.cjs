const path = require('node:path');
const root = path.resolve(__dirname,'../..');
if (require.main === module) process.env.MFE_ARTIFACT_STORE = path.join(root,'artifact-store');
const store = require('./store.cjs'), { plan, release } = require('../../run.cjs');
function publishOptions() {
  return store.withStoreLock(() => {
    const recipe = require(path.join(root,'composition.config.json'));
    const entries = recipe.subscriptionProfiles.map(({ profile, label }) => {
      const p = plan(profile);
      return { label, composition: store.resolveComposition(p.selected,p.bindings,{replaceBindings:true,navigation:p.navigation,dashboard:p.dashboard},null) };
    });
    const widgetBindings = Object.fromEntries(Object.entries(recipe.subscriptionWidgetBindings).map(([owner, aliases]) => [
      release(owner).id, Object.fromEntries(Object.entries(aliases).map(([alias,target])=>[alias,release(target).id])),
    ]));
    for (const entry of entries) store.persistComposition(entry.composition, 'public');
    const options = { bases:entries.map(({label,composition})=>({label,compositionId:composition.compositionId})),widgetBindings };
    store.writeMetadata('subscription-options.json',options);
    return options;
  });
}
module.exports = { publishOptions };
if (require.main === module) { publishOptions(); console.log('선택 가능한 조합을 발행했습니다. 기존 사용자 구독과 전역 현재 조합은 유지됩니다.'); }
