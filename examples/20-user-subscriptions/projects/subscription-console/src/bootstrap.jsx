import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

async function request(endpoint, body, token) {
  const response = await fetch('/api/subscriptions/' + endpoint, { method: body ? 'POST' : 'GET', cache:'no-store',
    headers: body ? {'Content-Type':'application/json', ...(token ? {'X-MFE-CSRF':token} : {})} : {},
    ...(body ? {body:JSON.stringify(body)} : {}) });
  const result = await response.json(); if (!response.ok) throw Error(result.error || '요청을 처리하지 못했습니다.'); return result;
}
function App() {
  const [session,setSession] = useState(null), [identity,setIdentity] = useState('alice');
  const [data,setData] = useState(null), [draft,setDraft] = useState(null), [review,setReview] = useState(null);
  const [busy,setBusy] = useState(false), [error,setError] = useState(''), [notice,setNotice] = useState(''), [confirm,setConfirm] = useState(false);
  function accept(next) {
    setData(next); setDraft({expectedRevision:next.subscription.revision,
      baseCompositionId:next.subscription.baseCompositionId || next.bases.find(b=>!b.retired)?.compositionId || '',
      dashboard:next.subscription.dashboard || []}); setReview(null); setConfirm(false);
  }
  async function load() {
    const s=await request('session');setSession(s);
    if(s.user){setIdentity(s.user.id);accept(await request('state'));}else{setData(null);setDraft(null);}
  }
  useEffect(()=>{let alive=true;request('session').then(async s=>{if(!alive)return;setSession(s);if(s.user){setIdentity(s.user.id);const next=await request('state');if(alive)accept(next);}}).catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};},[]);
  async function action(work){setBusy(true);setError('');setNotice('');try{await work();}catch(e){setError(e.message);setReview(null);}finally{setBusy(false);}}
  function edit(value){setDraft(value);setReview(null);setNotice('');setError('');setConfirm(false);}
  function update(index,change){edit({...draft,dashboard:draft.dashboard.map((w,i)=>i===index?{...w,...change}:w)});}
  function add(){const first=data.widgets.find(w=>w.selectionState==='available');if(!first)return;let number=1;while(draft.dashboard.some(w=>w.id===`widget-${number}`))number++;
    edit({...draft,dashboard:[...draft.dashboard,{id:`widget-${number}`,title:first.title,artifactId:first.artifactId,widgetId:first.id,span:1}]});}
  return <div className="app">
    <header><a className="brand" href="/subscriptions"><span>M</span> Platform Lab</a><nav><a href="/admin#lifecycle">사용 현황·삭제 관리</a><a href="/guide">설명서</a></nav></header>
    <main><div className="eyebrow">PERSONAL SUBSCRIPTIONS · EXAMPLE 20</div><h1>내가 사용하는 위젯과 버전</h1><p className="intro">배포 조합을 고르고 필요한 위젯을 저장하세요. 기존 탭은 유지하고, 새로 여는 화면부터 적용합니다.</p>
      <section className="identity"><div><h2>데모 사용자</h2><p>실서비스 로그인 대신 사용하는 로컬 예제입니다. 다른 사용자를 동시에 비교하려면 별도 브라우저 프로필을 사용하세요.</p></div>
        <div className="controls"><label>사용자<select data-testid="demo-user" value={identity} disabled={busy} onChange={e=>setIdentity(e.target.value)}>{(session?.users||[{id:'alice',name:'Alice'},{id:'bob',name:'Bob'},{id:'carol',name:'Carol'}]).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
        <button data-testid="login" disabled={busy} onClick={()=>action(async()=>{await request('login',{userId:identity});await load();})}>이 사용자로 계속</button></div>
      </section>
      {error&&<p className="alert" role="alert" data-testid="subscription-error">{error}</p>}
      {notice&&<p className="success" role="status" data-testid="subscription-notice">{notice}</p>}
      {data&&draft ? <>
        <section className="saved"><div><span className="eyebrow">SAVED FOR {data.user.name.toUpperCase()}</span><h2 data-testid="saved-user">{data.user.name}의 구독</h2><p data-testid="saved-status">{data.subscription.active?`저장됨 · 위젯 ${data.subscription.dashboard.length}개 · 변경 번호 ${data.subscription.revision}`:'저장된 구독이 없습니다.'}</p>
          {data.subscription.active&&<details><summary>고정한 배포 조합 확인</summary><code data-testid="saved-composition">{data.subscription.compositionId}</code></details>}</div>
          <div className="controls"><button className="secondary" disabled={busy} data-testid="reload-subscription" onClick={()=>action(load)}>저장된 구독 불러오기</button>{data.subscription.active&&<a className="button" data-testid="open-dashboard" href="/" target="_blank" rel="noreferrer">내 대시보드 새 탭 ↗</a>}</div>
        </section>
        <section><div className="section-head"><div><h2>1. 사용할 배포 조합</h2><p>SDK와 서비스의 하위 버전은 이 조합을 기준으로 고정됩니다.</p></div></div>
          <label>배포 조합<select data-testid="subscription-base" disabled={busy} value={draft.baseCompositionId} onChange={e=>edit({...draft,baseCompositionId:e.target.value})}>{data.bases.map(b=><option key={b.compositionId} value={b.compositionId} disabled={b.retired}>{b.label} · SDK {b.platformVersion}{b.retired?' · 선택 종료':''}</option>)}</select></label>
        </section>
        <section><div className="section-head"><div><h2>2. 구독할 위젯 버전</h2><p>서비스가 공개한 위젯만 선택할 수 있습니다. 같은 위젯도 서로 다른 버전으로 추가할 수 있습니다.</p></div><button data-testid="add-subscription-widget" disabled={busy||draft.dashboard.length>=24} onClick={add}>위젯 추가</button></div>
          {!draft.dashboard.length&&<p className="empty">위젯을 추가하면 내 대시보드에 표시됩니다.</p>}
          <div className="widgets">{draft.dashboard.map((item,index)=><fieldset key={item.id} disabled={busy} data-testid={`subscription-row-${index}`}><legend>위젯 {index+1}</legend>
            <label>공개 위젯·버전<select data-testid={`subscription-widget-${index}`} value={item.artifactId+'|'+item.widgetId} onChange={e=>{const selected=data.widgets.find(w=>w.artifactId+'|'+w.id===e.target.value);update(index,{artifactId:selected.artifactId,widgetId:selected.id,title:selected.title});}}>
              {data.widgets.map(w=><option key={w.artifactId+'|'+w.id} value={w.artifactId+'|'+w.id} disabled={w.selectionState!=='available'}>{w.service.toUpperCase()} {w.version} · {w.title}{w.selectionState!=='available'?' · 신규 선택 불가':''}</option>)}</select></label>
            <label>표시 제목<input maxLength="60" data-testid={`subscription-title-${index}`} value={item.title} onChange={e=>update(index,{title:e.target.value})}/></label>
            <label>너비<select value={item.span} onChange={e=>update(index,{span:Number(e.target.value)})}><option value="1">한 칸</option><option value="2">전체 너비</option></select></label>
            <div className="controls"><button className="secondary" disabled={index===0} onClick={()=>{const items=[...draft.dashboard];[items[index-1],items[index]]=[items[index],items[index-1]];edit({...draft,dashboard:items});}}>위로</button><button className="secondary" data-testid={`remove-subscription-widget-${index}`} onClick={()=>edit({...draft,dashboard:draft.dashboard.filter((_,i)=>i!==index)})}>제거</button></div>
          </fieldset>)}</div>
        </section>
        <section className="review"><h2>3. 검사하고 저장</h2><p>저장해도 다른 사용자의 구독이나 열려 있는 탭은 바뀌지 않습니다.</p>
          {review&&<div className="success" data-testid="subscription-preview"><strong>조합 검사 통과</strong><p>위젯 {review.dashboard.length}개 · SDK {review.platformVersion} · 직접·하위 의존성까지 고정</p><details><summary>실제 위젯 의존 버전</summary><ul>{review.dashboard.map(w=>{const a=review.artifacts[w.artifactId],edges=review.runtimeBindings[a.id]||{};return <li key={w.id}>{w.title}: {a.service.toUpperCase()} {a.version}{Object.entries(edges).map(([alias,id])=>` → ${alias.toUpperCase()} ${review.artifacts[id].version}`).join('')}</li>;})}</ul></details></div>}
          <div className="controls"><button className="secondary" data-testid="preview-subscription" disabled={busy} onClick={()=>action(async()=>setReview((await request('preview',draft,data.csrfToken)).composition))}>조합 검사</button><button data-testid="save-subscription" disabled={busy||!review} onClick={()=>action(async()=>{await request('save',{...draft,previewedCompositionId:review.compositionId},data.csrfToken);await load();setNotice('내 구독을 저장했습니다. 새 탭부터 적용됩니다.');})}>내 구독 저장</button></div>
        </section>
        {data.subscription.active&&<section className="cancel"><h2>구독 해제</h2><p>저장된 구독의 참조를 해제합니다. 기존 탭과 공지·보관 기간은 계속 보호합니다.</p>{!confirm?<button className="secondary" data-testid="cancel-subscription" disabled={busy} onClick={()=>setConfirm(true)}>내 구독 해제</button>:<div className="controls"><span>저장된 구독을 해제할까요?</span><button className="danger" data-testid="confirm-cancel-subscription" disabled={busy} onClick={()=>action(async()=>{await request('cancel',{expectedRevision:data.subscription.revision},data.csrfToken);await load();setNotice('저장된 구독을 해제했습니다. 기존 탭은 계속 보호합니다.');})}>해제 확인</button><button className="secondary" onClick={()=>setConfirm(false)}>유지</button></div>}</section>}
      </>:<p className="empty">사용자를 선택하면 저장된 구독을 불러옵니다.</p>}
    </main><footer>저장된 구독은 접속 여부와 관계없이 보호됩니다. 파일 삭제는 별도의 관리 절차를 거칩니다.</footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
