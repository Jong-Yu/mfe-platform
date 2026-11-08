import React from 'react';
import { shortId } from './model';
import { DependencyFields } from './ServiceMenus';

export default function DashboardEditor({ draft, catalog, current, disabled, onChange, onBinding }) {
  const placements = draft.dashboard || [];
  const locked = disabled || current.shell.dashboardProtocol !== 'registered-dashboard-v1';
  const candidates = Object.values(catalog).filter(artifact => artifact.widgets?.length && artifact.kind === 'remote' && !['platform','admin'].includes(artifact.service));
  const update = (index, change) => onChange(placements.map((item,i) => i === index ? {...item,...change} : item));
  function add() {
    let n=1;while(placements.some(item=>item.id===`widget-${n}`))n++;
    onChange([...placements,{id:`widget-${n}`,title:'새 위젯',artifactId:'',widgetId:'',span:1}]);
  }
  function move(index, offset) { const next=[...placements];[next[index],next[index+offset]]=[next[index+offset],next[index]];onChange(next); }
  return <section className="dashboard-editor" aria-labelledby="dashboard-editor-heading">
    <h3 id="dashboard-editor-heading">공개 위젯 선택과 배치</h3>
    <p className="muted">서비스가 대시보드용으로 공개한 위젯을 선택하세요. 위에서 아래 순서로, 한 줄에 2칸씩 배치합니다. 모바일에서는 한 줄에 하나씩 표시합니다.</p>
    {current.shell.dashboardProtocol !== 'registered-dashboard-v1' ? <p role="status">등록형 대시보드를 지원하는 Shell로 최초 한 번 전환해야 합니다.</p> : null}
    {!candidates.length ? <p role="status">공개된 위젯이 없습니다. 서비스 팀이 widgets 목록을 선언해 빌드·발행하면 여기에 표시됩니다.</p> : null}
    <div className="dashboard-preview" aria-label="배치 미리보기" data-testid="dashboard-preview">
      {placements.map((item,index)=><div key={index} className={`preview-tile preview-span-${item.span}`} data-testid={`preview-tile-${index}`}><strong>{index+1}. {item.title}</strong><span>{catalog[item.artifactId]?.service.toUpperCase() || '서비스 미선택'} · {item.span===2?'전체 너비':'절반 너비'}</span></div>)}
      {!placements.length ? <p>배치한 위젯이 없습니다.</p> : null}
    </div>
    <p className="field-hint">미리보기는 배치 모양만 보여줍니다. 관리 화면에서는 서비스 코드를 실행하지 않습니다.</p>
    {placements.map((item,index)=>{
      const artifact=catalog[item.artifactId];
      return <fieldset className="menu-card" key={index} disabled={locked} data-testid={`dashboard-row-${index}`}>
        <legend>위젯 {index+1}</legend><div className="menu-fields">
          <label>배치 ID<input data-testid={`dashboard-id-${index}`} value={item.id} maxLength={40} onChange={event=>update(index,{id:event.target.value})} /></label>
          <label>표시 제목<input data-testid={`dashboard-title-${index}`} value={item.title} maxLength={60} onChange={event=>update(index,{title:event.target.value})} /></label>
          <label>서비스와 배포 버전<select data-testid={`dashboard-artifact-${index}`} value={item.artifactId} onChange={event=>update(index,{artifactId:event.target.value,widgetId:''})}>
            <option value="">서비스를 선택하세요</option>{candidates.map(value=><option key={value.id} value={value.id} disabled={value.selectionState!=='available'}>{value.service.toUpperCase()} {value.version} · {shortId(value.id)}{value.selectionState!=='available'?' · 선택 불가':''}</option>)}
          </select></label>
          <label>공개 위젯<select data-testid={`dashboard-widget-${index}`} value={item.widgetId} onChange={event=>{const widget=artifact?.widgets.find(value=>value.id===event.target.value);update(index,{widgetId:event.target.value,...(item.title==='새 위젯'&&widget?{title:widget.title}:{})});}}>
            <option value="">공개 위젯을 선택하세요</option>{(artifact?.widgets||[]).map(widget=><option key={widget.id} value={widget.id}>{widget.title} · {widget.id}</option>)}
          </select></label>
          <label>너비<select data-testid={`dashboard-span-${index}`} value={item.span} onChange={event=>update(index,{span:Number(event.target.value)})}><option value={1}>절반 너비 · 1칸</option><option value={2}>전체 너비 · 2칸</option></select></label>
        </div>
        <DependencyFields artifact={artifact} catalog={catalog} bindings={draft.runtimeBindings} onBinding={onBinding} disabled={locked} />
        <div className="menu-actions">
          <button type="button" className="button secondary compact" data-testid={`dashboard-up-${index}`} disabled={locked||index===0} onClick={()=>move(index,-1)}>위로</button>
          <button type="button" className="button secondary compact" data-testid={`dashboard-down-${index}`} disabled={locked||index===placements.length-1} onClick={()=>move(index,1)}>아래로</button>
          <button type="button" className="button secondary compact" data-testid={`dashboard-remove-${index}`} onClick={()=>onChange(placements.filter((_,i)=>i!==index))}>위젯 제거</button>
        </div>
      </fieldset>;
    })}
    <div className="menu-actions"><button type="button" className="button secondary" data-testid="add-dashboard-widget" disabled={locked||placements.length>=24} onClick={add}>위젯 추가</button>
      <button type="button" className="button secondary" data-testid="clear-dashboard" disabled={locked||(!placements.length&&draft.dashboard!==undefined)} onClick={()=>onChange([])}>빈 대시보드로 설정</button></div>
    <p className="footnote">같은 위젯도 다른 배치 ID로 여러 번 추가할 수 있습니다. 배치 ID는 상태를 구분하므로 제목·순서만 바꿀 때는 유지하세요. 같은 배포물의 하위 버전 선택은 모든 사용처가 공유합니다. 제거해도 파일을 삭제하지 않습니다.</p>
  </section>;
}
