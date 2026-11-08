**플랫폼 Shell 1.0.0**

## 이 프로젝트를 처음 열었다면

[HTML 개발 안내서](../../docs/mfe-project-handbook.html#project-shell) · [실행·발행 순서](../../docs/mfe-project-handbook.html#workflow) · [플랫폼 제공 목록](../../docs/mfe-project-handbook.html#platform)

- 담당: 플랫폼 팀.
- 목적: 헤더·사이드바를 한 번 그리고, 사용할 조합을 고정한 뒤 각 서비스 화면을 연결합니다.
- 사용: 브라우저가 Shell의 HTML·진입 코드를 먼저 실행합니다. 이 예제에서 Shell 자체는 다른 앱이 import하는 Remote가 아니라 호스트 진입점입니다. SDK와 서비스는 MF로 로드합니다.
- 수정 시점: 공통 화면·진입 순서·로더를 바꿀 때 수정합니다. 호환 SDK/B/D 선택이나 등록된 페이지 메뉴를 추가·편집할 때는 Shell을 빌드하지 않습니다.

| 주요 파일 | 역할 |
| --- | --- |
| [src/index.js](src/index.js) | 조합 조회 → Shell ID 일치 검사 → 탭 보호 시작 → 런타임 설치 → bootstrap 순서. |
| [src/runtime.js](src/runtime.js) | 고정된 조합에서 SDK·소비자별 의존성을 찾고 container를 로드합니다. 중복 로드·시간 제한·기한 검사를 처리합니다. |
| [src/loader.js](src/loader.js) | 배포물의 ./Widget 모듈을 가져오고 배포 ID + 노출 모듈별로 결과를 캐시합니다. |
| [src/bootstrap.jsx](src/bootstrap.jsx) | React 시작, PlatformProvider, 헤더·사이드바, A/C 위젯 배치, 위젯별 오류 화면. 현재 대시보드도 여기에 있습니다. |
| [src/shell.css](src/shell.css) | 제품 Shell의 공통 화면 스타일. 서비스 내부 스타일은 각 서비스가 관리합니다. |
| [src/index.html](src/index.html) | root 요소와 __SHELL_SCRIPT__ 진입점 자리를 가진 HTML 원본. |

공통 `mf.config.cjs`, `mf.dependencies.json`, `vendor/`, `dist/release.json`의 의미는 [폴더·설정 안내](../../docs/mfe-project-handbook.html#files)를 참고합니다.

---

헤더·사이드바와 위젯 배치를 관리하고, 런타임 `registry.json`이 선택한 A/C의 독립 MF 산출물을 조합합니다. A/C의 소스를 Shell 빌드에 포함하지 않습니다.

Node.js 22.9 이상이 필요하며 24를 권장합니다. 이 디렉터리에서 실행합니다.

```sh
npm ci
npm run build
npm start
```

자체 `package.json`, `package-lock.json`, `mf.config.cjs`, `mf.dependencies.json`, `vendor/`로 독립 설치·빌드합니다. `vendor/`의 npm tarball은 빌드 도구만 제공하며, 공통 런타임 SDK는 `platform/sdk` MF 모듈로 로드합니다. `mf.dependencies.json`의 `platform` 별칭에 런타임 모드와 지원 SDK 범위를 선언합니다. 진입점에서 시작 설정을 한 번 읽고 동일 SDK를 선택한 뒤 화면을 시작합니다. A/C 선택은 실행 시 읽는 등록부에서 관리합니다.

빌드 결과와 발행 메타데이터는 `dist/`, `dist/release.json`입니다. `npm start`는 기본 `http://127.0.0.1:4180`에서 Shell 화면과 자신의 산출물을 제공합니다. 다른 Remote와 등록부 요청은 `MF_REMOTE_ORIGIN`으로 전달하며 기본값은 `http://127.0.0.1:4173`입니다. 해당 upstream에 등록부와 고정된 Remote 산출물이 준비되어 있어야 전체 화면이 동작합니다.

다른 산출물 서버를 사용할 때는 다음과 같이 실행합니다.

```sh
MF_REMOTE_ORIGIN=http://127.0.0.1:4300 npm start
```

이것은 이미 빌드된 산출물의 미리보기 서버입니다. 소스를 변경했다면 `npm run build`를 다시 실행합니다. A/C 등의 Remote 프로젝트에서 실행하는 `npm start`는 독립 UI가 아니라 release 메타데이터와 산출물을 제공한다는 점이 다릅니다.

업무 의존성은 `getDependencyContainer(consumerArtifactId, alias)`로 조회합니다. A·C별 B 선택은 조합의 `runtimeBindings`에 저장합니다. 실행 중에는 같은 조합을 유지하고, 변경된 선택은 새로 진입한 문서에 적용합니다.

B → D도 같은 소비자별 로더로 연결합니다. 조합은 A·C의 B 선택과 각 B의 D 선택을 함께 포함하며, 새 화면을 시작할 때 전체 그래프를 고정합니다.
# 탭 사용 기한 보호

로컬 통합 호스트에서 주입한 `__MFE_TAB_GUARD__`가 있으면 SDK와 위젯을 시작하기 전에 사용 기한을 발급받는다. 로더 진입, container get/init, 반환된 factory 실행마다 기한을 확인한다. 만료 후에는 캐시된 모듈도 이 경로로 새로 실행할 수 없다. 호스트가 보호 필수라고 표시했는데 스크립트가 없으면 시작하지 않는다.

정상 탭은 갱신으로 계속 보호한다. 만료된 화면은 입력과 기존 DOM을 남긴 채 잠그며 사용자가 최신 화면을 열어 전환한다. 이 기능은 Shell 도입 빌드가 한 번 필요하다. SDK·A·B·C·D의 재빌드는 필요하지 않다. 기존 Shell과 이미 열어 둔 탭은 시간만으로 정리하지 않는다. 단독 개발 서버의 비보호 화면에는 사용 기한 기록이 발급되지 않는다.


## 등록형 서비스 메뉴 (1.2.0)

등록형 Shell을 최초 한 번 선택한 뒤 새 업무 페이지는 관리 화면 `/admin#services`에서 추가한다. 이 Shell은 SDK `>=1.3.0 <2.0.0`의 RemoteRegion을 사용한다. mf.config의 `navigationProtocol: registered-menu-v1`은 프로젝트 전용 능력 표시이며 빌드 도구 1.6.0이 release.json에 기록한다.

- `RegisteredPages.jsx`: snapshot.navigation에 맞는 hash 주소의 페이지를 지연 로드한다. 방문한 페이지는 숨겨 상태를 보존한다. 따라서 숨긴 페이지의 구독/효과는 계속 실행될 수 있다.
- `runtime.js`: 서버가 만든 `menu/<id>` 연결을 해석하고 SDK의 공통 loader로 같은 배포물을 가져온다.
- `bootstrap.jsx`: 공통 Provider·헤더·사이드바와 메뉴 링크, 기존 A/C 검증 화면을 구성한다. 모바일에서도 메뉴를 제공한다.

서비스마다 mf.dependencies 또는 import를 추가하지 않는다. 메뉴는 정확한 artifact ID와 공개 모듈을 선택하며 Shell은 공통 instanceId만 전달한다. 다른 업무 입력이 필요한 페이지는 자체 조회/공통 Context 또는 별도로 합의한 호스트 계약이 필요하다. 파일만 발행하면 자동 표시되는 것은 아니며 메뉴 등록·검사·적용이 필요하다.

새 탭은 새 목록, 기존 탭은 시작한 목록을 유지한다. 메뉴 제거는 파일 삭제가 아니며 rollback은 목록도 복원한다. 현재 범위는 한 단계 hash 경로·최대 50개 페이지이고 대시보드 위젯 편집기는 별도다. [사용 절차·16개 검증](../../docs/mfe-project-handbook.html#registered-services).

## 등록형 대시보드 (1.3.0)

`RegisteredDashboard.jsx`가 조합의 dashboard 배열 순서·span(1/2)에 따라 공개 위젯을 표시한다. Shell은 기존 SDK RemoteRegion을 사용하고 공통 instanceId만 전달한다. runtime.js는 dashboard/배치ID 연결을 해석한다. 서비스별 import나 mf.dependencies 선언을 추가하지 않는다.

mf.config.cjs의 dashboardProtocol: registered-dashboard-v1은 빌드 도구 1.7.0이 release.json에 기록한다. 최초 지원 Shell 도입 뒤에는 관리 화면 `/admin#dashboard`에서 위젯·버전·순서·너비를 바꾼다. 배치가 설정된 조합의 `/`는 대시보드이며 `/#/dashboard`로도 연다. 기존 A/C 검증은 `/#/verification`에 남는다. 미설정인 과거 조합에서는 `/`의 기존 동작을 보존한다.

처음 진입한 대시보드와 페이지는 이후 숨겨 보존하며 위젯 상태·내부 portal도 같이 숨긴다. 업무 구독과 작업은 계속 실행될 수 있다. 적용은 새 탭부터이며 기존 탭을 실시간 재배치하지 않는다. 빈 배열은 명시적으로 빈 대시보드이며 과거 필드 미존재와 구분한다. 기존 SDK/React 공유·사용 기한 보호·오류 격리/재시도를 사용한다.

최대 24개, 2열의 순서·너비 설정이며 900px 이하 한 열이다. 자유 좌표 드래그·개인별 배치는 구현하지 않았다. [공개 위젯 계약과 검증](../../docs/mfe-project-handbook.html#dashboard-widgets).
