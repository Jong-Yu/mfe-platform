export const shortId = (id = '') => id.split('_').at(-1)?.slice(0, 8) || '—';
export const makeDraft = (composition) => ({ selected: { ...composition.selected }, runtimeBindings: structuredClone(composition.runtimeBindings || {}), navigation: structuredClone(composition.navigation || []), dashboard: composition.dashboard === undefined ? undefined : structuredClone(composition.dashboard) });
export function dependencyId(draft, artifact, alias) {
  return draft.runtimeBindings[artifact?.id]?.[alias] || artifact?.dependencies?.[alias];
}
export function pathFor(draft, catalog, role) {
  const app = catalog[draft.selected[role]];
  const b = catalog[dependencyId(draft, app, 'b')];
  const d = catalog[dependencyId(draft, b, 'd')];
  return { app, b, d };
}
export function changesBetween(current, draft, catalog) {
  const changes = [];
  const add = (label, from, to) => { if (from !== to) changes.push({ label, from: catalog[from], to: catalog[to] }); };
  for (const [role, label] of [['platform', '공통 SDK'], ['shell', 'Shell'], ['A', '서비스 A'], ['C', '서비스 C']]) add(label, current.selected[role], draft.selected[role]);
  for (const role of ['A', 'C']) {
    const before = pathFor(current, catalog, role), after = pathFor(draft, catalog, role);
    add(`${role} 경로 · B`, before.b?.id, after.b?.id);
    add(`${role} 경로 · D`, before.d?.id, after.d?.id);
  }
  const beforeMenus = current.navigation || [], afterMenus = draft.navigation || [];
  for (const id of new Set([...beforeMenus, ...afterMenus].map(item => item.id))) {
    const before = beforeMenus.find(item => item.id === id), after = afterMenus.find(item => item.id === id);
    if (JSON.stringify(before) !== JSON.stringify(after) || beforeMenus.indexOf(before) !== afterMenus.indexOf(after)) {
      const describe = (item, items) => item ? `${items.indexOf(item) + 1}. ${item.label} · ${item.path} · ${catalog[item.artifactId]?.service || '?'} ${catalog[item.artifactId]?.version || '미선택'} · ${item.exposedModule}` : '없음';
      changes.push({ label: `메뉴 ${id}`, textFrom: describe(before,beforeMenus), textTo: describe(after,afterMenus) });
    }
  }
  if (JSON.stringify(current.dashboard) !== JSON.stringify(draft.dashboard)) {
    const describe = items => items === undefined ? '대시보드 미설정' : items.length ? items.map((item,index) => `${index+1}. ${item.title} · ${catalog[item.artifactId]?.service || '?'} ${catalog[item.artifactId]?.version || '미선택'} · ${item.widgetId || '위젯 미선택'} · ${item.span}칸`).join(' / ') : '빈 대시보드';
    changes.push({label:'대시보드 배치',textFrom:describe(current.dashboard),textTo:describe(draft.dashboard)});
  }
  // Include dependency changes beneath registered pages and dashboard widgets.
  const owners = new Set(Object.keys(draft.runtimeBindings || {}));
  for (const owner of owners) for (const alias of Object.keys(catalog[owner]?.runtimeDependencies || {})) {
    const before = current.runtimeBindings?.[owner]?.[alias], after = draft.runtimeBindings[owner]?.[alias];
    if (before !== after && !changes.some(change => change.from?.id === before && change.to?.id === after)) add(`${catalog[owner].service} ${shortId(owner)} · ${alias}`,before,after);
  }
  return changes;
}
export function payloadFor(current, draft, catalog, rollbackTo) {
  const expectedCompositionId = current.compositionId;
  if (rollbackTo) return { expectedCompositionId, rollbackTo };
  const runtimeBindings = {};
  const visited = new Set();
  function visit(id) {
    if (!id || visited.has(id)) return;
    visited.add(id);
    const artifact = catalog[id];
    if (!artifact) return;
    Object.values(artifact.dependencies || {}).forEach(visit);
    for (const alias of Object.keys(artifact.runtimeDependencies || {})) {
      const target = draft.runtimeBindings[id]?.[alias];
      if (target) { (runtimeBindings[id] ||= {})[alias] = target; visit(target); }
    }
  }
  Object.values(draft.selected).forEach(visit);
  (draft.navigation || []).forEach(item => visit(item.artifactId));
  (draft.dashboard || []).forEach(item => visit(item.artifactId));
  return { expectedCompositionId, selected: draft.selected, runtimeBindings, navigation: draft.navigation || [], dashboard: draft.dashboard };
}
