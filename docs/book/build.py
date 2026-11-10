#!/usr/bin/env python3
"""Build one offline HTML book from the learning text and the existing references.

Standard library only. Existing frozen examples are read, never rewritten.
Run from any directory: python3 docs/book/build.py
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote, quote
import base64
import hashlib
import html
import json
import mimetypes
import os
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = ROOT / 'docs/mfe-self-study.html'
E = html.escape
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}


class Node:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []
    def walk(self):
        yield self
        for child in self.children:
            if isinstance(child, Node): yield from child.walk()


class Tree(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = Node('document'); self.stack = [self.root]
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs); self.stack[-1].children.append(n)
        if tag not in VOID: self.stack.append(n)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID: self.handle_endtag(tag)
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack = self.stack[:i]; break
    def handle_data(self, data): self.stack[-1].children.append(data)


catalog = json.loads((ROOT/'examples/catalog.json').read_text())
summary = json.loads((ROOT/'examples/verification/summary.json').read_text())
stats = {x['id']: x for x in summary['examples']}
lessons = json.loads((HERE/'lessons.json').read_text())
guidance = json.loads((HERE/'lab-guidance.json').read_text())
study_order = [1, 2, 3, 4, 12, 10, 11, 18, 19, 13, 14, 15, 16, 17, 5, 6, 7, 8, 9, 20]
old_refs = [
    ('ref-intro','입문 설명 상세','mfe-platform-versioning-guide.html'),
    ('ref-development','프로젝트·파일·SDK API 상세','mfe-project-handbook.html'),
    ('ref-operations','운영 명령·오류 복구·검증 상세','mfe-runtime-operations.html'),
    ('ref-database','DB 상세 설계 · 테이블·SQL·API·운영','mfe-registry-db-design.html'),
]
current_chapters = [
    ('vite-overview', 'V1', '현재 프로젝트 전체 구조'),
    ('vite-contracts', 'V2', '소스·공개 모듈·의존 계약'),
    ('vite-loading', 'V3', 'MF가 서비스를 연결하는 과정'),
    ('vite-isolation', 'V4', '공유·격리·오류 복구'),
    ('vite-development', 'V5', '서비스 개발과 단독 실행'),
    ('vite-release', 'V6', '빌드·발행·조합 적용'),
    ('vite-versioning', 'V7', '버전 교체·롤백·운영'),
    ('vite-reading-map', 'V8', '코드 읽기·검증·학습 지도'),
]
documents = {}
for item in catalog:
    n = int(item['id'][:2]); p = ROOT/'examples'/item['id']/'docs/index.html'
    documents[p.resolve()] = f'lab-{n:02}-reference'
for prefix, title, filename in old_refs:
    documents[(ROOT/'docs'/filename).resolve()] = prefix

trees = {}; ids = {}
for path, prefix in documents.items():
    tree = Tree(path.read_text()).root
    main = next((n for n in tree.walk() if n.tag == 'main'), tree)
    trees[path] = main
    ids[path] = {n.attrs['id'] for n in main.walk() if n.attrs.get('id')}


def link(value, source):
    u = urlsplit(value)
    if u.scheme or u.netloc: return value
    target = (source.parent/unquote(u.path)).resolve() if u.path else source
    legacy_recovery = {
        ROOT/'projects/platform-build-tools/runtime/retry.cjs',
        ROOT/'projects/platform-build-tools/lib/retry-loader.cjs',
    }
    if target in legacy_recovery:
        target = ROOT/'examples/15-transitive-retry'/target.relative_to(ROOT)
    if target in documents:
        base = documents[target]
        return '#' + base + ('--'+unquote(u.fragment) if u.fragment in ids[target] else '')
    if target == ROOT/'examples/index.html': return '#labs'
    return quote(os.path.relpath(target, OUT.parent), safe='/') + ('?'+u.query if u.query else '') + ('#'+u.fragment if u.fragment else '')


def render_reference(path):
    path = path.resolve(); prefix = documents[path]
    def render(n):
        if isinstance(n, str):
            # Update an obsolete global status while retaining the frozen original on disk.
            n = n.replace('사용자별 구독도 다음 작업입니다.', '이 예제에는 개인 구독이 포함되지 않습니다. 사용자별 구독은 별도 예제 20에서 구현·검증했습니다.')
            return E(n)
        if n.tag in {'script','style','nav','button','footer','aside'}: return ''
        if set((n.attrs.get('class') or '').split()) & {'doc-path','copy-btn','skip-link','unified-book-link'}: return ''
        tag = {'main':'div','h1':'h3','h2':'h4','h3':'h5'}.get(n.tag,n.tag)
        attrs = {}
        for k in ['id','href','src','alt','title','colspan','rowspan','scope','width','height','viewbox','d','fill','stroke','x','y','rx','cx','cy','r','points']:
            if n.attrs.get(k) is not None: attrs[k] = n.attrs[k]
        if 'id' in attrs: attrs['id'] = prefix+'--'+attrs['id']
        if 'href' in attrs: attrs['href'] = link(attrs['href'],path)
        if tag == 'img' and attrs.get('src'):
            p = (path.parent/unquote(attrs['src'])).resolve()
            if p.exists():
                mime = mimetypes.guess_type(p.name)[0] or 'application/octet-stream'
                attrs['src'] = f'data:{mime};base64,'+base64.b64encode(p.read_bytes()).decode()
                attrs['loading'] = 'lazy'
            else: raise ValueError('Missing image '+str(p))
        body = ''.join(render(c) for c in n.children)
        attr = ''.join(f' {k}="{E(str(v),quote=True)}"' for k,v in attrs.items())
        result = f'<{tag}{attr}>' + ('' if tag in VOID else body+f'</{tag}>')
        if tag == 'table': result = '<div class="table-scroll">'+result+'</div>'
        return result
    return render(trees[path])


def make_labs():
    result = ['<section class="chapter" id="labs" data-title="20개 예제 실습실"><div class="eyebrow">LABORATORY</div><h2>보존 실습: 20개 Webpack 예제</h2><p>각 카드의 시작 명령은 <strong>mfe 최상위 폴더</strong>에서 실행합니다. 이미 다른 예제 폴더에 있다면 최상위로 이동한 뒤 시작하세요. 새로 선택할 명령은 같은 예제 루트의 두 번째 터미널에서 실행합니다. 아래의 “전체 실행 안내·파일·버전 표”를 열면 기존 설명서 내용도 이 문서 안에서 읽을 수 있습니다.</p><p>이 실습은 현재 Vite 코드와 분리해 보존한 Webpack 스냅샷입니다. 개념별 동작을 실험할 때 선택해서 읽으세요. 현재 코드의 실행 방법은 <a href="#vite-development">V5</a>부터 따릅니다. 설명은 교육용으로 분리한 고정 revision 1.0.0에 대응합니다. 실제 과거 저장소의 모든 시점을 그대로 복원한 것은 아닙니다. 특히 관리 예제들은 공통 운영 기반을 자체 사본으로 갖고 각기 다른 질문을 검증합니다.</p></section>']
    result[0] = result[0].replace('각 카드의 시작 명령은', '아래 카드는 번호순이 아니라 앞서 안내한 권장 학습 순서로 배치했습니다. 각 카드의 시작 명령은')
    by_number = {x['n']: x for x in lessons}
    ordered_catalog = sorted(catalog, key=lambda x: study_order.index(int(x['id'][:2])))
    for item in ordered_catalog:
        lesson = by_number[int(item['id'][:2])]
        n = lesson['n']; folder = ROOT/'examples'/item['id']
        config = json.loads((folder/'example.json').read_text())
        recipe = json.loads((folder/'composition.config.json').read_text())
        port = config['port']; checks = stats[item['id']]['checks']
        target = f'http://127.0.0.1:{port}'+('/subscriptions' if n == 20 else '')
        steps = ''.join('<li>'+E(x)+'</li>' for x in lesson['steps'])
        if n == 1:
            launch = '<p>바로 위 <a href="#first-run">첫 실행</a>을 마쳤다면 서버는 그대로 켜두세요. 아래에서 브라우저만 조작합니다. 아직 실행하지 않았다면 첫 실행부터 진행하세요.</p>'
        else:
            launch = f'''<p class="code-label">직접 실행 · 현재 위치: 내려받은 프로젝트의 맨 위 폴더</p>
<pre><code>cd examples/{E(item['id'])}</code></pre><p>이 예제 폴더로 이동합니다. 앞의 예제 폴더 안에서 시작했다면 먼저 프로젝트 맨 위 폴더로 돌아오세요.</p>
<pre><code>npm --prefix integration ci</code></pre><p>설치가 끝나 명령을 입력할 수 있게 되면 다음 줄을 실행하세요.</p>
<pre><code>npm start</code></pre><p>터미널에 서버 주소가 나오면 켜둔 채 <a href="{target}">{target}</a>을 여세요. 이후 선택 명령은 <strong>같은 예제 폴더에서 연 두 번째 터미널</strong>에서 실행합니다.</p>'''
        position = study_order.index(n)
        navigation = []
        if position: navigation.append(f'<a href="#lab-{study_order[position-1]:02}">← 이전 학습: 예제 {study_order[position-1]:02}</a>')
        if n == 1:
            navigation.append('<a href="#lab-02">다음 보존 실습: 예제 02, SDK 런타임 선택 →</a>')
        elif position < len(study_order)-1:
            navigation.append(f'<a href="#lab-{study_order[position+1]:02}">다음 학습: 예제 {study_order[position+1]:02} →</a>')
        test_reports = '<code>verification/report.json</code>'
        if config.get('specialTest'): test_reports += ' + <code>integration/artifacts/verification/'+E(config['specialTest'])+'.json</code>'
        profile_rows = ''.join(f'<tr><td><code>{E(k)}</code></td><td><code>{E(json.dumps(v,ensure_ascii=False))}</code></td></tr>' for k,v in recipe['profiles'].items())
        result.append(f'''<article class="lab" id="lab-{n:02}" data-title="예제 {n:02}. {E(item['title'])}">
<div class="eyebrow">보존 실습 · WEBPACK · EXAMPLE {n:02} · PORT {port}</div><h2>{n:02}. {E(item['title'])}</h2>
<p class="scope">2026-11-08에 보존한 독립 예제입니다. 아래 명령과 파일은 <code>examples/{E(item['id'])}/</code> 기준이며, 현재 Vite 프로젝트의 실행 순서는 <a href="#vite-development">V5 개발</a>와 <a href="#vite-release">V6 배포</a>에서 설명합니다.</p>
<p class="lead">{E(lesson['goal'])}</p><p><strong>먼저 알아둘 것:</strong> {E(lesson['before'])}</p>
{launch}
<h3>따라 하기</h3><ol>{steps}</ol><div class="expected"><strong>확인할 결과</strong><p>{E(lesson['expected'])}</p></div>
<div class="lab-guidance">{guidance.get(str(n),'')}</div>
<p class="small"><strong>자동 검증 결과 위치:</strong> {test_reports}. <code>npm test</code>가 시연 서버와 별도로 실행한 결과입니다.</p>
<p><strong>코드를 읽는 순서:</strong> {E(lesson['read'])}</p>
<details class="answer"><summary>내 말로 설명하기: {E(lesson['question'])}</summary><p>{E(lesson['answer'])}</p></details>
<details class="compact"><summary>이 예제에서 사용할 수 있는 선택 프로필</summary><p>아래 값은 <code>composition.config.json</code>에서 읽은 실제 프로필입니다. <code>npm run select -- 프로필명</code>으로 적용합니다. 값은 기준 설정에 대한 변경분이며 이전 선택에 누적되지 않습니다.</p><div class="table-scroll"><table><tr><th>프로필</th><th>기준과의 차이</th></tr>{profile_rows}</table></div></details>
<p class="evidence">보존된 검증 결과: <strong>{checks}개 검사 통과</strong> · <a href="../examples/{item['id']}/verification/report.json">기본 보고서</a> · <a href="../examples/{item['id']}/verify.mjs">검증 소스</a></p>
<details class="reference print-expand" id="lab-{n:02}-reference"><summary>전체 실행 안내·파일 역할·고정 버전 표·검증 범위</summary><div class="reference-body"><p class="scope">이 영역의 상대 폴더와 버전은 <code>examples/{item['id']}</code>에 해당합니다. 위 시작 명령으로 해당 폴더에 들어간 뒤 읽으세요. 수록 기준: 2026-11-08.</p>{render_reference(folder/'docs/index.html')}</div></details>
</article>''')
        result[-1] = result[-1].replace('</article>', '<nav class="lab-navigation" aria-label="권장 학습 순서">'+' · '.join(navigation)+'</nav></article>')
    # Return the first exercise separately so it follows the frozen setup guide.
    return result[1], '\n'.join([result[0], *result[2:]])


def make_references():
    result = ['<section class="chapter" id="references" data-title="상세 부록·기존 설명서 전체"><div class="eyebrow">REFERENCE LIBRARY</div><h2>보존 부록: 이전 구현 설명과 DB 설계</h2><p>아래 네 문서는 과거 Webpack 구현의 기록과 DB 확장 설계안입니다. 현재 Vite 구현의 상세 설명은 <a href="#vite-overview">V1~V8</a>을 기준으로 읽으세요. 원문의 코드·명령·검증 수치를 현재 Vite 결과로 해석하지 마세요. 원래 문서 사이의 연결은 가능한 한 이 문서 안으로 연결했습니다.</p><div class="callout"><strong>이전 통합 실험의 실행 문맥</strong><p>이 부록의 <code>projects/</code>, <code>integration/</code>, 4173~4178 주소와 과거 검증 수치는 <strong>최상위 통합 프로젝트</strong>에 관한 기록입니다. 독립 예제의 4501~4520 실행 방법·SDK 버전과 섞지 마세요. “현재”는 각 원문의 작성 시점을 가리킵니다. 처음 실행은 위 실습 카드를 따릅니다. DB 부록은 설계안이며, 개인 구독을 DB로 이관하는 세부 구현은 아직 없습니다.</p></div></section>']
    for prefix,title,filename in old_refs:
        result.append(f'<details class="reference archive print-expand" id="{prefix}" data-title="상세: {E(title)}"><summary>{E(title)}</summary><div class="reference-body"><p class="scope">보존 원문 {E(filename)}의 상세 본문입니다. Webpack 시대 통합 프로젝트의 실행 명령·버전·검증 기록이며 DB 문서는 설계안입니다. 현재 코드의 설명은 <a href="#vite-overview">V1~V8</a>에 있습니다. 독립 예제는 앞의 실습 카드에서 시작하세요. Webpack 복구 파일 retry.cjs·retry-loader.cjs의 소스 링크는 고정 예제 15의 보존본으로 연결합니다.</p>{render_reference(ROOT/"docs"/filename)}</div></details>')
    return '\n'.join(result)


glossary = [
('MFE','Micro Frontend. 팀·업무별 프런트엔드 개발·배포 경계를 나누는 구조. 특정 로더 한 가지를 뜻하지 않음.'),
('MF','Module Federation. 별도 빌드의 공개 모듈을 실행할 때 연결하는 기술.'),
('Vite','현재 프로젝트의 JavaScript·TypeScript 변환과 배포 파일 생성을 담당하는 빌드 도구. MF 플러그인과 플랫폼 도구가 연결 규칙을 추가함.'),
('ESM / ES 모듈','브라우저의 import/export 모듈 형식. 현재 Shell과 remoteEntry.js는 이 형식으로 로드함.'),
('remoteEntry.js','Remote가 공개한 모듈을 찾는 진입 파일. 해당 모듈의 실행 청크·스타일 파일도 함께 보존해야 함.'),
('개발 키트','서비스를 혼자 실행할 수 있도록 발행된 SDK·의존 배포물과 그 파일 해시를 고정한 dev/ 자료.'),
('vite-preflight-v1','실행 전에 공개 모듈의 의존 파일을 준비하고 실패한 요청을 다시 시도하기 위한 이 프로젝트의 복구 프로토콜.'),
('플랫폼','SDK·Shell·도구·운영 기능을 제공하는 범위. 단일 MF 모듈 이름이 아님.'),
('Shell','제품의 공통 진입·레이아웃·화면 조합을 맡는 앱이라는 관례적 역할 이름.'),
('Host / Consumer','특정 연결에서 다른 모듈을 가져와 사용하는 쪽.'),
('Remote / Provider','코드를 공개하는 쪽. React Provider와는 다른 문맥의 제공자.'),
('SDK','이 프로젝트에서는 공통 Context·UI 경계·로딩 기능을 MF로 제공하는 코드.'),
('MF container','공개 모듈에 get/init으로 접근하는 원격 실행 단위. PageContainer·Docker와 다름.'),
('PageContainer','SDK가 제공하는 콘텐츠 제목·여백 컴포넌트. 실행 컨테이너가 아님.'),
('React Provider / Context','React 하위 트리에 공통 값을 전달하고 읽는 수단. 같은 Context 객체가 필요.'),
('Manifest / 매니페스트','파일 위치·버전·의존성 등을 설명하는 정보. release, composition, dev manifest는 서로 다른 자체 형식.'),
('Registry / 등록부','발행 목록·조합·상태를 관리하는 저장소와 API. 현재는 로컬 JSON.'),
('Artifact / 배포물','빌드한 파일과 메타데이터의 정확한 단위. 의미 버전만으로 식별하지 않음.'),
('Binding / 바인딩','소비자 배포 ID의 별칭에 어떤 대상 배포 ID를 연결할지 정한 것.'),
('Composition / 조합','공통 SDK·Shell·루트·전체 의존 연결·메뉴·위젯 선택을 고정한 실행 스냅샷.'),
('전이 의존성','A가 B를, B가 D를 사용할 때 A에서 간접적으로 필요한 D 같은 의존성.'),
('불변 / Immutable','발행한 내용을 같은 ID 아래에서 덮어쓰지 않는 규칙. 바꾸려면 새 ID와 조합 생성.'),
('Contract / 계약','공개 모듈 이름·입력·출력·기대 동작의 약속. 버전 범위만으로 의미까지 자동 증명하지 못함.'),
('Instance / 인스턴스','같은 코드의 개별 화면 복제본. 배포 ID와 구분되는 실행 상태의 단위.'),
('Lease / 탭 사용 기한','서버가 발급·갱신하는 특정 탭의 한시적 사용 약속. 지속되는 개인 구독과 다름.'),
('지원 종료 / 등록 해제 / 파일 삭제','새 선택 정책 / 등록 상태 변경 / 실제 저장 파일 제거라는 서로 다른 단계.'),
('Tombstone / 종료 기록','정리한 대상이 늦은 요청으로 부활하지 않도록 남기는 상태·이력.'),
('Revision','동시 수정 충돌을 감지하는 변경 번호. 서비스 릴리스 버전이 아님.'),
('Outbox','DB 변경과 함께 외부 작업 목록을 저장하고 작업자가 재시도 가능하게 실행하는 설계.'),
]


def glossary_html():
    rows=''.join(f'<tr><th scope="row">{E(k)}</th><td>{E(v)}</td></tr>' for k,v in glossary)
    return '<section class="chapter" id="glossary" data-title="용어 사전"><div class="eyebrow">GLOSSARY</div><h2>같은 단어를 같은 뜻으로 읽기</h2><p>MF·React 용어와 이 프로젝트의 운영 모델을 구분했습니다. Shell·플랫폼은 역할을 부르는 말이고, 이 책의 조합·구독 정책 전체가 MF 표준은 아닙니다.</p><div class="table-scroll"><table>'+rows+'</table></div></section>'


def evidence_html():
    rows=''.join(f'<tr><td><a href="#lab-{int(x["id"][:2]):02}">{E(x["id"])}</a></td><td>{x["checks"]}</td><td>통과</td></tr>' for x in summary['examples'])
    return f'''<section class="chapter" id="evidence" data-title="검증 근거와 범위"><div class="eyebrow">EVIDENCE</div><h2>검증 시점과 구현 범위를 구분하기</h2><div class="callout"><strong>문서 개정과 제품 재검증은 별도입니다.</strong><p>2026-11-10에는 현재 Vite 실습을 서로 다른 빈 npm 캐시 3개와 새 복사본에서 시작해 첫 설치·개발·B 배포·SDK/D 교체·롤백 관련 45개 검사를 통과했습니다. <a href="#vite-cold-install-evidence">V8의 빈 캐시 따라 하기 결과</a>에 실제 다운로드·환경·범위·근거를 기록했습니다. 이후 필수 파일을 모두 포함한 로컬 검증 커밋을 다시 clone한 사본에서도 <a href="#vite-clone-evidence">45개 검사</a>를 통과했습니다. 전환 준비 당시 GitHub clone은 이전 Webpack 커밋이었으며, 이 기록의 대상과 현재 받은 커밋은 설치 전 준비 검사로 구분합니다. 앞서 준비된 캐시로 실행한 <a href="#vite-walkthrough-evidence">43개 검사</a>도 별도 기록으로 보존합니다. 제품 전체 기능 검사를 다시 실행한 것은 아닙니다. 현재 Vite 검사 명령과 보고서 위치는 <a href="#vite-reading-map">V8</a>, 이번 문서의 화면·검색·오프라인 검사는 <a href="verification/self-study/report.json">문서 검증 보고서</a>에서 확인하세요. 아래 205개 수치는 보존된 Webpack 예제의 과거 결과입니다.</p></div><p>2026-11-08까지 보존된 독립 예제의 기능 검사는 총 <strong>{summary['featureChecks']}개</strong>입니다. 아래 <a href="#reader-review">학습서 따라 하기 점검</a>에서 20개 예제의 문서 순서 실습과 205개 기능 검사 전체를 별도 복사본에서 다시 확인했습니다. 설명서 자체의 링크·상호작용·화면 검사는 별도 결과로 구분합니다.</p><div class="table-scroll"><table><tr><th>예제</th><th>검사 수</th><th>보존된 결과</th></tr>{rows}</table></div><p>05~10번의 숫자에는 기본 report와 별도 관리·수명·개발 검사를 합산했습니다. report.json 하나의 검사 수와 다를 수 있습니다. <a href="../examples/verification/summary.json">전체 집계 원본</a>과 <a href="../examples/verification/index.html">검증 상세</a>에서 확인할 수 있습니다.</p><ul><li>실제 브라우저·HTTP·MF 요청과 상태·스타일·Context·실패·복구를 검사했습니다.</li><li>20개 예제는 폴더 이동 후 독립 실행 검증을 보존합니다. 02·15·19·20은 전체 소스 재빌드 결과와 고정 파일 일치도 확인했습니다.</li><li>205개 결과는 예제별 시나리오 검사입니다. 모든 조합·임의의 서비스 코드에 대한 일반 증명이 아닙니다.</li><li>삭제 시험은 임시 저장소에서 실제 파일을 지웁니다. 기간은 과거 메타데이터 등으로 재현했으며 실제 30일 경과 시험이 아닙니다.</li><li>운영 SSO·권한·다중 서버·DB·S3·실제 공지 발송은 현재 기능 검증 범위 밖입니다.</li></ul><p><a href="#architecture">설계 결정 정리로 돌아가기</a></p></section>'''


def reader_review_html():
    proof=json.loads((ROOT/'docs/verification/walkthrough/report.json').read_text())
    assert proof['status']=='passed' and len(proof['examples'])==20 and proof['featureChecks']==205
    findings=json.loads((HERE/'walkthrough-findings.json').read_text())
    rows=''.join(f'<tr><th scope="row">{E(x["area"])}</th><td>{E(x["finding"])}</td><td>{E(x["change"])}</td></tr>' for x in findings)
    results=''.join(f'<tr><td><a href="#lab-{x["number"]:02}">{x["number"]:02} · {E(x["document"]["title"])}</a></td><td>통과</td><td>{x["featureChecks"]}</td><td><a href="verification/walkthrough/{x["id"]}/verification/report.json">기본 결과</a></td></tr>' for x in proof['examples'])
    return f'''<section class="chapter" id="reader-review" data-title="학습서 따라 하기 점검·보완 내역"><div class="eyebrow">READER WALKTHROUGH · 2026-11-08</div><h2>보존된 Webpack 실습의 따라 하기 기록</h2><p class="scope">2026-11-08의 실행 기록을 보존합니다. 이번 Vite 학습서 개정에서 다시 실행한 결과가 아닙니다.</p><p><strong>20개 독립 예제 실습 완료 · 기능 검사 205/205 통과.</strong> 각 폴더를 작업 공간 밖으로 복사하고, 원래 node_modules·실행 저장소·과거 보고서를 가져오지 않은 상태에서 설치·실행했습니다. 문서의 주소와 선택 명령, 관리 화면과 개발 소스 변경을 따라가고 마지막에 각 예제의 npm test를 실행했습니다.</p><p>기본 설치에는 준비된 npm 캐시를 사용했습니다. 캐시 의존성이 드러난 <strong>10번은 빈 캐시를 새로 만들어 온라인 설치·전체 setup·오프라인 개발 검사까지 다시 수행</strong>했습니다. 실제 실행 환경은 macOS·Node 24·Chrome입니다. 다른 운영체제에서 실행했다고 주장하는 결과는 아닙니다.</p><p>이 점검은 개발자 관점으로 문서 절차를 실행한 결과이며 실제 신규 입사자의 독립 사용성 조사와는 다릅니다. 확인한 누락은 아래와 같이 보완했습니다. 서비스 코드의 결함으로 판단해 예제 기능을 바꾼 항목은 없습니다.</p><div class="table-scroll"><table><tr><th>위치</th><th>발견한 설명 문제</th><th>반영한 내용</th></tr>{rows}</table></div><details class="compact"><summary>권장 순서대로 수행한 예제와 결과</summary><div class="table-scroll"><table><tr><th>학습 예제</th><th>실습</th><th>기능 검사 수</th><th>실행 기록</th></tr>{results}</table></div></details><p><a href="verification/walkthrough/report.json">실행 명령·단계·결과 전체</a> · <a href="verification/walkthrough/first-pass.json">첫 점검 기록</a> · <a href="verification/self-study/report.json">문서 화면·검색·오프라인 검사</a></p><p>첫 점검에서 05번은 롤백 재검사를 생략해 막혔고, 19번은 빈 화면에서 A가 나타날 것으로 기대한 검사 가정이 틀렸습니다. 해당 단계를 바로잡고 다시 통과했습니다. 원본 예제의 소스·설정·초기 배포물은 보존했습니다.</p></section>'''


foundation_toc = [('start','0','처음 읽는 순서'),('basics','1','React·빌드 복습'),('roles','2','서비스와 Shell'),('loading','3','MF의 기본 개념')]
concept_toc = [('versions','4','버전과 계약'),('isolation','5','중첩과 충돌 방지'),('development','6','서비스 개발 개념'),('widgets','7','메뉴와 위젯'),('recovery','8','오류 격리·재시도'),('operations','9','배포와 삭제 보호'),('subscriptions','10','개인 구독: 예제 20'),('database','11','DB·S3 설계안'),('architecture','12','아키텍처로 정리')]
archive_toc = [('first-run','실행','Webpack 예제 첫 실행'),('lab-01','01','버튼 두 개 비교하기'),('labs','20개','보존된 독립 예제'),('glossary','A','용어 사전'),('evidence','B','검증 근거'),('reader-review','점검','과거 실습 실행 기록'),('references','C','이전 상세 문서·설계안')]
def toc_group(label, items):
    return '<p class="toc-group">'+E(label)+'</p>'+''.join(f'<a href="#{key}"><span>{num}</span>{title}</a>' for key,num,title in items)
toc = toc_group('먼저 이해하기', foundation_toc) + toc_group('현재 Vite 구현 · 상세', current_chapters) + toc_group('주제별 개념·설계', concept_toc) + toc_group('보존 실습·참고 자료', archive_toc)
chapters=(HERE/'chapters.html').read_text()
current_source_files = [HERE/'vite-runtime.html', HERE/'vite-workflow.html']
current_body = '\n'.join(p.read_text() for p in current_source_files)
first_lab, later_labs = make_labs()
assert chapters.count('<!-- FIRST_LAB -->') == 1
assert chapters.count('<!-- CURRENT_VITE -->') == 1
# The current implementation and concepts come before optional frozen exercises.
practice_start = chapters.index('<section class="chapter" id="first-run"')
practice_end = chapters.index('<!-- FIRST_LAB -->') + len('<!-- FIRST_LAB -->')
practice = chapters[practice_start:practice_end].replace('<!-- FIRST_LAB -->', first_lab)
chapters = chapters[:practice_start] + chapters[practice_end:]
body=chapters.replace('<!-- CURRENT_VITE -->',current_body)+practice+later_labs+glossary_html()+evidence_html()+reader_review_html()+make_references()
style=(HERE/'style.css').read_text()
script=(HERE/'reader.js').read_text()
page=f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>MF 플랫폼 통합 학습서 · 현재 Vite 구현과 개발·배포·버전 관리</title><style>{style}</style></head><body>
<a class="skip" href="#main">본문으로 이동</a><aside class="sidebar"><div class="book-brand"><span>FIELD GUIDE / 2026</span><strong>MF 플랫폼<br>통합 학습서</strong><p>Vite · 서비스 연결 · 개발 · 운영</p></div><details class="toc" open><summary>목차 펼치기 / 접기</summary><nav aria-label="학습 목차">{toc}</nav></details><div class="progress"><span id="progress-label">학습 경로 0 / 6</span><progress id="progress" max="6" value="0" aria-label="학습 경로 진행"></progress></div></aside>
<main id="main"><header class="toolbar"><label for="search">문서에서 찾기</label><input id="search" type="search" placeholder="예: 기존 탭, Provider, 삭제" autocomplete="off"><button id="print" type="button">인쇄 / PDF 저장</button><div id="search-results" aria-live="polite" hidden></div></header>
<header class="cover" id="cover"><div class="eyebrow">VITE + MODULE FEDERATION / CURRENT IMPLEMENTATION</div><h1>따로 개발하고 배포한 서비스를<br>하나의 화면으로 연결하기.</h1><p class="subtitle">현재 코드로 읽는 MF 플랫폼 통합 학습서</p><p>Shell·SDK·서비스의 전체 구조부터 한 줄의 import가 실행되는 과정, 단독 개발과 발행, 버전 교체와 롤백까지 차례대로 설명합니다.</p><div class="cover-meta"><span>Vite 8.3.6</span><span>MF 플러그인 1.23.11</span><span>플랫폼 빌드 도구 2.0.0</span></div><a class="primary" href="#vite-overview">현재 프로젝트 전체 구조부터 읽기 <span aria-hidden="true">→</span></a><p><a href="#start">읽는 순서와 문서 범위</a> · <a href="#basics">React·빌드부터 복습하기</a></p><p class="small">현재 구현 설명 개정 2026-11-10 · Webpack 독립 예제는 2026-11-08 보존본 · 인터넷 없이 읽는 단일 HTML</p></header>
<div class="reader-options"><label><input id="print-appendices" type="checkbox"> 인쇄할 때 예제 상세·원문 부록도 포함</label><button id="expand" type="button">상세 자료 모두 펼치기</button></div>
{body}<footer><p>이 문서는 학습과 설계 검토를 위한 자료입니다. 실제 소스·고정 배포물·검증 범위를 기준으로 읽으세요.</p><a href="#cover">처음으로 ↑</a></footer></main><script>{script}</script></body></html>'''
OUT.write_text(page)
# Keep both the editorial inputs and the code linked by the current chapters auditable.
implementation_sources = set()
for node in Tree(current_body).root.walk():
    href = node.attrs.get('href', '')
    u = urlsplit(href)
    if u.scheme or u.netloc or not u.path: continue
    target = (OUT.parent/unquote(u.path)).resolve()
    if target.is_file() and target.is_relative_to(ROOT): implementation_sources.add(target)
editorial_sources = [HERE/'chapters.html', *current_source_files, HERE/'build.py', HERE/'style.css', HERE/'reader.js', HERE/'lessons.json', HERE/'lab-guidance.json']
build_package = json.loads((ROOT/'projects/platform-build-tools/package.json').read_text())
manifest = {'output':str(OUT.relative_to(ROOT)), 'date':'2026-11-10', 'frozenExamplesDate':'2026-11-08', 'examples':len(catalog), 'currentChapters':len(current_chapters), 'referenceDocuments':len(old_refs), 'embeddedImages':page.count('data:image/'), 'currentImplementation':{'buildTools':build_package['version'], 'vite':build_package['dependencies']['vite'], 'federationPlugin':build_package['dependencies']['@module-federation/vite']}, 'editorialSources':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in editorial_sources}, 'implementationSources':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(implementation_sources)}, 'sourceDocuments':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in documents}}
(HERE/'sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'output':str(OUT),'bytes':OUT.stat().st_size,'examples':len(catalog),'references':len(old_refs)},ensure_ascii=False))
