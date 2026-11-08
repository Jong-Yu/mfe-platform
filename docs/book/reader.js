(() => {
  const $ = s => document.querySelector(s);
  const all = s => [...document.querySelectorAll(s)];
  const progressBoxes = all('[data-progress]');
  const key = 'mfe-self-study-progress-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch (_) {}
  progressBoxes.forEach(box => { box.checked = saved[box.dataset.progress] === true; });
  function updateProgress() {
    const count = progressBoxes.filter(x => x.checked).length;
    $('#progress').value = count;
    $('#progress-label').textContent = `학습 경로 ${count} / 6`;
    try { localStorage.setItem(key, JSON.stringify(Object.fromEntries(progressBoxes.map(x => [x.dataset.progress,x.checked])))); } catch (_) {}
  }
  progressBoxes.forEach(x => x.addEventListener('change', updateProgress));
  updateProgress();
  if (matchMedia('(max-width:760px)').matches) $('.toc').open = false;

  function reveal(id) {
    const element = document.getElementById(id);
    if (!element) return;
    let parent = element;
    while (parent) { if (parent.tagName === 'DETAILS') parent.open = true; parent = parent.parentElement; }
    requestAnimationFrame(() => element.scrollIntoView({block:'start'}));
  }
  document.addEventListener('click', event => {
    const a = event.target.closest('a[href^="#"]');
    if (a) {
      const id = decodeURIComponent(a.getAttribute('href').slice(1));
      if (document.getElementById(id)) {
        event.preventDefault();
        history.replaceState(null,'','#'+encodeURIComponent(id));
        reveal(id);
        $('#search-results').hidden = true;
      }
    }
  });
  addEventListener('hashchange', () => reveal(decodeURIComponent(location.hash.slice(1))));
  if (location.hash) reveal(decodeURIComponent(location.hash.slice(1)));

  const searchable = all('[data-title]').map(el => ({id:el.id,title:el.dataset.title,text:el.textContent.replace(/\s+/g,' ').trim()}));
  $('#search').addEventListener('input', () => {
    const q = $('#search').value.trim().toLocaleLowerCase();
    const list = $('#search-results'); list.replaceChildren();
    if (!q) { list.hidden = true; return; }
    const found = searchable.filter(x => (x.title+' '+x.text).toLocaleLowerCase().includes(q));
    const label = document.createElement('p');
    label.textContent = `${found.length}곳에서 찾았습니다. ${found.length > 12 ? '먼저 12곳을 표시합니다.' : ''}`;
    list.append(label);
    found.slice(0,12).forEach(x => {
      const a = document.createElement('a'); a.href = '#'+x.id; a.textContent = x.title;
      const small = document.createElement('small');
      const pos = x.text.toLocaleLowerCase().indexOf(q), start = Math.max(0,pos-30);
      small.textContent = (start ? '…' : '')+x.text.slice(start,start+145)+'…';
      a.append(small); list.append(a);
    });
    list.hidden = false;
  });
  $('#search').addEventListener('keydown', event => { if(event.key==='Escape') $('#search-results').hidden=true; });
  document.addEventListener('click', event => { if(!event.target.closest('.toolbar')) $('#search-results').hidden=true; });
  let expanded = false;
  $('#expand').addEventListener('click', () => {
    expanded = !expanded;
    all('.print-expand').forEach(x => x.open = expanded);
    $('#expand').textContent = expanded ? '상세 자료 모두 접기' : '상세 자료 모두 펼치기';
  });
  let printState = [];
  addEventListener('beforeprint', () => {
    printState = all('details').map(x => [x,x.open]);
    all('details').forEach(x => {
      if(x.classList.contains('print-expand')) x.open = $('#print-appendices').checked;
      else if(!x.classList.contains('toc')) x.open = true;
    });
  });
  addEventListener('afterprint', () => printState.forEach(([el,open]) => el.open=open));
  $('#print').addEventListener('click', () => window.print());
  const navLinks = all('.toc a');
  const observer = new IntersectionObserver(entries => {
    const current = entries.filter(x=>x.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
    if(current) navLinks.forEach(a=>a.classList.toggle('active',a.hash==='#'+current.target.id));
  },{rootMargin:'-85px 0px -65% 0px'});
  all('.chapter').forEach(x=>observer.observe(x));
})();
