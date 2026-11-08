> 처음 읽는다면 [입문 설명서](../docs/mfe-platform-versioning-guide.html) → [개발 안내서](../docs/mfe-project-handbook.html) 순서로 읽으세요. 이 README는 통합 도구·검증 명령의 참조입니다. 버전 교체·오류 복구·삭제 절차는 [운영·검증 참고서](../docs/mfe-runtime-operations.html)에 모았습니다.

# 독립 프로젝트 통합 검증

[개발 안내서의 통합 도구·하위 파일 설명](../docs/mfe-project-handbook.html#integration) · [배포 저장소 구조](../docs/mfe-project-handbook.html#store) · [실행·개발·발행 순서](../docs/mfe-project-handbook.html#workflow)

서비스 빌드에 필수인 프로젝트가 아니다. 각 프로젝트가 만든 산출물을 로컬 저장소에 모으고 실제 브라우저에서 조합을 검증한다.

Node.js 24 권장. 이 디렉터리에서 실행한다.

```sh
npm ci
npm run setup
npm run build
npm start
```

`setup`은 `../projects/*`에서 개별 `npm ci`를 실행한다. `build`는 각 프로젝트에서 개별 빌드 후 `../artifact-store`에 발행한다. `MFE_ARTIFACT_STORE`로 저장소 경로를 변경할 수 있다. 화면은 <http://127.0.0.1:4173>에서 확인한다.

평소 build는 각 서비스의 `mf.dependencies.json`과 현재 중앙 SDK·소비자별 B·D 선택을 보존한다. `bootstrap`만 fixture 정의를 기준으로 의존 선택을 다시 작성한다. bootstrap은 최초 구성 또는 의도적인 전체 재설정에만 사용한다.

```sh
npm run publish -- /path/to/service
npm run activate -- --C NEW_C_ID --bind NEW_C_ID:b=B_ID --bind B_ID:d=D_ID
npm test
```

publish의 마지막 인자를 생략하면 발행만 한다. A·C의 배포 ID가 새로 생겼다면 위처럼 역할과 B 바인딩을 함께 활성화한다. 선택적 마지막 인자 A, C, shell을 사용하는 자동 활성화는 새 바인딩이 필요하지 않을 때만 가능하다. 기존 산출물은 보존한다.

`npm test`는 분리된 임시 프로젝트의 오프라인 설치·빌드, 브라우저 공존, SDK 단독 업데이트, A·C별 B 교체, B별 D 교체, 관리 화면의 적용·롤백 검사를 실행한다. 브라우저 검사는 임시 포트의 서버를 스스로 실행·종료한다. 결과는 `artifacts/verification/`에 저장된다.

독립 설치 검사는 준비된 npm 캐시가 필요하다. 기본값은 `/private/tmp/mfe-npm-cache`이며 새 환경에서는 다음처럼 지정한다.

```sh
MFE_NPM_CACHE=/tmp/mfe-npm-cache npm run setup
NPM_CACHE=/tmp/mfe-npm-cache npm test
```

macOS의 설치된 Chrome을 사용하며, 다른 환경은 `npx playwright install chromium`을 실행한다. `CHROME_EXECUTABLE_PATH`로 실행 파일을 직접 지정할 수도 있다.

이 프로젝트는 현재 로컬 폴더 배치를 가정하는 검증 도구다. 서비스 자체는 별도 위치로 옮겨도 설치·빌드되며, 서비스 저장소를 실제 분리할 때 이 통합 도구의 fixture 경로만 검증 환경에 맞게 변경하면 된다.

SDK를 발행한 뒤 `npm run activate -- --platform ID`로 중앙 선택을 변경한다. `npm run activate -- --composition ID`로 이전 조합을 다시 선택한다. HTML과 등록부는 불변 조합으로 발행하고 단일 current.json 포인터로 전환한다. 열린 페이지는 이전 조합을 유지한다. [HTML 설명서](../docs/mfe-platform-versioning-guide.html)를 참고한다.

B를 발행한 뒤 `npm run activate -- --bind 'A_ID:b=B_1_ID' --bind 'B_1_ID:d=D_1_ID' --bind 'C_ID:b=B_2_ID' --bind 'B_2_ID:d=D_2_ID'`로 A·C별 선택을 바꾼다. 하나의 바인딩만 바꾸어도 된다. 소비자는 `runtimeDependencies`에 지원 범위를 선언하고 조합의 `runtimeBindings`는 소비자 배포 ID와 별칭별로 실제 대상을 저장한다. 같은 소비자 배포물의 모든 인스턴스에는 같은 선택을 적용한다.

`npm run test:business`는 두 B 복사본만 다음 minor 버전으로 빌드한다. A·C·Shell·SDK를 재빌드하지 않고 실제 원격 파일, 양방향 로딩, CSS·캐시·상태·팝업 분리, 열린 탭 유지, 롤백, 범위·서비스·순환참조 거절과 한쪽 B 로딩 실패를 검사한다. 원본 8개 프로젝트 파일의 전후 해시도 비교한다. 결과는 `artifacts/verification/business-upgrade.json`이다. 검증된 B 산출물은 `artifacts/runtime-b-releases/<id>/dist`에 남겨 발행에 재사용할 수 있다.

D만 발행한 뒤 `npm run activate -- --bind 'B_ID:d=NEW_D_ID'`로 그 B의 D만 바꾼다. A·C가 선택한 B ID와 B 파일은 유지한다. 새 B 배포물을 선택할 때는 새 B의 D 바인딩도 함께 지정해야 한다. `build`는 현재 선택된 그래프에서 실제로 도달하는 소비자의 바인딩만 유지해, 선택하지 않은 B를 새로 빌드해도 현재 D 선택이 초기화되지 않는다.

`npm run test:dependency`는 D 1.x·2.x 복사본만 다음 minor 버전으로 빌드한다. 기존 B·A·C·Shell·SDK의 파일 보존, D의 실제 HTTP 요청과 함수 반환값, 양방향 로딩, 상태·CSS·캐시·팝업 유지, 기존 탭의 늦은 C 로딩, 롤백, 잘못된 D 그래프 거절과 D 실패의 경로 분리를 확인한다. 결과는 `artifacts/verification/dependency-upgrade.json`, 검증된 D는 `artifacts/runtime-d-releases/<id>/dist`에 남는다.

## 직접·간접 B 복수 버전 시나리오

```sh
npm run test:nested
npm run demo:nested
```

A가 B 1.4와 C 1.1을 가져오고 C가 B 2.1을 가져오는 실행 예제다. `scenarios/nested/AWidget.jsx`, `CWidget.jsx`, `Nested.module.css`가 업무 시나리오 코드다. 오류 격리·재시도는 `projects/platform-sdk/src/RemoteRegion.jsx`와 `remote-loader.js`, `RemoteRegion.module.css`로 이동했고 A가 platform/sdk에서 MF로 import한다. `RemoteRegionProbe.jsx`는 소비자별 별칭·props 변경 검증 전용이다. `tools/prepare-nested.cjs`는 A/C/B 2.1을 별도 부모 폴더 안의 독립 프로젝트로 복사하고, 빌드 도구 1.5.0 tarball을 vendor·lockfile에 반영한 뒤 설치·빌드·발행한다. A/C는 1.1.0, B는 2.1.0이며 B 업무 소스는 원본과 동일하다. SDK는 RemoteRegion을 제공하는 현재 dist를 선택하며 먼저 SDK 프로젝트에서 npm run build를 실행한다. 아래 31개 결과를 기록할 때의 SDK는 1.3.0이다. B 1.4/D/Shell은 기존 dist를 사용한다. A는 SDK >=1.3.0 <2.0.0을 선언한다. 기본 산출물과 `/private/tmp/mfe-npm-cache`의 npm 캐시가 필요하며 `NPM_CACHE`로 경로를 바꿀 수 있다. 정확한 검증 조건 때문에 B 1.4의 기존 dist와 B 2.1 프로젝트의 package 버전은 각각 1.4.0·2.1.0이어야 한다.

실제 조합에는 `A_ID.b=B1_ID`, `A_ID.c=C_ID`, `C_ID.b=B2_ID`, 각 `B_ID.d=D_ID`를 지정한다. A의 b 선택을 C에 상속하지 않는다. A/C는 각각 자신의 `b/Widget`을 import한다. 새로운 C 의존성을 추가하는 최초 작업에는 A 빌드가 필요하다.

검증 뒤 `artifacts/nested-demo/verified-*/`에 프로젝트 복사본(node_modules 제외)·dist·저장소·scenario.json을 보존하고 `latest.json`으로 선택한다. `demo:nested`는 이 저장소를 기본 4174에서 제공한다. <http://127.0.0.1:4174/?empty=1>에서 **A 불러오기**를 누르면 된다. `PORT`로 포트를 바꿀 수 있다. 검증 없이 새로 준비하려면 `npm run prepare:nested`; 명시적 빈 디렉터리에 준비하려면 `node tools/prepare-nested.cjs --output /path/to/empty-directory`를 사용한다. 명시적 출력은 시연용 latest.json을 바꾸지 않는다. 이 복사본에는 dev 키트를 포함하지 않으므로 화면은 시연 Host로 확인하고, 재빌드하려면 복사본에서 npm ci 후 npm run build를 실행한다.

`test:nested`는 2026-11-08 기준 31/31을 통과했다. A만 마운트한 직접·간접 경로, C/A 로딩 순서, 실제 모듈의 React/Context 동일성, container 1회 초기화, 상태·캐시·CSS·Portal·구독·DOM ID 분리, A 복제와 A/C 제거·재마운트, 잘못된 바인딩 차단, C/B 2.1/D 2.0 진입 파일·실행 청크의 실제 404/503 오류 격리, 지연 응답 중 조작·제거 후 늦은 완료, 모바일, 원본 8개 프로젝트·현재 제품 조합 보존을 확인한다. 결과는 `artifacts/verification/nested-graph.json`, 화면은 `nested-graph.png`, `nested-graph-mobile.png`다. 실패 화면은 `nested-isolation-{C-entry,B2-entry,C-chunk,B2-chunk}.png`, 모바일은 `nested-isolation-mobile.png`다. 여섯 가지 복구 화면은 `nested-recovered-{C-entry,B2-entry,C-chunk,B2-chunk,D2-entry,D2-chunk}.png`이며 보고서 `pages[].recovery`에 실제 실패·성공 응답, 탐색 횟수, 정리한 캐시를 기록한다. 장애 중 재시도, 복구 후 재시도, 두 영역의 동시 재시도와 재시도 중 제거도 확인한다. 테스트는 브라우저의 실제 파일 응답을 보류한 상태에서 B 1.4를 조작한 뒤 404/503을 응답하며, 서버 파일이나 버전 선택을 바꾸지 않는다. 전체 npm test에도 포함했다.

A는 B 1.4를 정적 import하고 C는 마운트 뒤 SDK의 RemoteRegion에서 별도로 로드한다. SDK 로더는 `getDependencyContainer(A_ID, "c")` → 동일 share scope의 `init` → `get("./Widget")`을 사용한다. C의 정적 import와 getIdentity에서의 C 실행을 제거해 A의 시작이 C 응답을 기다리지 않는다. C/B 2.1 파일 실패는 해당 C 영역에만 표시하고, 직접 B 1.4의 DOM·입력·상태·캐시·팝업·구독은 유지한다. 로딩 Promise 실패와 하위 렌더링 오류를 각각 처리하며, 제거한 C는 늦은 응답으로 다시 마운트하지 않는다. **C 영역 다시 시도** 버튼은 실패한 모듈 캐시만 정리하고 같은 배포물을 다시 요청한다. 페이지 새로고침이나 직접 B 재마운트는 없다. 두 C의 진행 중 요청은 공유하고 제거한 영역에는 늦은 복구 결과를 적용하지 않는다. SDK 1.3.0은 자동 재시도하지 않는다. SDK 1.3.1은 수동 클릭 뒤 일시적 로딩 실패에 한해 500ms 후 한 번 더 시도한다. 최초 로딩과 무한 폴링에는 적용하지 않는다. B 2.1을 B 1.4로 임의 대체하지 않는다. 같은 C 배포물을 여러 위치에 마운트해도 C의 B 선택은 하나이며, 상태는 인스턴스마다 분리한다. 관리 UI의 A→C 연결 편집은 이번 범위에 포함하지 않았다. [설명서의 추가 사례](../docs/mfe-runtime-operations.html#nested-graph) · [오류 격리 구조와 범위](../docs/mfe-runtime-operations.html#nested-isolation).

앞 단계에서 C/B에 빌드 도구 1.5.0 복구 지원을 도입했다. 이번에는 SDK 1.3.0과 이를 import하는 A를 변경했고 이후 장애 복구에는 재빌드하지 않는다. 재현 도구는 A/C/B 2.1을 독립 설치·빌드한다. Shell·B 1.4·D의 기존 파일과 제품의 활성 조합을 유지했다. `retryProtocol: "failed-modules-v2"`와 `./__mfe_retry__`는 프로젝트 전용 계약이다. `getFailedExposes()`로 실패한 공개 모듈을 찾아 B부터 캐시를 정리하고 get으로 하위 파일 로딩을 다시 준비한다. 기존 v1 캐시 정리만으로 D 재요청을 건너뛰는 문제를 해결했다. D 진입 파일 404·실행 청크 503 각각 장애 중 재시도와 복구를 확인했고, 보고서 `prepared` 필드로 B→C 준비 순서를 확인한다. 두 C 동시 재시도와 D 요청 중 제거도 검사한다. 도구 미도입 구형 B나 임의 실행 오류까지 복구를 보장하지 않는다. [복구 구현·근거·적용 범위](../docs/mfe-runtime-operations.html#nested-retry).

SDK 공통 로딩 캐시는 runtime별로 consumerId·alias·exposedModule을 함께 구분한다. 서비스는 자신의 __ARTIFACT_ID__를 consumerId로 전달해야 한다. A의 b와 C의 b를 동시에 사용해 다른 B 버전이 선택되는지, props가 전달되는지, 소비자·공개 모듈 변경과 잘못된 소비자가 해당 영역에만 영향을 주는지 검증했다. 복구 로그는 A가 아니라 SDK의 getRemoteRecoveryLog()에서 읽는다. [SDK 사용 코드와 책임](../docs/mfe-runtime-operations.html#sdk-remote-region).

## 관리 화면

<http://127.0.0.1:4173/admin>에서 현재 의존 그래프, SDK·B·D 선택, 변경 내역과 검사, 적용 및 저장된 조합으로 롤백한다. 관리 앱은 `projects/platform-admin`의 독립 프로젝트다. `npm run build:admin`은 관리 앱만 빌드·발행하며 제품의 활성 조합은 유지한다. 일반 `build`와 `bootstrap`에도 관리 앱 준비가 포함된다.

관리 앱은 `admin.json`으로 선택하며 제품의 SDK·Shell을 import하지 않는다. 관리 API는 기존 저장소의 검증·활성화·롤백 함수를 사용한다. 적용 직전 기대한 현재 조합과 검사한 대상 조합을 다시 비교하고, 다른 변경이 있으면 409로 거절한다. 미리 검사는 포인터를 쓰지 않는다.

`npm run test:admin`은 임시 저장소에서 실제 브라우저로 버전 변경·잘못된 선택 거절·경합·롤백·모바일 화면·프로젝트 파일 보존을 검사한다. 먼저 `npm test`를 실행하거나 `test:sdk`, `test:business`, `test:dependency`로 대체 버전 산출물을 준비한다. 관리 검사는 이들 결과의 retainedRelease(s)를 임시 저장소에만 발행한다. SDK 산출물은 `artifacts/runtime-sdk-releases/<id>/dist`에 남는다. 원래 서비스 조합은 바뀌지 않는다. 결과는 `artifacts/verification/admin.json`이다.

이전 Shell 조합이 저장되어 있으면 실제로 그 Shell로 롤백한 뒤 관리 화면 접근도 확인하고 보고서에 기록한다. 신규 저장소에는 이전 Shell이 없으므로 서비스 remote 요청을 차단한 상태의 관리 화면 독립성을 확인한다.

로컬 주소와 동일 출처·JSON·변경 요청 토큰을 검사하지만 운영용 인증·팀별 권한·감사 로그는 구현하지 않았다. 이력은 고유 조합 목록이고 시각은 파일의 최초 저장 시각이다. 매번의 적용 이벤트 기록과는 다르다.

## 버전별 사용 추적과 지원 종료

`/admin#lifecycle`은 현재 조합의 역방향 의존 경로, 열린 탭의 조합·container 로드, 저장된 조합과 발행된 고정 참조를 함께 표시한다. 지원 종료 예정일(한국 시간 날짜 끝), 공지 기록을 별도 revision으로 저장한다. 서버 재시작 후에도 유지된다.

- `GET /api/admin/lifecycle`: 사용 현황·정책·삭제 보류 사유. 화면은 10초마다 갱신한다.
- `POST /api/admin/lifecycle`: `{artifactId, expectedRevision, supportEndsOn, noticeReference}`. 기존 관리 API와 같은 토큰·출처 검증을 사용한다.
- `GET /api/runtime/config`, `POST /api/runtime/usage`: 익명 탭의 조합·로드된 container·순서 번호 보고. 서버 수신 시각으로 기록하며 해당 조합 밖의 배포물은 거절한다.
- `artifact-store/usage.json`, `lifecycle.json`: 가변 운영 정보. 배포 파일·조합 파일과 분리하고 공개 정적 경로에서는 제공하지 않는다.

서버가 `/`와 `/compositions/*.html` 응답에 `/runtime-usage.js`를 추가한다. 불변 파일은 바꾸지 않고 소비자를 재빌드하지 않는다. 현재 런타임의 `getDiagnostics()`를 사용하므로 해당 인터페이스가 없는 구형 Shell과 별도 4180 Shell 서버는 관측 범위 밖이다. 익명 ID는 문서마다 생성하고, heartbeat는 15초, 최근 응답 기준은 120초다. 지연 로딩에 필요한 전체 조합을 보호하며 container 로드와 현재 UI 사용을 동일시하지 않는다.

응답 중단은 종료가 아니다. 종료 보고가 전달되지 않으면 확인 불가 상태로 보류한다. 아래의 재개 보호가 있는 탭만 별도 정리할 수 있다. BFCache의 pagehide는 종료로 보내지 않는다. 보고 순서 번호로 지연·중복 전송을 처리하며 확정 종료된 ID는 되살리지 않는다. 추적 전 탭, 외부 호스트·CDN, 등록 보고가 도착하지 않은 탭은 별도 확인이 필요하다.

삭제 검토 정책은 `tools/lifecycle.cjs`의 `POLICY`에 있다. 공지 기록 후 최소 30일, 등록 해제·지원 종료·공지 유예 종료·접근 종료·마지막 관측·탭 정리 중 가장 늦은 시점부터 최소 30일 보존, 관측 시작 후 최소 30일이다. 실제 지속 관측을 보증하는 SLA가 아니라 예제의 보수적 후보 기준이다. 전체 사용·탭·롤백·고정 참조 조건도 없어야 후보가 된다.

`npm run test:lifecycle`은 임시 저장소에서 실제 브라우저 보고, D 전환 뒤 구버전 탭 보호, 지원 정책 저장·경합·입력 검증, 서버 재시작 보존, 모바일과 원본 파일 보존을 검사한다. 날짜 경계·관측·유예·보존 기간은 독립 시계 인자로 확인한다. 종료 보고의 유실 가능성 때문에 실제 탭 닫기를 항상 감지한다고 주장하지 않으며 확정 종료 입력과 BFCache 이벤트를 별도로 검증한다. 결과는 `artifacts/verification/lifecycle.json`이다. 먼저 `npm test` 또는 `test:dependency`로 대체 D 산출물을 준비한다.

## 신규 선택 차단과 두 단계 제거

종료된 버전은 `resolveComposition`에서 전체 의존 경로를 비교해 거절한다. 현재 조합과 정확히 같은 경로만 유지할 수 있다. 새 소비자·간접 경로와 되돌아가는 롤백에는 예외가 없다. UI의 선택 비활성화 외에 preview·apply·CLI 모두 서버 검증을 사용하고 적용 시 다시 확인한다. 이미 열린 탭이나 현재 조합의 신규 방문자를 강제 종료하는 기능은 아니다.

- `POST /api/admin/releases/unregister`: 지원 종료·공지 유예 경과·현재 미사용 검사 후 등록 해제. 배포 파일은 유지한다.
- `POST /api/admin/compositions/retire`: 현재 조합은 금지. 과거 조합의 롤백 보관을 명시적으로 해제한다. 조합 JSON·HTML 기록을 남기되 재활성화와 직접 HTML 새 진입은 막는다. 탭 참조는 계속 보호한다.
- `POST /api/admin/releases/delete`: 등록 해제 후 보존 기간·전체 참조·관측 조건을 다시 검사하고 실제 파일을 제거한다. 최근 탭뿐 아니라 응답이 끊긴 탭, 보호된 롤백과 파일이 남은 고정 소비자도 차단한다.

모든 작업에 `expectedCompositionId`, `expectedRevision`, `confirmationId`(대상 전체 ID), `reason`이 필요하다. 배포물은 `artifactId`, 조합은 `compositionId`를 전달한다. 파일 삭제에는 `externalUsageChecked: true`도 필요하다. 이 확인은 서버가 발견한 참조나 기간 조건을 무시하는 우회 옵션이 아니다.

등록 상태는 `lifecycle.json`의 `registrationState`에 `registered`(기본) → `unregistered` → `deleting` → `deleted`로 기록한다. 작업 사유·시각·수정 번호를 남기며 상태 검사는 활성화·발행·관측과 같은 저장소 잠금 안에서 수행한다. 배포 정보는 삭제 후에도 `catalog.json`에 이력으로 남고, 신규 선택 목록에서 제외한다. 등록 해제된 배포 ID는 재발행으로 되살리지 않는다.

삭제는 먼저 `deleting` 의도를 기록한 뒤 디렉터리를 비공개 `.deletion-work/<id>`로 옮기고 실제 제거한다. 최종 제거가 끝난 뒤에만 `deleted`를 기록한다. 오류나 프로세스 중단 뒤에는 상태·조건을 재검사하고 명시적으로 재시도할 수 있다. 저장 경로·대상 디렉터리의 심볼릭 링크는 거절한다. 운영용 사용자 인증이나 완전한 감사 로그는 별도 범위다.

롤백 보호 해제 기록은 `composition-retirement.json`에 보관한다. 기록 파일은 정적 공개 경로에서 제공하지 않는다. 등록 해제·보관 해제는 자동으로 파일 삭제를 실행하지 않는다. 현재 구현은 로컬 파일 저장소이며 S3/CDN 제거·캐시 회수는 포함하지 않는다.

`npm run test:retirement`는 기존 빌드와 SDK·B·D 검증의 보존 산출물을 새 임시 저장소에 발행해 실제 UI/API/CLI 경로를 확인한다. 실제 파일 삭제·404, 사용 중인 탭·롤백·고정 참조·응답 끊김 차단, 확인 뒤 새로 들어온 탭 보고의 차단, 미완료 삭제 재시도와 원본 저장소 보존을 검사한다. 기간 경과는 임시 메타데이터의 과거 시각으로 준비하며 운영 서버에 시계 우회 옵션을 추가하지 않는다. 고정 참조·경로·재시도 프로브는 실행 코드 호환성 검증이 아닌 저장소 동작 검증이다. 먼저 `npm test` 또는 SDK·B·D 교체 검사를 실행한다.

## 응답 없는 탭의 사용 기한과 명시적 정리

새 Shell은 서버가 먼저 주입한 `/runtime-lease.js`와 협력한다. SDK 로딩 전에 `start(compositionId)`를 기다리며 `getArtifactContainer`, container의 `get`·`init`, 반환된 모듈 factory가 `ensureActive()`를 확인한다. 이전 Shell은 기존 관측만 하며 같은 탭에 관측 ID를 중복 생성하지 않는다. 초기 기한 발급 실패 시 서비스 remote를 시작하지 않는다. 도입에는 Shell 1회 빌드가 필요하며 SDK·A·B·C·D 번들은 그대로 사용한다. 별도 4180 개발 서버는 이 호스트 보호 범위가 아니다.

`POST /api/runtime/usage`의 새 형식은 기존 보고에 `protocol: "lease-v1"`을 추가하고 첫 요청은 `event: "open"`이다. 서버가 5분 기한을 발급하고 15초 heartbeat마다 갱신한다. 응답의 `leaseExpiresAt`, `serverTime`으로 클라이언트 기한을 계산한다. 요청 시작 시각을 기준으로 5초 여유를 빼서 느린 응답이 기한을 늘리지 않게 하고, wall clock과 monotonic clock을 함께 검사한다. 시계 조작을 방어하는 보안 경계는 아니다. 서버 재시작 뒤 토큰은 다시 얻지만 기한은 저장된 서버 값을 기준으로 한다.

기한 안의 네트워크 장애는 현재 입력을 유지한다. 만료 시 화면을 잠그고 새 fetch/XHR와 Shell 로더를 막는다. `resume`, BFCache `pageshow`, 다시 보이는 `visibilitychange`, `online`에서 서버 재확인 전 조작을 막는다. 만료·정리된 ID는 갱신을 거절하고 최신 화면을 열어 새 ID를 받아야 한다. 자동 새로고침으로 미저장 입력을 버리지 않는다.

관리 화면 **응답 없는 탭 정리** → 전체 탭 ID·사유 확인 → 실행. `POST /api/admin/sessions/release`에는 `{sessionId, expectedSequence, expectedLeaseExpiresAt, confirmationId, reason}`을 보낸다. 서버는 같은 저장소 잠금 안에서 재개 보호 프로토콜, 만료 후 24시간, 변경되지 않은 응답 기록을 재검사한다. 갱신 중인 탭·기존 보호 없는 탭·이미 종료/정리한 탭은 거절한다. 참조 해제는 탭이 사용한 전체 조합에 적용한다. `releasedAt`·`releaseReason`과 원래 조합·응답 기록을 보존하고 지연 보고로 부활시키지 않는다.

정리만으로 파일은 삭제하지 않는다. 정리 시각도 보존 기간의 시작 후보에 포함해 최소 30일 더 보관한다. 다른 탭·현재 조합·롤백·고정 참조가 남으면 계속 삭제를 막는다. 보호 없는 탭을 기한 만료로 간주하는 우회는 제공하지 않으며 아래의 문서 전환 또는 접근 종료 절차를 사용한다.

사용 기한은 협력하는 Shell·서비스의 수명 관리 계약이다. 임의의 window/DOM 조작, 별도 Worker·WebSocket, 이미 전송한 업무 요청을 회수하는 보안 격리는 아니다. 실제 업무 API에는 별도 인증과 필요 시 서버 측 세션/세대 검사가 필요하다. 관측 밖 사용의 부재를 증명하지 않는다. 구형 탭의 별도 전환과 파일 접근 차단은 다음과 같다.

`npm run test:sessions`는 실제 브라우저/API로 발급·갱신, 짧은 끊김 복구, 장기 오프라인 조작·로딩 차단, Chrome freeze/resume, 구형 탭 보호, UI 정리, 정리 후 정상 탭·롤백 차단, 기간 후 실제 삭제·404, 구형 탭 재접속·최신 조합 이동, 재시작과 모바일을 확인한다. 시간이 필요한 경우 브라우저 시계와 임시 저장소 시각을 사용하며 24시간/30일을 실제로 기다린 검사는 아니다. 결과는 `artifacts/verification/sessions.json`이다.

## 구형 탭 전환과 버전별 접근 종료

관리 화면의 **구형 탭 전환 · 접근 종료**를 사용한다. 기존 `usage-client.js`는 서버 응답의 명령을 읽지 않으므로 해당 코드를 수정하면 이미 열린 탭도 바뀐다고 가정하지 않는다. 관리 화면의 연결 버튼은 `/transition-worker.js`를 동일 출처의 `/` 범위에 등록한다. 기존 다른 worker는 덮어쓰지 않는다. worker는 캐시를 사용하지 않으며 `clients.claim()`으로 같은 브라우저·프로필의 열린 탭을 제어한다. usage 요청에 브라우저 client ID를 붙여 중계가 관측됐는지 표시한다. 다른 브라우저에는 설치되지 않는다.

- `POST /api/admin/sessions/transition`: `{sessionId, expectedSequence, confirmationId, reason, unsavedInputAcknowledged:true}`. 열린 구형 탭에 24시간 유효한 요청을 기록한다. 최신 응답과 대상 확인, 출처·관리 토큰 검사를 적용한다. 완료 전에는 보호 참조가 남는다.
- worker는 해당 탭의 다음 usage 응답에서 서버의 제한된 `/legacy-transition/<ticket>` 경로만 허용하고 `WindowClient.navigate()`를 호출한다. 명령을 읽지 않는 원래 추적 코드에도 적용된다. 사용자의 미저장 입력은 사라질 수 있어 요청 전 안내와 확인이 필요하다.
- 새 문서의 `/transition-page.js`가 `POST /api/runtime/transition-confirm`으로 일회성 ticket과 출처 토큰을 보내면 `transition.confirmedAt`, `releasedAt`, 사유를 저장한다. 확인은 멱등이며 이전 문서의 close beacon과 별개다. 확인 실패는 완료로 표시하지 않고 같은 전환 문서에서 재시도할 수 있다. 확인 후 현재 서비스 화면으로 이동한다. 이는 새 서비스 전체의 건강 검사가 아니다.
- ticket은 관리 조회에 노출하지 않는다. 중계가 없는 브라우저는 요청을 무시하므로 계속 대기이며, 수동 새로고침 또는 그 브라우저의 중계 설치가 필요하다. 만료된 미완료 요청은 다시 요청할 수 있다.

장기 미응답 탭은 실제 버전 제공을 종료하고 **선택한 버전만** 참조 해제한다.

- `POST /api/admin/releases/revoke-access`: 배포물 제거와 같은 `{artifactId, expectedCompositionId, expectedRevision, confirmationId, reason}` 및 `serviceInterruptionAcknowledged:true`, `externalUsageChecked:true`. 등록 해제, 현재 미사용, 롤백·고정 참조 없음, 미정리 보호 탭 없음, 구형 탭 응답 24시간 이상 없음이 필요하다. 조건을 같은 저장소 잠금에서 다시 읽는다.
- `lifecycle.json`에 `accessRevokedAt`·사유를 기록한다. 파일은 남지만 정규화된 해당 배포 ID의 모든 파일 요청은 `410`과 `X-MFE-Transition: required`를 반환한다. 파일 삭제 후에도 제공 종료 응답이 유지된다. 중계가 연결된 요청 탭은 안내 문서로 이동하고, 중계 없는 브라우저도 서버의 파일은 받을 수 없다.
- `POST /api/admin/sessions/release-legacy`: `{artifactId, sessionId, expectedSequence, expectedAccessRevokedAt, confirmationId, reason}`. 해당 버전을 실제 참조하는 구형 탭에만 적용한다. 접근 종료 후 24시간이 필요하며 `usage.json.sessions[id].legacyReleases[artifactId]`에 시각·사유·접근 종료 시각을 남긴다. 다른 버전의 참조는 건드리지 않는다.
- 지연 응답은 원래 조합과 응답 기록을 갱신하지만 정리된 버전의 보호 참조와 보존 기준을 부활시키지 않는다. 다른 버전은 계속 보호한다. 접근 종료와 참조 정리도 30일 보존 시작 기준에 포함하며 기존 삭제 조건을 모두 재검사한다.

접근 종료는 탭의 사망을 증명하는 기능이 아니라 제공 종료의 운영 결정이다. 이 로컬 호스트의 파일 경로만 제어하고 이미 다운로드한 코드·별도 Worker·WebSocket·업무 API·S3/CDN·다른 호스트는 회수하지 않는다. 필요 시 외부 세션/세대·권한을 별도로 종료해야 한다. 로컬 관리 토큰과 동일 출처 검사는 운영 사용자 인증이나 원격 브라우저의 암호학적 실행 증명이 아니다.

`npm run test:legacy`는 원본 저장소에 보존된 실제 `shell_1_0_0_a79c427e3f86`과 고정한 도입 전 추적 스크립트를 사용한다. 소비자를 재빌드하지 않는다. 중계 도입 전부터 열어 둔 탭의 전환, close beacon 유실, 확인 실패·재시도, 다른 브라우저의 대기, 정상 탭·롤백·고정 참조 차단, 실제 파일 제공 중단, 버전별 참조 격리, 기간 후 실제 삭제, 구형 탭 복귀와 모바일·재시작 보존을 검사한다. 기간은 임시 메타데이터로 재현한다. 결과는 `artifacts/verification/legacy.json`이다.


## 서비스 단독 개발 키트

`npm run prepare:dev -- SDK_ARTIFACT_ID`는 발행된 SDK 1.2.0 이상과 현재 A/C 경로의 B/D를 UI 서비스의 `dev/`에 복사한다. `dev/manifest.json`에 배포 ID·바인딩·파일 SHA-256을 기록한다. 서비스 빌드·제품 활성화는 하지 않는다. 생성된 키트를 포함한 각 프로젝트는 `npm ci`, `npm run dev`로 단독 실행한다. 키트 갱신은 플랫폼 담당 작업이며 중앙 다운로드 API는 아직 없다.

`npm run test:dev`는 네 UI 프로젝트를 각각 다른 임시 폴더에 복사해 오프라인 설치하고, 프로젝트의 서버 외 HTTP 요청을 차단한 실제 브라우저로 실행한다. SDK의 MF 요청·React 공유, 사용자/테마, 복제·정리, 저장 후 재빌드, 오류 복구, 서비스의 PageContainer import, 부적합 매니페스트 거절, 모바일·제품 출력 분리를 검사한다. 결과는 `artifacts/verification/development.json`이며 `npm test`에도 포함한다.

개발 키트는 운영 탭 사용 추적·사용 기한 보호와 별개다. 이미 복사한 파일은 제품의 접근 종료로 회수되지 않는다. DB 도입 후 키트 공급 API를 연결하는 방안은 [등록부 DB 설계안](../docs/mfe-registry-db-design.html)에 정리했다. DB 이관 자체는 미구현이다.

## SDK만 교체해 RemoteRegion 정책 바꾸기

```sh
npm run test:region-sdk
npm run demo:region-sdk
```

2026-11-08 **18/18 통과**. `tests/remote-region-sdk-upgrade.mjs`는 이미 빌드한 이전 중첩 시나리오를 복사하고 SDK 1.3.0 탭을 먼저 연다. **실행한 빌드는 platform-sdk의 npm run build 하나뿐**이다. 새 SDK 1.3.1만 발행·선택하고 A/C/B/D/Shell의 배포 ID·파일 해시·연결과 원본/보존 소비자 프로젝트의 파일 해시·수정 시각을 비교한다.

C/B 2.1/D 2.0의 진입 파일·청크 여섯 경우에 실제 503을 주입한다. 새 SDK에서는 재시도 클릭 → 503 → 500ms 뒤 후속 요청 200으로 회복한다. A의 직접 B 1.4 DOM·입력·카운터·캐시·팝업·구독 유지와 새로고침 없음을 검증한다. 기존 탭은 1.3.0을 유지해 같은 D 진입 파일 실패에서 두 번의 클릭이 필요하다. 지속 장애의 최대 두 번 시도, 두 영역의 공유, 대기 중 제거, 없는 공개 모듈의 자동 반복 제외, 기존 빈 탭의 늦은 A 로딩, 롤백까지 포함한다.

전제는 `artifacts/remote-region-sdk-upgrade/baseline.json`이 지정한 **SDK 1.3.0 시점 보존본**과 이미 설치된 SDK/integration 의존성이다. 보존본이 없으면 복원해야 한다. 이 검사가 서비스를 새로 빌드해 대체하지는 않는다. `test:nested`는 A/C/B를 빌드하는 별도 검사이므로 재빌드 없음의 근거로 혼용하지 않는다.

결과: `artifacts/verification/remote-region-sdk-upgrade.json`. 성공하면 `artifacts/remote-region-sdk-upgrade/latest.json`에 시연 폴더를 기록한다. 그 아래 `store/`에 두 SDK와 두 조합을 보관하고 `scenario.json`에 교체 전후와 SDK만 빌드한 사실을 기록한다. main artifact-store의 활성 조합은 그대로다.

`demo:region-sdk`는 이 저장소로 4175 서버를 띄우고 새 SDK 주소와 이전 고정 조합 주소를 출력한다. 실제 장애는 테스트에서만 주입하므로 일반 시연은 정상 동작한다. [HTML 상세 설명](../docs/mfe-runtime-operations.html#sdk-region-upgrade).

## 새 서비스 팀의 온보딩 검증

`npm run prepare:onboarding -- /absolute/path/new-folder`는 처음 받는 팀에 줄 service-e 시작 프로젝트를 준비한다. 대상은 없어야 한다. 기본 발행 저장소와 이미 빌드된 SDK 1.3.1 dist, 플랫폼 빌드 도구 1.7.0 소스가 전제다. starter에는 src·MF 설정·개발 설정·도구 tarball·발행 SDK MF 키트·lockfile이 들어간다. SDK를 빌드하거나 원본 프로젝트를 바꾸지는 않는다. 함께 만든 store와 shell은 실습용 복사본이다. SDK 외 업무 의존성까지 자동 구성하는 범용 생성기는 아니다.

[HTML 실습](../docs/mfe-project-handbook.html#new-service-walkthrough)의 0~5단계는 새 프로젝트 생성·SDK 연결·독립 실행·발행이다. 이후 기본 연결 방법은 [서비스·메뉴 등록](../docs/mfe-project-handbook.html#registered-services)이다. 접힌 6~9단계와 test:onboarding은 과거 Shell e 고정 배치의 참고 검증이다. 새 서비스마다 그 Shell 수정 코드를 적용하지 않는다.

`npm run test:onboarding`은 HTML의 onboard-* 명령 블록을 읽어 실행한다. 별도 임시 프로젝트에서 오프라인 npm 설치, 외부 HTTP를 막은 단독 개발, 실제 SDK MF/Context 공유, 소스 저장 갱신, 제품 빌드·CLI 발행·Shell 연결, 미연결 거절, A/C 동시 실행, 롤백·기존 탭 상태 보존을 검증한다. SDK 프로젝트 dist가 1.3.1이어야 하며 준비된 npm 캐시(`/private/tmp/mfe-npm-cache`, NPM_CACHE로 변경)와 Chrome이 필요하다. 2026-11-08 **12/12 통과**. 전체 과거 회귀를 재실행한 결과와 구분한다.

결과는 artifacts/verification/onboarding.json에 기록한다. artifacts/onboarding-demo/latest.json이 가리키는 폴더의 team-e/service-e는 실제 완성한 독립 프로젝트, starter는 수정 전 키트, shell은 연결한 Shell 복사본, store는 실행 조합이다. node_modules·.mfe-dev는 제외한다. `npm run demo:onboarding`은 이를 4176에서 제공한다. 기존 제품 저장소의 선택은 유지한다. 실제 S3/CDN 업로드·서비스 팀 CI·운영 인증은 이 실습 범위 밖이다.

## 서비스와 메뉴 등록 (현재 기본 연결)

- `npm run test:navigation`: 독립 저장소와 실제 Chrome에서 E 등록 후 F 프로젝트를 생성·빌드·발행하고 같은 Shell에 연결한다. **16/16 통과**. 최초 등록형 Shell/Admin 준비 이후 F만 빌드한다. 기존 프로젝트 전체 파일과 Shell 발행 파일의 해시·수정 시각, 원본 current.json을 비교한다.
- `npm run demo:navigation`: 보존 결과를 4177에서 제공한다. `/admin#services`에서 메뉴를 편집하고 `/`를 새 탭으로 열어 확인한다. `artifacts/navigation-demo/latest.json`의 store와 service-f, scenario.json을 사용한다.
- 준비: 기본 artifact-store, `onboarding-demo/latest.json`의 E 보존본, 미리 빌드한 Shell 1.2.0·Admin 1.1.0·SDK 1.3.1 dist, Shell vendor의 도구 1.7.0, Chrome, `/private/tmp/mfe-npm-cache`. F는 빌드·등록 검증용이며 단독 개발 시 SDK/D 키트가 추가로 필요하다.

관리 API preview/apply 요청에 `navigation: [{id,label,path,artifactId,exposedModule}]`을 포함한다. 생략은 기존 목록 유지, 빈 배열은 전체 메뉴 제거다. 서버가 `runtimeBindings[shellId]["menu/"+id]`를 생성한다. 원래 selected 역할(platform/shell/A/C)은 유지한다. 메뉴 페이지와 하위 의존성도 graph/SDK/React/cycle 검사와 사용 추적에 포함한다. snapshot에 navigation이 없던 옛 조합은 그대로 유지하며 rollback은 저장된 메뉴 목록을 정확히 복원한다.

메뉴 ID·주소 중복, 잘못된 대상·공개 모듈, 누락된 하위 연결, 종료/등록 해제 배포물 신규 사용은 거절한다. 현재의 종료 버전을 같은 메뉴/모듈로 유지할 수 있지만 새 메뉴 별칭이나 모듈로 우회해 참조를 늘릴 수 없다. 메뉴 제거는 배포 등록 해제나 파일 삭제가 아니다. 기존 탭과 rollback 참조가 삭제를 막는다.

소스: `tools/navigation.cjs`, `store.cjs`, `admin-api.cjs`, `lifecycle.cjs`, `projects/shell/src/RegisteredPages.jsx`, `projects/platform-admin/src/ServiceMenus.jsx`. 기존 SDK RemoteRegion을 그대로 사용한다. 관리·사용 추적·삭제 회귀 12/14/18개도 통과했다. [HTML 절차](../docs/mfe-project-handbook.html#registered-services) · [실제 결과](artifacts/verification/navigation.json).

## 공개 위젯 대시보드

`npm run test:dashboard`는 실제 Chrome → 관리 API → 조합 파일 → MF 위젯 실행까지 검사한다. **17/17 통과**. 독립 B 1.4/B 2.1 복사본에 widgets 선언을 넣어 빌드·발행하고, 배치 적용 뒤 새 E 프로젝트를 빌드·발행해 같은 Shell에 추가한다. 선언된 위젯만 선택 가능하며 helper 모듈은 제외한다. 같은 위젯 복제/다른 모듈/다른 B 버전을 함께 실행한다. Shell/SDK/원본 업무 서비스는 배치 변경 중 빌드하지 않는다. 기존 메뉴 16개와 삭제 보호 18개, 위젯 선언을 넣은 시작 프로젝트 따라하기 12개도 회귀 통과했다.

`npm run demo:dashboard`는 보존 결과를 4178에서 제공한다. `/admin#dashboard`, `/` 또는 `/#/dashboard`를 연다. `artifacts/dashboard-demo/latest.json`의 디렉터리 아래 service-b-v1, service-b-v2, service-e, store, scenario.json을 보존한다. E는 제품 빌드 검증용이며 단독 개발에는 SDK 키트가 필요하다. B는 복사한 개발 키트를 유지한다.

준비: 기본 artifact-store(기본 A/C 경로와 D 1/2), 원본 B 1.4/2.1 프로젝트, 빌드된 Shell 1.3.0·Admin 1.2.0·SDK 1.3.1 dist, Shell vendor의 도구 1.7.0, Chrome, `/private/tmp/mfe-npm-cache`. 전체 npm test에 자동 합치지 않은 별도 시나리오이며 임시 저장소에서 실행한다.

배포 정보의 `widgets: [{id,title,exposedModule,contract:'platform-widget-v1'}]`가 공개 목록이다. preview/apply의 `dashboard: [{id,title,artifactId,widgetId,span}]` 배열 순서가 표시 순서, span은 1 또는 2다. 최대 24개. 동일 widgetId를 여러 배치 ID로 복제할 수 있다. 서버가 `runtimeBindings[shellId]['dashboard/'+placementId]`를 생성한다. 하위 의존성·SDK·React·순환·지원 종료 검사는 메뉴/기존 경로와 같다. 같은 배포 ID의 하위 버전 선택은 모든 사용처가 공유한다.

요청에서 dashboard 생략은 기존 설정 유지, `[]`는 명시적 빈 대시보드다. 과거 dashboard 필드가 없던 조합을 복원할 때 서버 내부는 `null`로 미설정 상태를 명시한다(관리 UI의 빈 배치 버튼과 다름). 옛 조합 ID와 HTML도 그대로 재사용할 수 있다. 변경은 새 immutable composition으로 저장한다. 메뉴/SDK/하위 선택을 바꿀 때도 dashboard가 함께 보존되고, rollback에는 배치 순서·너비·제목·위젯 버전이 포함된다.

현재 사용 추적에는 `dashboard/배치ID:위젯ID:모듈` 경로를 포함한다. 종료 버전의 동일 배치 제목/너비/순서 편집은 기존 사용이지만, 배치 추가나 위젯 ID 교체는 신규 사용으로 거절한다. 메뉴·롤백·기존 탭이 남으면 위젯 제거 후에도 파일 삭제를 차단한다.

[전체 사용법](../docs/mfe-project-handbook.html#dashboard-widgets) · [검증 기록](artifacts/verification/dashboard.json). 코드: tools/dashboard.cjs, store.cjs, admin-api.cjs, lifecycle.cjs, projects/platform-build-tools/lib/widgets.cjs, projects/platform-admin/src/DashboardEditor.jsx, projects/shell/src/RegisteredDashboard.jsx. 기존 SDK RemoteRegion으로 실패 격리/수동 재시도를 제공하며 임의 실행 코드의 보안 격리는 아니다.
