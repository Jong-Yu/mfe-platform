const protocol = 'registered-menu-v1';
const aliasFor = id => `menu/${id}`;

function validateNavigation(value, shell, requireArtifact) {
  if (!Array.isArray(value) || value.length > 50) throw new Error('메뉴는 최대 50개의 목록으로 지정해야 합니다.');
  if (value.length && shell.navigationProtocol !== protocol) throw new Error('등록형 메뉴를 지원하는 Shell로 먼저 전환해 주세요.');
  const ids = new Set(), paths = new Set();
  return value.map(item => {
    if (!item || Object.keys(item).sort().join(',') !== 'artifactId,exposedModule,id,label,path') throw new Error('메뉴에는 id, label, path, artifactId, exposedModule만 지정할 수 있습니다.');
    if (typeof item.id !== 'string' || !/^[a-z][a-z0-9-]{0,39}$/.test(item.id) || ids.has(item.id)) throw new Error('메뉴 ID는 소문자·숫자·하이픈으로 만들고 중복하지 마세요.');
    if (typeof item.label !== 'string' || !item.label.trim() || item.label.length > 60) throw new Error('메뉴 이름을 60자 이내로 입력해 주세요.');
    if (typeof item.path !== 'string' || !/^\/services\/[a-z][a-z0-9-]{0,59}$/.test(item.path) || paths.has(item.path)) throw new Error('메뉴 주소는 중복 없는 /services/이름 형식이어야 합니다.');
    if (typeof item.exposedModule !== 'string' || !/^\.\/[A-Za-z][A-Za-z0-9_/-]{0,79}$/.test(item.exposedModule)) throw new Error('공개 모듈 이름을 ./Widget 형식으로 입력해 주세요.');
    const artifact = requireArtifact(item.artifactId);
    if (artifact.kind !== 'remote' || ['platform', 'admin'].includes(artifact.service)) throw new Error('메뉴에는 발행된 업무용 Remote를 선택해야 합니다.');
    if (artifact.exposedModules && !artifact.exposedModules.includes(item.exposedModule)) throw new Error('해당 배포물이 공개하지 않은 모듈입니다.');
    if (Object.hasOwn(shell.runtimeDependencies || {}, aliasFor(item.id))) throw new Error('메뉴 ID가 Shell의 고정된 의존 별칭과 충돌합니다.');
    ids.add(item.id); paths.add(item.path);
    return { id: item.id, label: item.label.trim(), path: item.path, artifactId: artifact.id, exposedModule: item.exposedModule };
  });
}
module.exports = { protocol, aliasFor, validateNavigation };
