// Runs in a new document, after the old application's execution context left.
(async () => {
  const ticket = location.pathname.split('/')[2];
  if (!/^[a-f0-9]{64}$/.test(ticket || '')) return;
  const status = document.getElementById('transition-status');
  try {
    const config = await (await fetch('/api/runtime/config', {cache:'no-store'})).json();
    const response = await fetch('/api/runtime/transition-confirm', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ticket,token:config.token})});
    if (!response.ok) throw new Error('전환 확인을 저장하지 못했습니다. 관리 화면에서 기록을 다시 확인해 주세요.');
    status.textContent = '구형 화면의 종료를 확인했습니다. 최신 화면으로 이동합니다.';
    location.replace('/');
  } catch (error) {
    status.textContent = '전환 확인을 저장하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.';
    const retry = document.createElement('button'); retry.textContent = '전환 확인 다시 시도'; retry.onclick = () => location.reload();
    retry.style.cssText = 'margin-right:12px;padding:12px 18px;border:1px solid #ccd5e5;border-radius:10px;background:white;font:inherit;cursor:pointer';
    status.after(retry);
  }
})();
