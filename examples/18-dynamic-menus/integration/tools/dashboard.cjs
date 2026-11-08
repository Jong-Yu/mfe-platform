const { validateWidgets } = require('../../projects/platform-build-tools/lib/widgets.cjs');
const protocol = 'registered-dashboard-v1';
const aliasFor = id => `dashboard/${id}`;
function validateDashboard(value, shell, requireArtifact) {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.length > 24) throw new Error('대시보드에는 최대 24개 위젯을 배치할 수 있습니다.');
  if (shell.dashboardProtocol !== protocol) throw new Error('등록형 대시보드를 지원하는 Shell로 먼저 전환해 주세요.');
  const ids = new Set();
  return value.map(item => {
    if (!item || Object.keys(item).sort().join(',') !== 'artifactId,id,span,title,widgetId') throw new Error('위젯 배치에는 id, title, artifactId, widgetId, span만 지정할 수 있습니다.');
    if (typeof item.id !== 'string' || !/^[a-z][a-z0-9-]{0,39}$/.test(item.id) || ids.has(item.id)) throw new Error('배치 ID는 소문자·숫자·하이픈으로 만들고 중복하지 마세요.');
    if (typeof item.title !== 'string' || !item.title.trim() || item.title.length > 60) throw new Error('배치 제목은 60자 이내로 입력하세요.');
    if (![1,2].includes(item.span)) throw new Error('위젯 너비는 1칸 또는 2칸이어야 합니다.');
    const artifact = requireArtifact(item.artifactId);
    validateWidgets(artifact.widgets, artifact);
    if (artifact.kind !== 'remote' || ['platform','admin'].includes(artifact.service) || !artifact.widgets?.some(widget => widget.id === item.widgetId)) throw new Error('서비스가 대시보드용으로 공개한 위젯만 선택할 수 있습니다.');
    if (!artifact.runtimeRequirements?.platform) throw new Error('공개 위젯은 지원하는 SDK 범위를 선언해야 합니다.');
    if (Object.hasOwn(shell.runtimeDependencies || {},aliasFor(item.id))) throw new Error('배치 ID가 Shell의 고정 별칭과 충돌합니다.');
    ids.add(item.id);
    return { id:item.id, title:item.title.trim(), artifactId:artifact.id, widgetId:item.widgetId, span:item.span };
  });
}
module.exports = { protocol, aliasFor, validateDashboard };
