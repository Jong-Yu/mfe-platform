# mfe-platform — MF 플랫폼 학습과 실행 예제

React와 Vite Federation으로 플랫폼 SDK·Shell·서비스를 구성하고, 런타임 버전 선택·오류 격리·버전 운영을 실험하는 저장소입니다. 통합 학습서와 20개 독립 예제를 포함합니다.

## 현재 빌드 방식 — Vite Federation

루트의 `projects/`는 빌드 도구 2.0.0부터 **Vite 8.3.6 + `@module-federation/vite` 1.23.11**을 사용합니다. Remote의 `remoteEntry.js`와 Shell은 브라우저의 네이티브 ES 모듈로 로드합니다. 서비스의 `mf.config.cjs`, `mf.dependencies.json`, `b/Widget` 같은 import, 배포별 버전 선택·공통 React/SDK·독립 상태·메뉴·대시보드 계약을 유지합니다. 현재 설정과 배포 정보는 [빌드 도구 안내](projects/platform-build-tools/README.md)를 기준으로 읽으세요.

JSX가 있는 소스는 `.jsx` 또는 `.tsx` 확장자를 사용합니다. JavaScript·TypeScript 변환은 Vite가 담당하며 TypeScript 타입 검사는 별도로 실행합니다. 현재 `mfe-dev`는 Vite 빌드와 파일 감시 후 전체 새로고침을 사용하므로 저장 시 입력 상태가 초기화됩니다. 상태를 보존하는 HMR·React Fast Refresh는 제공하지 않습니다.

`examples/01-*`부터 `20-*`는 당시 소스·Webpack 빌드 도구·배포물·체크섬을 함께 고정한 학습용 스냅샷으로 보존합니다. 각 예제의 자체 빌드 방식은 그대로이며, 예제와 과거 HTML 설명서의 Webpack 내부 구현 설명·검증 기록은 현재 Vite 빌드의 검증 결과를 뜻하지 않습니다.

현재 프로젝트는 Node.js **22.12 이상**, 24를 권장합니다. 빌드 도구 소스를 수정한 뒤에는 `integration`에서 다음 명령으로 새 도구를 패키징하고 각 서비스의 자체 의존성과 잠금 파일을 갱신합니다. 예제 스냅샷은 변경하지 않습니다.

```sh
cd integration
npm run update:build-tools -- --install
```

일반 `npm run build`는 기존 SDK·업무 버전 선택을 유지하며, 저장소가 비어 있으면 기본 조합도 생성합니다. 전체 컴파일러를 전환하거나 개발용 의존 배포물까지 다시 만들 때는 `npm run bootstrap`으로 모든 새 배포물을 빌드·선택합니다. 기존에 발행한 파일을 덮어쓰지 않으며, 열린 탭은 처음 선택한 조합을 유지합니다.

현재 Vite의 SDK 단독 교체는 `npm run test:sdk`, 중첩 장애 격리·수동/자동 재시도는 `npm run test:nested`로 검증합니다. `test:region-sdk`는 이전 Webpack SDK 1.3.0 조합을 다루는 고정 예제 `examples/17-sdk-retry-upgrade`의 검증으로 위임하며 기본 `npm test`에서는 제외했습니다. 처음 실행할 때는 해당 예제에서 `npm run setup`으로 의존성을 설치합니다. 기존 `demo:region-sdk`는 보존된 과거 조합의 시연입니다. Webpack Host에서 네이티브 ESM 배포물로 처음 넘어갈 때는 Host도 함께 전환해야 합니다.

2026-11-09 Vite 전환 검증 **217/217 통과**. 독립 빌드의 경로별 산출물 일치·소스/CSS 경계, 단독 개발, 버전 공존, SDK/B/D 단독 교체·롤백, 중첩 장애와 500ms 자동 재시도, 메뉴·대시보드·관리 UI, 탭 수명·구형 탭 전환을 확인했습니다. 검증 결과는 `integration/artifacts/verification/`에 기록합니다. 고정 예제 20개의 재검증 결과를 포함하는 수치는 아닙니다.

## 내려받고 시작하기

```sh
git clone https://github.com/Jong-Yu/mfe-platform.git
cd mfe-platform
git rev-parse HEAD
node -v
npm -v
```

설치 전 검사는 별도 npm 라이브러리 없이 Node·Git·tar로 실행합니다. 현재 Vite 빌드 도구·잠금 파일·동봉 패키지·개발 키트의 파일과 해시, 개정 학습서, Git 커밋에 필요한 파일이 모두 포함되었는지 확인합니다. 검사 파일 자체가 없거나 Webpack 1.7.0 사본이라는 오류가 나오면 Vite 전환이 반영된 브랜치/커밋인지 먼저 확인하세요. `npm ci`가 성공해도 현재 Vite 실습용 사본이라는 뜻은 아닙니다.

Node.js 22.12 이상과 Git이 필요합니다. **Node 24가 설치되어 있어도 새 터미널에서 이전 버전이 선택될 수 있습니다.** `.nvmrc`는 권장 버전 24를 기록한 파일이며 자동 전환을 보장하지 않습니다. nvm을 사용한다면 clone 폴더에서 `nvm install`, `nvm use`로 준비하고, 같은 터미널에서 `node -v`와 `npm -v`를 확인한 뒤 위 검사를 실행하세요. 다른 버전 관리 도구를 사용하면 그 도구로 버전을 선택합니다. 첫 clone 검사에서 Node 16이 선택된 사례와 해결 과정은 학습서 V5·V8에 기록했습니다.

호환 버전이 선택되면 다음 검사를 실행하고, 통과한 뒤 학습서 V5의 설치부터 시작합니다.

```sh
node integration/tools/check-clone.cjs --git
```

`docs/mfe-self-study.html`을 브라우저에서 여세요. GitHub의 파일 화면에서는 HTML 소스가 보이므로, 내려받은 파일을 직접 열어 읽습니다. 문서를 읽는 데 서버나 라이브러리 설치는 필요하지 않습니다.

실습에는 Node.js 24와 npm이 필요합니다. 아래 고정 예제는 보존된 Webpack 스냅샷입니다. 첫 예제는 다음과 같이 실행합니다.

```sh
cd examples/01-coexistence
npm --prefix integration ci
npm start
```

브라우저에서 <http://127.0.0.1:4501>을 엽니다. 다른 예제의 실행 순서는 통합 학습서를 따르세요. 각 예제는 독립된 소스·설정·잠금 파일을 가지고 있으며, 루트에서 한꺼번에 설치하는 npm workspace 구조는 아닙니다.

예제의 `seed-store/`와 잠금 목록에 기록된 `projects/*/dist/`는 같은 배포 버전을 재현하기 위해 의도적으로 포함한 파일입니다. 설치 라이브러리(`node_modules/`), 실행 중 생성되는 `artifact-store/`와 임시 데이터는 제외합니다. 고정 예제의 일치 여부는 예제 루트에서 `npm run pins`로 확인할 수 있습니다.

## 혼자 공부할 때 — 통합 학습서 하나로 시작

**[MF 플랫폼 통합 학습서](docs/mfe-self-study.html)**를 브라우저에서 여세요. **현재 Vite 구현 상세 8장(V1~V8)**에서 전체 구조, 공개 모듈과 의존 계약, 실제 MF 로딩 순서, 공유·격리·복구, 단독 개발, 빌드·발행·조합 적용, 버전 교체·롤백과 코드 읽는 순서를 설명합니다. 기초·주제별 개념 12장, 용어 사전, 보존된 20개 Webpack 예제와 이전 설명서도 같은 HTML에 들어 있습니다. 인터넷 없이 읽을 수 있고 문서 검색·목차 이동·인쇄를 지원합니다. 코드 링크와 실습에는 저장소의 다른 파일이 필요합니다.

현재 프로젝트를 이해하려면 **읽는 순서 → 필요하면 기초 1~3장 → V1 전체 구조 → V2~V4 서비스 연결 → V5~V7 개발·배포·버전 관리 → V8 코드 지도** 순서로 읽으세요. 이번 개정은 2026-11-10의 현재 소스를 기준으로 합니다. Webpack 예제 01~20과 과거 상세 부록은 별도로 표시했으며, 그 안의 실행 명령·내부 구현·검증 기록은 보존 시점의 자료입니다.

2026-11-10에는 **서로 다른 빈 npm 캐시 3개에서 첫 설치부터 시작해 45/45 검사를 통과**했습니다. B 단독 개발 10개, 설치한 같은 복사본의 개발·B 발행·교체·CLI/관리 UI 롤백 13개, SDK/D 교체·롤백 22개입니다. 공식 npm 저장소의 실제 다운로드, UI·MF 요청·기존 탭과 새 탭·원본 파일 보존을 확인했습니다. 학습서 V5~V8에 첫 설치 준비와 오류 대처를 보완했습니다. [빈 캐시 실행 근거](docs/verification/vite-cold-install/report.json) · [보완 내역](docs/verification/vite-cold-install/findings.json).

실습에는 Node.js 22.12 이상(이번 검증 24.22.1), npm, 브라우저, 첫 설치 시 인터넷 연결이 필요합니다. 현재 소스의 `vendor/` 도구 패키지와 `dev/` 의존 배포물도 함께 있어야 합니다. 이 파일은 설치 캐시가 아닌 프로젝트 구성물입니다. 위의 빈 캐시 기록은 Node·Chrome이 설치된 macOS의 작업 사본 기준입니다. 앞서 준비된 캐시로 수행한 [43개 검사 기록](docs/verification/vite-walkthrough/report.json)은 별도로 보존합니다.

이후 **실제 GitHub clone과 수정 묶음의 clone을 따로 확인**했습니다. 전환 준비 당시 GitHub의 `e4498f6`은 이전 Webpack 코드와 학습서여서 Vite 실습을 시작할 수 없었습니다. 로컬에만 있던 필수 도구 패키지 9개와 개발 키트 파일 174개를 포함한 검증 커밋 `319fa9a`를 임시 저장소에서 만들고, 다시 clone한 사본에서는 **385개 입력의 Git 포함 여부와 무결성 검사, 45/45 실습 검사**를 통과했습니다. 처음에는 새 터미널이 Node 16을 선택해 실패했으며, Node 24를 선택하고 새 빈 캐시로 다시 확인했습니다. 이 개정본에는 검증한 Vite 구현·동봉 파일·설치 전 검사를 함께 포함합니다. 아래 보고서는 반영 전 원격과 로컬 후보를 비교한 실행 기록입니다. [clone 검증 결과와 보완 내역](docs/verification/vite-clone/report.json).

## 상황별 독립 예제 — 실행할 때 찾아보기

**[20개 독립 예제 안내](examples/index.html)**를 브라우저에서 연다. 각 상황을 자체 소스·설정·잠금 파일·서버·초기 배포 저장소·검증·HTML 설명서를 가진 프로젝트로 분리했다. 원하는 `examples/번호-이름` 폴더 하나만 복사해서 실행·수정할 수 있다. 사용자별 구독은 [20번 독립 예제](examples/20-user-subscriptions/docs/index.html)로 추가했다.

```sh
cd examples/01-coexistence
npm --prefix integration ci
npm start
```

브라우저에서 `http://127.0.0.1:4501`을 연다. 소스 개발은 예제 루트에서 `npm run setup`, 검증은 `npm test`, 고정된 파일과 비교는 `npm run pins`다. 실행 저장소 초기화는 서버와 탭을 닫고 `npm run reset`을 실행한다. 상세한 읽는 순서와 버전 표는 각 예제의 `docs/index.html`에 있다.

아래는 기존 통합 실험과 설계의 참고 문서다. 독립 예제는 아래의 통합 실행 명령이나 이전 테스트 결과를 필요로 하지 않는다.

기존 통합 실험의 **[입문 설명서](docs/mfe-platform-versioning-guide.html)** 는 별도 참고 문서로 보존한다. 플랫폼·Shell·SDK의 역할부터 버전 선택까지 설명하며, 내용은 새 통합 학습서에도 포함했다. 처음 학습은 위의 통합 학습서를 기준으로 한다.

| 순서 | 문서 | 읽는 방법 |
| --- | --- | --- |
| 1 | [처음 이해하는 MF 플랫폼](docs/mfe-platform-versioning-guide.html) | 약 15분. 용어 → 역할 → 연결 → 재빌드 → 기존 탭 순서 |
| 2 | [서비스 개발과 프로젝트 안내](docs/mfe-project-handbook.html) | 단독 실행 → 파일 역할 → SDK 사용 → 발행. 전체 프로젝트 목록은 필요할 때 |
| 3 | [버전 운영과 오류 복구 참고서](docs/mfe-runtime-operations.html) | 버전 교체·복구·지원 종료 중 필요한 작업만 찾아보기 |
| 4 | [DB 확장 설계](docs/mfe-registry-db-design.html) | 저장소 확장 시 참고. 현재 구현이 아닌 설계안 |

HTML은 파일을 직접 열어 읽을 수 있다. 로컬 통합 서버에서는 `/guide`, `/handbook`, `/operations`, `/registry-design`으로 연다. 아래 내용은 실행과 검증의 빠른 참조다. `docs/*.md` 두 파일은 초기 논의 기록이며 HTML의 Webpack 내부 설명은 이전 구현을 기준으로 한다. 현재 Vite 빌드·모듈 로딩·복구 설정은 이 README와 [빌드 도구 안내](projects/platform-build-tools/README.md)를 기준으로 한다.

```text
Shell + 한 화면에서 선택한 플랫폼 SDK
├─ A → B 1.4 → 1.5 선택 가능 → D 1.0 → 1.1 선택 가능
└─ C → B 2.1 → 2.2 선택 가능 → D 2.0 → 2.1 선택 가능
```

현재 Shell 1.3은 SDK 지원 범위 `>=1.3.0 <2.0.0`, B는 `>=1.0.0 <2.0.0`을 선언하고 실행 시 선택한 SDK 하나를 공유한다. A는 B `>=1.4.0 <2.0.0`, C는 B `>=2.1.0 <3.0.0`을 선언한다. 실제 B는 조합의 `runtimeBindings[소비자 배포 ID].b`에서 각각 선택한다. B 1.x는 D `>=1.0.0 <2.0.0`, B 2.x는 D `>=2.0.0 <3.0.0`을 선언하고 `runtimeBindings[B 배포 ID].d`로 실제 D를 선택한다. React·ReactDOM은 동일한 정확한 버전을 공유한다.


## 새 서비스 추가와 메뉴 등록

[새 E 프로젝트 만들기](docs/mfe-project-handbook.html#new-service-walkthrough)의 0~5단계로 생성·단독 개발·빌드·발행한 뒤, [관리 화면에서 서비스와 메뉴를 등록](docs/mfe-project-handbook.html#registered-services)한다.

등록형 Shell 1.2.0·관리 앱 1.1.0·서버 기능을 최초 한 번 도입한다. 이후 **서비스 발행 → 관리 화면에서 메뉴/배포 버전/하위 버전 선택 → 검사·적용**으로 연결하며 Shell을 수정·재빌드하지 않는다. 새 탭에 적용되고 기존 탭의 메뉴·버전·상태는 유지한다. 메뉴도 조합 이력으로 롤백한다. 메뉴 제거와 등록 해제·파일 삭제는 별도다.

2026-11-08 등록 검증 **16/16 통과**. E 등록 후 F를 새로 생성·빌드·발행했다. Shell 소스/dist/발행 파일의 해시·수정 시각 유지, E/F 실행·SDK 공유·F→D 선택, 오류 격리/재시도, 메뉴 편집/제거/롤백, 지원 종료 차단·참조 보호를 확인했다. 기존 관리 12 + 사용 추적 14 + 삭제 보호 18개와 시작 프로젝트 따라하기 12개도 재검증했다. 전체 과거 테스트를 모두 다시 실행한 결과는 아니다.

```sh
cd integration
npm run test:navigation
npm run demo:navigation
# http://127.0.0.1:4177/admin#services
```

[등록 검증 보고서](integration/artifacts/verification/navigation.json). 결과는 `integration/artifacts/navigation-demo/latest.json`에 기록한 별도 저장소에서 제공한다. 원본 제품 조합은 유지한다. 한 단계 페이지 메뉴를 구현했으며 사용자 권한·S3 업로드는 별도다. 공개 위젯 배치는 아래 기능으로 제공한다.

이전 고정 E 배치 실습은 설명서의 접힌 참고 영역과 `test:onboarding`, `demo:onboarding`(4176)에 보존했다. 과거 12/12 결과는 [onboarding.json](integration/artifacts/verification/onboarding.json)에서 확인한다.

## 공개 위젯으로 대시보드 구성하기

서비스는 빌드 도구 1.7.0의 `mf.config.cjs.widgets`에 공개할 위젯을 선언한다. 일반 exposes에는 데이터 함수도 있으므로 widgets로 명시한 항목만 관리자가 선택한다. [계약과 사용 방법](docs/mfe-project-handbook.html#dashboard-widgets).

Shell 1.3.0·Admin 1.2.0·서버를 최초 한 번 전환한 뒤 `/admin#dashboard`에서 서비스 버전·공개 위젯·배치 ID·제목·순서·너비를 정하고 검사·적용한다. **배치를 바꾸거나 새 서비스를 추가해도 Shell을 재빌드하지 않는다.** 새 탭부터 반영하고 기존 탭은 이전 배치와 상태를 유지한다. 대시보드가 설정된 조합은 `/`가 대시보드, `/#/verification`이 기존 A/C 검증 화면이다.

```sh
cd integration
npm run test:dashboard
npm run demo:dashboard
# http://127.0.0.1:4178/admin#dashboard
# http://127.0.0.1:4178/
```

2026-11-08 **17/17 통과**. B 1.4/B 2.1과 같은 위젯 복제본의 상태·CSS·캐시·팝업 분리, 실제 SDK/React/Context 공유, 새 E 위젯 추가, 배치/너비 변경, 오류 격리·재시도, 빈 배치·롤백·기존 탭 유지·지원 종료·삭제 보호를 검증했다. Shell 소스/dist/발행 파일의 해시·수정 시각과 기존 서비스 파일 유지도 확인했다. 기존 메뉴 16개·삭제 보호 18개와 위젯 선언을 넣은 시작 프로젝트 따라하기 12개도 통과했다. [결과](integration/artifacts/verification/dashboard.json).

보존 위치는 `integration/artifacts/dashboard-demo/latest.json`. 독립 B/E 검증 프로젝트와 발행 저장소·조합이 남고 원본 제품 조합은 유지된다. 한 제품의 공통 대시보드, 최대 24개, 순서·1/2칸 너비를 지원한다. 자유 좌표 드래그, 개인별 저장, 권한별 노출은 포함하지 않는다.

## 서비스 하나로 개발하기

UI 서비스 A/C/B에는 독립 개발 Host와 발행된 SDK·의존성 키트가 포함되어 있다. 해당 폴더에서 `npm ci`, `npm run dev`만 실행한다. 다른 서비스 서버나 integration 서버는 필요하지 않다. SDK 1.2.0의 DevLayout·PageContainer를 MF로 가져오며 저장 시 현재 서비스만 재빌드하고 화면을 새로고침한다.

[개발 Host 사용법](docs/mfe-project-handbook.html#dev-host) · [DB로 버전·매니페스트를 관리하는 설계안](docs/mfe-registry-db-design.html)

DB 설계안은 메타데이터·의존 관계·운영 상태는 DB, 실행 파일은 S3에 두는 제안이다. 현재 저장소는 로컬 JSON이며 DB/S3 이관을 구현한 것은 아니다.

## 실행

Node.js 22.12 이상, 24 권장. 각 폴더는 별도 package.json·잠금 파일·소스·설정·빌드 도구 tarball을 가진다. 루트 npm 프로젝트나 workspaces는 없다. B/D의 두 버전 폴더는 공존 검증용 릴리스 스냅샷이다.

```sh
cd integration
npm ci
npm run setup
npm run build
npm start
```

- <http://127.0.0.1:4173>: 대시보드
- <http://127.0.0.1:4173/admin>: SDK·B·D 조합 관리
- <http://127.0.0.1:4173/guide>: HTML 설명서
- <http://127.0.0.1:4173/handbook>: 프로젝트·파일·개발 방법 안내
- <http://127.0.0.1:4173/registry.json>: 현재 선택 조합
- `/?order=ca`: C부터 로드
- `/?empty=1`: 위젯을 하나씩 추가

`setup`과 `build`는 검증 환경용 편의 명령이다. 각 서비스 폴더에서 `npm ci`, `npm run build`로 자체 빌드한다. 형제 프로젝트의 소스나 서버는 빌드에 필요하지 않다. 일반 `build`는 서비스별 의존 선택과 현재 SDK·B·D 런타임 선택을 유지한다. `bootstrap`은 최초 구성 또는 의도적인 전체 선택 재설정에만 사용한다.

## A가 B를 직접·간접으로 사용하는 추가 케이스

A → B 1.4, A → C 1.1 → B 2.1을 실제 MF로 구현했다. A만 불러와도 두 B 버전이 실행된다. [구조·실행·검증 설명](docs/mfe-runtime-operations.html#nested-graph).

```sh
# integration 폴더에서, 기본 빌드 산출물과 npm 캐시를 준비한 뒤
npm run test:nested
npm run demo:nested
```

<http://127.0.0.1:4174/?empty=1>에서 **A 불러오기**를 누른다. A/C 1.1.0과 B 2.1.0의 독립 복사본에 재시도 도구를 적용해 빌드하고 별도 검증 저장소를 사용한다. 테스트 없이 준비만 하려면 `npm run prepare:nested`. 기존 제품 조합은 유지한다.

2026-11-08: 중첩·오류 격리·복구 **31/31 통과**. 실제 HTTP 요청·버전·공통 React/Context·로딩 순서·상태/캐시/CSS/팝업·복제/제거·잘못된 연결·실패·모바일·원본 보존을 확인했다. 결과는 `integration/artifacts/verification/nested-graph.json`. C·B 2.1·D 2.0의 진입 파일·실행 청크에 실제 404/503을 발생시켜도 B 1.4의 입력·상태·캐시·팝업이 유지되고 계속 조작됨을 확인했다. 같은 파일이 복구되면 **C 영역 다시 시도**로 페이지 새로고침 없이 복구된다. 장애 중 재시도 실패·복구, 동시 재시도, 재시도 중 제거도 검사했다. 빌드 도구 1.5.0의 복구 지원 위에 SDK 1.3.0 공통 RemoteRegion을 추가했다. A는 platform/sdk에서 import하며 자체 오류 처리 구현을 제거했다. 소비자별 동일 별칭 분리·props 전달·호출 대상 변경도 검증했다. 최초 SDK/A 전환 뒤 버튼 재시도에는 재빌드가 없다. [서비스 팀 사용 코드](docs/mfe-runtime-operations.html#sdk-remote-region). [복구 구조와 검증](docs/mfe-runtime-operations.html#nested-retry) · [D 2.0 장애 복구](docs/mfe-runtime-operations.html#nested-d-retry). [오류 격리 설명](docs/mfe-runtime-operations.html#nested-isolation). 이 결과는 아래 기존 145개 검증 기록과 별도이며 전체 `npm test`에 추가했다.

## SDK만 업데이트한 실제 검증

SDK **1.3.1**의 RemoteRegion은 수동 재시도가 일시적 파일 로딩 오류로 실패하면 **500ms 뒤 한 번 더 시도**한다. A/C/B의 기존 import와 props는 그대로이며, SDK 프로젝트만 빌드·발행·선택했다. 소비자 배포 ID·파일 해시·프로젝트 수정 시각·B/D 연결을 유지한 채 **18/18 통과**했다. 기존 탭은 1.3.0의 동작을 유지하고 새 탭에만 1.3.1이 적용된다. 롤백도 같은 원칙이다.

```sh
# integration 폴더에서, 이전 보존 시나리오와 설치된 의존성을 사용
npm run test:region-sdk
npm run demo:region-sdk
```

[새 SDK 시연](http://127.0.0.1:4175/?empty=1) · [정책 비교·검증·재현 설명](docs/mfe-runtime-operations.html#sdk-region-upgrade) · [검증 보고서](integration/artifacts/verification/remote-region-sdk-upgrade.json). 기존 중첩 31개 검증과 별도이며, 전용 검사는 A/C/B를 다시 빌드하지 않는다. 이전 보존본 위치는 `integration/artifacts/remote-region-sdk-upgrade/baseline.json`에 고정한다.

## 관리 화면에서 버전 선택과 롤백

`/admin`에서 현재 SDK와 A → B → D, C → B → D를 확인한다. 저장소에 발행된 SDK·B·D를 선택하고 변경 내역을 확인한 뒤 **조합 검사 → 변경 적용**을 누른다. 선택 변경에는 서비스 재빌드가 없다. 새 버전의 빌드·발행은 기존 절차대로 수행한다.

이전 조합은 이력에서 **불러오기 → 조합 검사 → 이 조합으로 롤백**으로 복원한다. 다른 관리자나 CLI가 먼저 변경하면 덮어쓰지 않고 재검사를 요구한다. 열린 서비스 탭은 기존 조합을 유지하고 새 진입부터 변경된다. 구버전 파일은 보존한다.

관리 앱은 `projects/platform-admin`의 독립 프로젝트이며 제품 Shell·SDK를 가져오지 않는다. `integration`에서 `npm run build:admin`으로 관리 앱만 빌드·발행할 수 있다. 이 명령은 서비스 조합을 바꾸지 않는다. 현재는 로컬 관리용으로, 운영 인증·팀별 권한·감사 로그는 포함하지 않는다. 이력의 시각은 조합 파일의 최초 저장 시각이다.

## 사용 현황과 지원 종료

<http://127.0.0.1:4173/admin#lifecycle>에서 배포물을 선택하면 현재 소비 서비스와 전체 경로, 열린 탭, 롤백 조합과 고정 참조를 확인한다. 지원 종료 예정일과 공지 기록을 저장하고 삭제 보류 사유를 볼 수 있다. 같은 버전도 배포 ID별로 구분한다.

지원 종료된 배포물의 신규 선택은 UI·API·CLI에서 차단한다. 현재 조합의 동일한 사용 경로를 유지할 수는 있지만 새 소비 경로를 추가하거나, 다른 버전으로 바꾼 뒤 종료 버전으로 돌아가는 롤백은 거절한다.

상세에서 **등록 해제 준비 → ID·사유 확인 → 실행**으로 선택 목록에서 제외한다. 파일은 남는다. 지원 종료·공지 유예 30일·현재 조합 미사용이 필요하다. 과거 조합의 롤백 보관은 별도로 명시적 해제하며, 조합 기록과 열린 탭 보호는 유지한다.

**파일 삭제 준비 → ID·사유·관측 범위 밖 미사용 확인 → 실행**은 로컬 저장소 파일을 실제로 삭제한다. 등록 해제·지원 종료·공지 유예 종료·접근 종료·마지막 관측·탭 정리 중 가장 늦은 시점부터 최소 30일 보존, 관측 시작 후 최소 30일이 필요하다. 현재 사용·탭·롤백·고정 참조가 남으면 서버가 거절한다. 모든 검사는 실행 직전에 다시 수행한다. 자동 삭제·공지 전송은 하지 않는다.

새 Shell은 서비스 시작 전에 탭 사용 기한(lease)을 받는다. 15초마다 갱신하며 5분간 갱신하지 못하면 화면 조작·Shell의 MF 추가 로딩·새 fetch/XHR 요청을 막는다. 연결이 잠깐 끊겼다가 기한 안에 복구되면 입력을 유지한다. 만료된 탭은 ‘최신 화면 열기’를 눌러 새 조합으로 시작한다.

상세의 **응답 없는 탭 정리**에서 재개 보호 적용 여부, 사용 기한과 정리 가능 시점을 확인한다. 만료 후 24시간을 기다린 뒤 전체 탭 ID와 사유로 참조를 정리할 수 있다. 갱신된 기록은 서버가 거절하며, 정리한 기록은 늦은 보고로 되살아나지 않는다. 파일은 정리 시점부터 최소 30일 더 보존하고 다른 탭·롤백·고정 참조도 계속 확인한다.

보호 기능 도입에 Shell과 관리 화면을 한 번 수정·빌드했다. SDK·A·B·C·D는 재빌드하지 않는다. 이전 Shell/이미 열린 탭에는 재개 보호가 소급 적용되지 않으므로 아래의 별도 전환·접근 종료 절차를 사용한다. 도입 전 탭·다른 호스트·보고가 한 번도 도착하지 않은 탭도 별도 확인이 필요하다. 자세한 동작과 한계는 [설명서](docs/mfe-runtime-operations.html#session-leases)에 있다.

**구형 탭 전환 · 접근 종료**에서는 두 가지 경로를 제공한다. 같은 브라우저·프로필·출처에 전환 중계를 연결하고 대상 탭의 전체 ID·사유·입력 손실을 확인해 전환을 요청한다. 원래 코드가 서버 명령을 무시해도 중계가 다음 응답을 받아 별도 문서로 이동시킨다. 그 문서의 확인을 받은 뒤에만 이전 참조를 해제한다. 중계 없는 다른 브라우저의 요청은 완료로 간주하지 않는다.

돌아오지 않는 탭은 **버전 접근 종료 → 24시간 유예 → 이 버전 참조 정리 → 최소 30일 보존 → 파일 삭제**로 처리한다. 현재 조합·보호 탭·롤백·고정 참조 또는 최근 24시간 구형 탭 응답이 있으면 접근 종료를 막는다. 서버가 해당 버전 파일을 410으로 차단한 뒤 그 버전에 대한 참조만 정리하며, 같은 탭의 다른 버전 참조는 유지한다. 이미 받은 코드나 외부 업무 API까지 회수하는 기능은 아니다. [구형 탭 처리 설명](docs/mfe-runtime-operations.html#legacy-tabs).

## SDK만 업데이트

프로젝트 루트에서 시작한다. 버전·lockfile을 갱신한 뒤 SDK만 빌드한다.

```sh
cd projects/platform-sdk
npm version minor --no-git-tag-version
npm run build
cd ../../integration
npm run publish -- ../projects/platform-sdk
npm run activate -- --platform 'NEW_SDK_ARTIFACT_ID'
```

대문자 ID는 발행 결과의 실제 ID로 교체한다. 기존 Shell·A·B·C·D는 재빌드하지 않는다. 지원 SDK 범위와 정확한 React·ReactDOM 조건을 확인하며 공개 API 호환성은 기존 소비자 산출물로 검증한다.

## B만 업데이트하고 A·C별로 선택

B 소스·버전·lockfile을 갱신하고 B만 빌드한다. 아래는 C가 사용하는 B 2.x 예다.

```sh
cd projects/service-b-v2
npm version minor --no-git-tag-version
npm run build
cd ../../integration
npm run publish -- ../projects/service-b-v2
npm run activate -- --bind 'C_ARTIFACT_ID:b=NEW_B_2_ARTIFACT_ID' --bind 'NEW_B_2_ARTIFACT_ID:d=D_2_ARTIFACT_ID'
```

소비자 ID는 현재 등록부의 `selected.C`에서, 새 B ID는 발행 결과에서 확인한다. 새 B의 D도 함께 지정한다. A도 `--bind 'A_ARTIFACT_ID:b=NEW_B_1_ARTIFACT_ID' --bind 'NEW_B_1_ARTIFACT_ID:d=D_1_ARTIFACT_ID'`로 독립 선택한다. `--bind`를 여러 번 넘기면 하나의 조합으로 함께 전환한다.

최초 구조 전환 이후에는 A·C·Shell·SDK 재빌드가 없다. 범위 밖 B·잘못된 서비스·누락된 의존성·순환참조·SDK/React 불일치를 활성화 전에 거절한다. 범위 일치만으로 API 동작의 호환성을 보증하지는 않는다.

A 자체를 수정하여 배포 ID가 바뀌었다면 발행 후 `--A NEW_A_ID --bind NEW_A_ID:b=B_ID`를 함께 지정한다. 같은 A 배포물을 두 번 띄우면 같은 B를 쓰고 상태만 분리한다. 같은 B 배포물에 부모 경로별로 다른 D를 연결하는 기능은 없다.

## B 재빌드 없이 D만 업데이트

최초 런타임 연결 전환 후 사용한다. 프로젝트 루트에서 시작하는 D 1.x 예다.

```sh
cd projects/service-d-v1
npm version minor --no-git-tag-version
npm run build
cd ../../integration
npm run publish -- ../projects/service-d-v1
npm run activate -- --bind 'B_1_ARTIFACT_ID:d=NEW_D_1_ARTIFACT_ID'
```

B ID는 등록부의 `runtimeBindings[selected.A].b`에서, 새 D ID는 발행 결과에서 확인한다. C 경로는 `runtimeBindings[selected.C].b`를 소비자로 지정한다. B·A·C·Shell·SDK 파일은 유지하며 각 B의 D 바인딩만 바뀐다. D가 B에서 사용하는 API와 지원 범위를 유지해야 한다.

## 조합 유지와 롤백

발행과 활성 선택은 별도다. HTML·등록부를 불변 조합으로 준비한 뒤 `current.json` 포인터를 바꾼다. 열린 화면은 처음 받은 SDK·B·D 선택을 유지하고 새 진입·새로고침부터 새 조합을 사용한다.

```sh
# integration에서 이전 등록부의 compositionId 사용
npm run activate -- --composition 'PREVIOUS_COMPOSITION_ID'
```

롤백은 SDK와 소비자별 B·D 바인딩을 함께 복구한다. 구버전 파일은 그대로 보존한다. 로컬 파일 시스템의 전환을 구현했으며 실제 S3/CDN 운영 배포는 별도 범위다.

## 검증

아래 날짜별 통과 기록은 Vite 전환 전의 검증 이력입니다. 현재 컴파일러는 같은 통합 검사를 다시 실행해 확인하며, 실행 결과는 `integration/artifacts/verification/`에 기록합니다.

2026-11-07: 독립 설치·빌드 **7/7**, 서비스 공존 **17/17**, SDK 교체 **10/10**, B 교체 **12/12**, D 교체 **12/12**, 관리 화면 **12/12**, 사용 추적·지원 종료 **14/14**, 등록 해제·파일 삭제 **18/18**, 만료 탭 정리 **16/16**, 구형 탭 전환 **17/17**, 서비스 단독 개발 **10/10**, 총 **145개 검사 통과**. 서비스 개발 도구 1.3.0과 SDK 1.2.0을 추가했으며 개발 검사는 각 UI 프로젝트의 격리 복사본에서 진행했다. 실제 삭제는 임시 저장소에서만 검사했고 제품의 현재 선택 조합은 유지했다.

구조 전환 뒤 B 교체 중 A·C·Shell·SDK 빌드는 0회이며 원본 8개 서비스 프로젝트의 소스·설정·산출물 해시를 전후 비교했다. A: B 1.4→1.5, C: B 2.1→2.2를 독립 선택해 동시 실행했다. D 검사에서는 D 1.0→1.1, D 2.0→2.1을 독립 선택하고 B·A·C·Shell·SDK 빌드 0회를 확인했다. SDK 회귀 검사는 1.1→1.2를 확인했다. 관리 화면에서는 실제 버전 적용·롤백·이전 Shell 복원 후 관리 앱 접근·동시 변경 거절·요청 검증·모바일 화면을 확인했다. 관리 작업 중 전체 프로젝트와 발행된 파일이 유지됐고 소비자 빌드는 0회다.

```sh
# integration에서 기준 산출물을 준비한 뒤 실행
npm test
npm run test:sdk
npm run test:business
npm run test:dependency
npm run test:admin
npm run test:lifecycle
npm run test:retirement
npm run test:sessions
npm run test:legacy
```

SDK·B·D 검사는 임시 저장소와 해당 소스 복사본만 사용한다. 다음 minor 버전으로 올려 실제 화면 변화·원격 요청·Context 동일성·원본 파일 보존·열린 탭 유지·롤백·잘못된 조합 거절·로딩 실패를 확인한다. 검증된 B·D 산출물은 각각 `integration/artifacts/runtime-b-releases/`와 `integration/artifacts/runtime-d-releases/`에도 남겨 로컬 시연에서 재사용한다.

사용 추적 검사는 실제 탭의 보고와 늦은 C 로딩, D 교체 뒤 구버전 보호, 응답 끊김 처리, 정책 저장·동시 수정 거절, 요청 검증·날짜 경계·보존 조건, 재시작 보존과 모바일을 확인했다. 서비스 빌드는 0회이며 날짜별 삭제 검토는 별도의 시계 인자로 검증했다. 모든 통합 브라우저 검사는 임시 저장소를 사용해 시험 탭을 실제 사용 기록과 섞지 않는다.

macOS 설치 Chrome 또는 Playwright Chromium을 사용한다. 다른 환경에서는 `npx playwright install chromium`을 실행하거나 `CHROME_EXECUTABLE_PATH`를 지정한다. 독립 설치 검사는 준비된 npm 캐시를 사용한다. 기본 경로는 `/private/tmp/mfe-npm-cache`다.

```sh
MFE_NPM_CACHE=/tmp/mfe-npm-cache npm run setup
NPM_CACHE=/tmp/mfe-npm-cache npm test
```

결과: `integration/artifacts/verification/`의 `independence.json`, `report.json`, `sdk-upgrade.json`, `business-upgrade.json`, `dependency-upgrade.json`, `admin.json`, `lifecycle.json`, `retirement.json`, `sessions.json`, `legacy.json`, `development.json`과 화면 이미지.

## 구현 범위

MF container·ES 모듈·CSS는 배포물마다, 상태·캐시·구독·팝업은 위젯 인스턴스마다 분리한다. 임의의 window·DOM 변경을 막는 보안 격리는 아니다. 로컬 사용 추적·지원 종료 계획·신규 선택 차단·등록 해제·롤백 보관 해제·실제 파일 삭제를 구현했다. 이미 로딩한 코드의 완전한 unload, 실제 API 인증, S3/CDN 삭제, 외부 호스트 사용량 집계·폐기 알림 전송, 범용 위젯 등록 UI는 포함하지 않는다.

D는 데이터 함수 모듈이다. 실제 D 컨테이너·함수 반환값과 B 화면의 상태·스타일 분리 유지를 확인한 범위이며, 임의의 D 전역 상태·부작용을 격리한다는 보장은 아니다.
