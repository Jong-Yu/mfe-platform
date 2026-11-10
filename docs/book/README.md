# 통합 학습서 관리

사용자에게 전달하는 결과는 `../mfe-self-study.html` 한 파일입니다. 이 폴더는 갱신을 위한 편집 원본과 문서 검증 도구입니다.

- `chapters.html`: 기초 설명·학습 경로·주제별 개념·설계 정리. 현재 구현과 보존된 예제의 범위를 구분합니다.
- `vite-runtime.html`: 현재 Vite 구현 V1~V4. 전체 구조, 공개·의존 계약, 실제 로딩 순서, 공유·격리·복구를 현재 소스와 연결합니다.
- `vite-workflow.html`: 현재 Vite 구현 V5~V8. 단독 개발, 빌드·발행·활성화, 버전·운영 관리, 코드·검증 지도를 설명합니다.
- 입문 흐름은 React·빌드 복습 → 서비스와 Shell → MF → 현재 Vite 상세 V1~V8 → 주제별 개념입니다. `<!-- CURRENT_VITE -->`에 현재 상세를 삽입합니다. 첫 실행과 `<!-- FIRST_LAB -->`의 예제 01은 보존된 Webpack 실습으로, 생성할 때 개념 본문 뒤로 이동합니다. 낯선 용어는 필요한 상황 옆에서 풀어 씁니다.
- `lessons.json`: 20개 예제의 목표·실습·기대 결과·질문·해설.
- `lab-guidance.json`: 직접 따라 하며 보완한 버튼·입력값·복사 경로·코드 변경·검증 준비 안내.
- `build.py`: 기존 20개 설명서와 4개 상세 문서의 본문을 합치고 ID·링크·그림을 정리합니다. 그림은 HTML 안에 포함합니다. 고정 예제는 수정하지 않습니다.
- `style.css`, `reader.js`: 반응형 읽기·검색·진행 표시·인쇄.
- `sources.json`: 수록 문서·편집 원본·현재 상세에서 링크한 구현 파일의 경로와 SHA-256, 현재 빌드 도구·Vite·MF 플러그인의 버전.
- `verify.mjs`: 오프라인 단일 파일·목차·검색·상세 열기·모바일·인쇄·링크 검사. 결과는 `../verification/self-study/`.
- `walkthrough.mjs`: 학습서의 권장 순서로 독립 복사본을 설치·실행하고 화면 조작·개발·발행·각 예제의 전체 검증을 수행합니다. 결과는 `../verification/walkthrough/`. 인자로 예제 번호를 주면 해당 예제만 재확인합니다. 기본은 준비된 npm 캐시이며 `READER_ONLINE=1 NPM_CACHE=빈_캐시_경로`는 온라인 설치를 사용합니다.
- `walkthrough-findings.json`: 발견한 설명 문제·보완 내용·확인 근거.
- `vite-dev-walkthrough.mjs`: 현재 B의 단독 복사본에서 V5 설치·개발·상태·문법 오류 복구·원문 복원을 실행합니다.
- `vite-release-walkthrough.mjs`: 빈 저장소의 V6 설치·빌드, B 패치 발행·바인딩·탭 비교, CLI·관리 UI 적용과 롤백을 실행합니다.
- `vite-version-walkthrough.mjs`: 격리한 현재 Vite 프로젝트에서 SDK·D 단독 교체 검사를 실행합니다.
- `summarize-vite-walkthrough.py`: 성공한 세 결과와 보완 내역을 집계합니다. 기본은 `../verification/vite-walkthrough/report.json`, `--cold`는 `../verification/vite-cold-install/report.json`입니다. 제품 검사를 재실행하지 않습니다.

프로젝트 최상위에서 `python3 docs/book/build.py`로 재생성합니다. Python 표준 라이브러리만 필요합니다.

Node로 준비 검사나 브라우저 검증을 실행할 때는 **Node가 설치되어 있는지뿐 아니라 현재 터미널이 어느 Node를 선택했는지** 확인합니다. 프로젝트의 [`.nvmrc`](../../.nvmrc)는 `24`이지만 자동 전환을 보장하지 않습니다. clone한 폴더로 이동한 뒤 `node -v`와 `npm -v`를 실행하고, Node가 22.12 이상이며 npm도 오류 없이 동작할 때 진행합니다. 실제 clone의 첫 실행에서는 원래 작업 터미널과 달리 새 터미널이 Node 16.14.0을 선택해 Playwright·Vite가 실패했습니다.

<details>
<summary>nvm을 이미 사용하는 경우</summary>

clone한 프로젝트 최상위에서 실행합니다.

```sh
nvm install
nvm use
node -v
npm -v
```

`nvm install`은 `.nvmrc`가 지정한 버전이 없으면 설치하고, `nvm use`는 현재 터미널에서 그 버전을 선택합니다. 실제 재실행에서는 기존에 설치된 Node 24를 선택했으며, 새 Node 설치 과정 자체를 검증한 것은 아닙니다.

</details>

nvm을 쓰지 않는 경우에는 사용 중인 Node 관리 도구나 설치 방식으로 호환 버전을 선택합니다. 환경 경로를 바꿨다면 터미널을 다시 열고 프로젝트 폴더로 이동해 버전을 확인하세요. nvm 설치는 필수 조건이 아닙니다. **새 터미널·자동 실행 셸·V6의 두 번째 터미널마다** 선택이 다를 수 있으므로 Node/npm을 다시 확인합니다. 정상 버전을 확인한 다음 설치 전 검사인 `node integration/tools/check-clone.cjs --git`을 실행하고, 통과한 뒤 npm 설치와 검증을 시작합니다.

브라우저 확인은 설치된 `examples/20-user-subscriptions/integration/node_modules/playwright`와 Chrome을 사용하여 `node docs/book/verify.mjs`로 실행합니다. `CHROME_EXECUTABLE_PATH`로 Chrome 경로를 바꿀 수 있습니다.

초기 문서 QA는 화면과 링크만 확인했습니다. 이후 학습서 따라 하기에서 20개 예제의 기능 검사 205개를 실제로 재실행했습니다. 두 기록의 범위를 구분해 보존합니다. 이후 글만 고쳤다고 다시 실행한 것으로 표시하지 않습니다.

2026-11-10의 첫 Vite 개정은 소스 대조와 문서 QA였습니다. 이어 준비된 캐시를 사용한 실제 실습 43개를 통과했고, 다시 **서로 다른 빈 캐시 3개에서 첫 설치부터 시작해 45/45**를 확인했습니다. 개발 10개, 같은 복사본의 첫 설치·개발·B 발행·교체·롤백 13개, SDK/D 교체 22개입니다. 새 결과와 스크린샷·다운로드 로그는 `../verification/vite-cold-install/`, 앞선 기록은 `../verification/vite-walkthrough/`에 있습니다. 제품 전체 기능 검사나 Webpack 예제 205개를 다시 실행했다는 의미가 아닙니다. 예제 스냅샷과 기존 상세 HTML 원문은 보존합니다.

빈 캐시 검증을 재현하려면 현재 전체 소스(`vendor/` 도구 패키지와 `dev/` 의존 배포물 포함), Node/npm, 인터넷, 설치된 Chrome이 필요합니다. 이번 환경은 macOS·Node 24.22.1·Chrome 157.0.8103.39입니다. 자동화 도구만 사용하는 개발 검사는 루트 `integration/node_modules/playwright`가 필요하므로 없으면 `npm --prefix integration ci`로 준비합니다. 이 관찰 도구의 설치와 실습 복사본의 빈 캐시는 별개입니다. 배포·버전 검사는 각 새 복사본에 Playwright까지 설치합니다. 수동 실습에는 Playwright가 필요하지 않습니다.

```sh
MFE_WALKTHROUGH_COLD=1 node docs/book/vite-dev-walkthrough.mjs
MFE_RELEASE_COLD=1 node docs/book/vite-release-walkthrough.mjs
MFE_VERSIONS_COLD=1 node docs/book/vite-version-walkthrough.mjs
python3 docs/book/summarize-vite-walkthrough.py --cold
```

각 명령은 기존 캐시를 지우지 않고 별도의 임시 빈 캐시를 만듭니다. 비어 있다는 목록, 공식 npm 저장소의 실제 다운로드, 설치 버전, UI·파일 보존 결과를 기록합니다. 빈 사용자·전역 npm 설정으로 설치하고 상속받은 npm 설정과 `NODE_ENV`를 제거합니다. SDK/D 교체 검사의 후속 오프라인 설치는 해당 실행의 첫 설치가 채운 캐시만 재사용합니다. 기존 Node·Chrome을 사용했으며, Node 설치·새 Git clone·다른 운영체제를 검증한 결과는 아닙니다. Chrome 경로는 `CHROME_EXECUTABLE_PATH`로 지정합니다. 임시 캐시·배포/버전 복사본의 경로는 각 보고서에 남습니다.

준비된 캐시로 빠르게 재실행할 때는 세 `*_COLD` 변수를 생략합니다. 기본 `/private/tmp/mfe-npm-cache`를 사용하고 `NPM_CACHE`로 변경할 수 있습니다. 이 결과는 기존 `vite-walkthrough/`에 저장하며 집계도 `--cold` 없이 실행합니다. 캐시를 온라인으로 채우는 별도 방식은 개발 `MFE_WALKTHROUGH_INSTALL_MODE=online`, 배포 `READER_ONLINE=1`, SDK/D `MFE_VERSIONS_ONLINE=1`입니다. 온라인 허용만으로 빈 캐시였다는 뜻은 아니므로 첫 설치 증명에는 위의 `*_COLD=1`을 사용하세요.

실제 Git clone 결과는 `../verification/vite-clone/`에 별도로 보존합니다. GitHub의 `e4498f6d02a87999940f4cec08a18979b05e38d0`는 이전 Webpack 사본이어서 Vite 실습을 시작할 수 없었습니다. 로컬 검증 커밋 `319fa9a1a3ffa683beb15eade95be3893455b44f`를 `git clone --no-hardlinks`로 다시 받은 깨끗한 사본은 파일 덧씌움 없이 준비 검사를 통과했고, 그 clone의 입력을 복사한 실습에서 새 빈 캐시 3개로 45/45를 확인했습니다. GitHub에 같은 내용이 반영됐다는 의미는 아닙니다. 첫 Node 16 선택 실패는 `first-attempt/failure.json`, Node 24 선택 후 최종 결과는 각 하위 보고서에 구분합니다.

세 Vite 실습 스크립트는 모두 `MFE_WALKTHROUGH_ROOT`에 **검증할 clone의 절대 경로**를 지정할 수 있습니다. 입력 clone을 직접 수정하지 않고 실습용 사본을 만듭니다. `MFE_WALKTHROUGH_OUTPUT`에는 **해당 검사 결과를 저장할 절대 경로**를 지정합니다. 개발·배포·버전 교체에 각각 다른 `development/`, `release/`, `versions/` 출력 폴더를 사용해 보고서가 섞이지 않게 합니다. 두 변수를 생략하면 기존 기본 입력·출력 동작이 유지되며, 빈 캐시 선택은 앞의 `MFE_WALKTHROUGH_COLD`, `MFE_RELEASE_COLD`, `MFE_VERSIONS_COLD`로 각각 지정합니다. 개발 스크립트의 관찰용 Playwright는 스크립트가 있는 작업 폴더의 설치를 사용하고, 배포·버전 교체는 실습 사본에 새로 설치합니다.

clone 출처·커밋·준비 검사와 세 실행 보고서가 준비된 뒤에는 프로젝트 최상위에서 다음 명령으로 집계합니다.

```sh
python3 docs/book/summarize-vite-walkthrough.py --clone
```

`--clone`은 `../verification/vite-clone/report.json`을 갱신합니다. Git clone이나 설치·브라우저 검사를 대신 실행하지 않습니다. 준비 검사 도구의 별도 회귀 결과 11개는 실습 45개에 합산하지 않습니다. 최종 실행 환경은 macOS·Node 24.22.1·npm 11.19.1·Chrome 157.0.8103.39였으며 Node·Chrome 설치 자체와 다른 운영체제는 검증 범위 밖입니다.
