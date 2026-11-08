// Shared by the build command and local registry validation. This is metadata,
// not executable service code; a declared widget still needs integration tests.
const widgetContract = 'platform-widget-v1';
function validateWidgets(widgets, { kind, service, exposedModules }) {
  if (widgets === undefined) return;
  if (kind !== 'remote' || ['platform','admin'].includes(service) || !Array.isArray(widgets) || widgets.length > 24) throw new Error('widgets는 업무 Remote가 공개하는 최대 24개 목록이어야 합니다.');
  const ids = new Set();
  for (const widget of widgets) {
    if (!widget || Object.keys(widget).sort().join(',') !== 'contract,exposedModule,id,title') throw new Error('위젯 공개에는 id, title, exposedModule, contract가 필요합니다.');
    if (typeof widget.id !== 'string' || !/^[a-z][a-z0-9-]{0,39}$/.test(widget.id) || ids.has(widget.id)) throw new Error('공개 위젯 ID가 잘못되었거나 중복되었습니다.');
    if (typeof widget.title !== 'string' || !widget.title.trim() || widget.title.length > 60) throw new Error('공개 위젯 이름은 60자 이내로 지정하세요.');
    if (widget.contract !== widgetContract) throw new Error('지원하지 않는 위젯 계약입니다.');
    if (!Array.isArray(exposedModules) || !exposedModules.includes(widget.exposedModule)) throw new Error('위젯은 실제 공개한 모듈을 지정해야 합니다.');
    ids.add(widget.id);
  }
}
module.exports = { widgetContract, validateWidgets };
