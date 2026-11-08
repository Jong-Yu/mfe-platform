import React from 'react';
import { shortId } from './model';

export function DependencyFields({ artifact, catalog, bindings, onBinding, disabled, trail = [] }) {
  if (!artifact || trail.includes(artifact.id)) return null;
  return Object.entries(artifact.runtimeDependencies || {}).map(([alias, requirement]) => {
    const value = bindings[artifact.id]?.[alias] || '';
    const candidates = Object.values(catalog).filter(item => item.service === requirement.service && item.kind === 'remote');
    return <div className="menu-dependency" key={alias}>
      <label>{artifact.service} {artifact.version}가 사용할 {alias} ({requirement.requires})
        <select value={value} disabled={disabled} onChange={event => onBinding(artifact.id,alias,event.target.value)}>
          <option value="">하위 버전을 선택하세요</option>
          {candidates.map(item => <option key={item.id} value={item.id} disabled={item.selectionState !== 'available'}>{item.version} · {shortId(item.id)}{item.selectionState !== 'available' ? ' · 선택 불가' : ''}</option>)}
        </select>
      </label>
      <DependencyFields artifact={catalog[value]} catalog={catalog} bindings={bindings} onBinding={onBinding} disabled={disabled} trail={[...trail,artifact.id]} />
    </div>;
  });
}

export default function ServiceMenus({ draft, catalog, current, disabled, onChange, onBinding }) {
  const menus = draft.navigation || [];
  const supported = current.shell.navigationProtocol === 'registered-menu-v1';
  const locked = disabled || !supported;
  const candidates = Object.values(catalog).filter(item => item.kind === 'remote' && item.service !== 'platform');
  const update = (index, field, value) => onChange(menus.map((item,i) => i === index ? {...item,[field]:value} : item));
  function add() {
    let number=1;while(menus.some(item=>item.id===`service-${number}`))number++;
    onChange([...menus,{id:`service-${number}`,label:'새 서비스',path:`/services/service-${number}`,artifactId:'',exposedModule:'./Widget'}]);
  }
  function move(index, offset) { const next=[...menus];[next[index],next[index+offset]]=[next[index+offset],next[index]];onChange(next); }
  return <section className="menu-editor" aria-labelledby="menus-heading">
    <h3 id="menus-heading">서비스와 메뉴 등록</h3>
    <p className="muted">발행된 서비스의 버전을 골라 메뉴를 만드세요. 메뉴와 의존 관계를 검사하고 적용하면 새 탭부터 표시됩니다.</p>
    {!supported ? <p role="status">등록형 메뉴를 지원하는 Shell로 최초 한 번 전환해야 합니다.</p> : null}
    {!menus.length ? <p className="empty">등록한 서비스 메뉴가 없습니다.</p> : null}
    {menus.map((item,index) => <fieldset className="menu-card" key={index} disabled={locked} data-testid={`menu-row-${index}`}>
      <legend>메뉴 {index+1}</legend>
      <div className="menu-fields">
        <label>메뉴 ID<input data-testid={`menu-id-${index}`} value={item.id} maxLength={40} onChange={event=>update(index,'id',event.target.value)} /></label>
        <label>메뉴 이름<input data-testid={`menu-label-${index}`} value={item.label} maxLength={60} onChange={event=>update(index,'label',event.target.value)} /></label>
        <label>메뉴 주소<input data-testid={`menu-path-${index}`} value={item.path} placeholder="/services/alerts" onChange={event=>update(index,'path',event.target.value)} /></label>
        <label>서비스와 배포 버전<select data-testid={`menu-artifact-${index}`} value={item.artifactId} onChange={event=>update(index,'artifactId',event.target.value)}>
          <option value="">발행된 서비스를 선택하세요</option>
          {candidates.map(artifact=><option key={artifact.id} value={artifact.id} disabled={artifact.selectionState !== 'available'}>{artifact.service.toUpperCase()} {artifact.version} · {shortId(artifact.id)}{artifact.selectionState !== 'available' ? ' · 선택 불가' : ''}</option>)}
        </select></label>
        <label>공개 모듈<input data-testid={`menu-module-${index}`} value={item.exposedModule} onChange={event=>update(index,'exposedModule',event.target.value)} /></label>
      </div>
      <p className="field-hint">브라우저 주소: /#{item.path} · 화면은 React default export를 사용합니다. 메뉴 ID는 화면 상태를 구분하므로 이름만 바꿀 때는 유지하세요.</p>
      <DependencyFields artifact={catalog[item.artifactId]} catalog={catalog} bindings={draft.runtimeBindings} onBinding={onBinding} disabled={locked} />
      <div className="menu-actions">
        <button className="button secondary compact" type="button" disabled={locked||index===0} onClick={()=>move(index,-1)} data-testid={`menu-up-${index}`}>위로</button>
        <button className="button secondary compact" type="button" disabled={locked||index===menus.length-1} onClick={()=>move(index,1)} data-testid={`menu-down-${index}`}>아래로</button>
        <button className="button secondary compact" type="button" onClick={()=>onChange(menus.filter((_,i)=>i!==index))} data-testid={`menu-remove-${index}`}>메뉴 제거</button>
      </div>
    </fieldset>)}
    <button className="button secondary" type="button" onClick={add} disabled={locked||menus.length>=50} data-testid="add-service-menu">서비스 메뉴 추가</button>
    <p className="footnote">등록은 파일 업로드와 별개입니다. 메뉴 제거는 새 탭의 연결을 없애며 배포 파일을 삭제하지 않습니다. 기존 탭과 롤백 조합은 계속 보호합니다.</p>
  </section>;
}
