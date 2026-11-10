# @mfe/platform-build-tools

서비스별 독립 설치·빌드·개발 서버를 제공하는 npm 도구입니다. **2.0.0부터 Vite 8.3.6과 Module Federation 공식 플러그인 `@module-federation/vite` 1.23.11을 사용합니다.** 활성 프로젝트의 컴파일러에 Webpack·Babel을 사용하지 않습니다. Node.js 22.12 이상이 필요하며 24를 권장합니다.

서비스는 이 도구의 tarball을 자기 프로젝트의 `devDependencies`에 설치합니다. 공통 런타임 SDK는 이 npm 패키지에 포함하지 않고 `platform/sdk` MF 모듈로 별도 로드합니다. 다른 서비스의 소스나 루트 workspace는 필요하지 않습니다.

## 파일과 명령

| 파일 | 역할 |
| --- | --- |
| `bin/mfe-build.cjs`, `lib/build.cjs` | Vite Federation 빌드, React 공유, CSS Modules, 프로젝트 경계 검사, 배포 정보 생성 |
| `lib/project.cjs` | 설정 검증, 소스 해시와 배포 ID 생성, 고정·런타임 의존성 해석 |
| `bin/mfe-dev.cjs`, `browser/` | 발행된 SDK·의존성 키트를 사용하는 서비스 단독 개발 Host |
| `lib/dev-manifest.cjs` | 개발 키트의 파일 해시·버전·의존 그래프 검증 |
| `bin/mfe-serve.cjs` | 빌드한 배포물 미리보기 |
| `lib/widgets.cjs` | 공개 위젯 카탈로그 검증 |

배포되는 디렉터리는 `bin/`, `lib/`, `browser/`, `runtime/`입니다.

## 서비스 설정

각 프로젝트에 다음 입력이 필요합니다.

- 자체 `package.json`, `package-lock.json`, 설치된 `node_modules/`
- `mf.config.cjs`, `mf.dependencies.json`
- 진입점과 공개 모듈을 포함한 자체 `src/`

```js
// mf.config.cjs
module.exports = {
  service: 'b',
  kind: 'remote',
  exposes: { './Widget': './src/Widget.jsx' },
  port: 4203,
};
```

Shell은 `kind: 'shell'`, `entry: './src/index.js'`, `html: './src/index.html'`을 선언합니다. HTML의 스크립트 경로에는 `__SHELL_SCRIPT__`를 넣고 ES 모듈로 실행합니다. 서비스 식별자는 영문자로 시작하고 영문자·숫자·밑줄·하이픈을 사용합니다.

`mf.dependencies.json`은 별칭을 고정 배포 정보 또는 런타임 지원 범위에 연결합니다.

```json
{
  "platform": { "mode": "runtime", "service": "platform", "requires": ">=1.3.0 <2.0.0" },
  "d": { "mode": "runtime", "service": "d", "requires": ">=2.0.0 <3.0.0" }
}
```

소스의 `platform/sdk`, `d/data`, `b/Widget` 같은 import는 유지합니다. 빌드 중 원격 서비스 파일을 내려받지 않습니다. 런타임에서 고정 조합의 `runtimeBindings[소비자 배포 ID][별칭]`으로 실제 대상을 정합니다. 같은 페이지의 A와 C는 서로 다른 B 배포물을 사용할 수 있고, 각각의 B는 자기 D를 선택합니다. SDK는 페이지 전체가 하나의 선택을 공유합니다.

## 빌드와 배포 정보

서비스 디렉터리에서 `npm run build` 또는 `mfe-build`를 실행하면 해당 프로젝트의 `dist/`만 생성합니다. Remote의 공개 진입점은 `remoteEntry.js`, Shell의 진입점은 `shell.js`이며, 브라우저가 네이티브 ES 모듈로 로드합니다. 실행 파일은 `/artifacts/<배포 ID>/` 아래에 배치합니다.

`release.json`에는 다음 정보를 기록합니다.

- `id`, `name`, `service`, `version`, `kind`, `entry`
- 고정 의존성 `dependencies`, SDK·React 요구 조건 `runtimeRequirements`
- 업무 의존성의 서비스·지원 범위 `runtimeDependencies`
- 모듈 형식 `format: "esm"`, 복구 프로토콜 `retryProtocol: "vite-preflight-v1"`
- 공개 모듈 목록 `exposedModules`, 공개 모듈별 실행 파일 `exposeChunks`, 원격 import 정보 `federationImports`·`exposeImports`
- 설정한 경우 메뉴·대시보드 프로토콜과 위젯 카탈로그

배포 ID는 `src/` 전체, package·잠금 파일, 두 MF 설정 파일, 빌드 도구 버전을 해시해 생성합니다. 프로젝트를 다른 절대 경로에 복사해도 입력이 같으면 같은 ID를 생성합니다. 선택된 런타임 B·D·SDK의 실제 ID는 소비자 빌드 입력에 넣지 않습니다.

각 프로젝트의 JavaScript import는 자체 `src/`와 자체 `node_modules/` 범위로 제한합니다. 다른 프로젝트 소스나 외부 소스를 가리키는 링크를 거절합니다. CSS Modules는 pure 모드로 전역 selector 유출을 검사하고 이름에 배포 ID를 포함하며, 일반 전역 CSS는 Shell에서만 사용합니다. 동적 import 변환은 구문 트리를 기준으로 수행하며 소스맵을 유지합니다. React와 React DOM은 도구의 자체 의존성이 아니며 서비스가 설치한 정확한 버전을 공통 singleton으로 공유합니다. 조합 검증은 SDK 지원 범위·React 버전·서비스 일치·누락·순환을 확인하며 업무 API의 의미적 호환성은 통합 검증합니다.

## 단독 개발과 미리보기

`mfe-dev`는 서비스의 `mf.dev.json`, `dev/manifest.json`, `dev/remotes/`를 읽어 개발 Host와 현재 서비스만 빌드합니다. SDK 구현을 복사하지 않고 발행된 `platform/sdk`에서 `PlatformProvider`, `DevLayout`, `PageContainer`를 로드합니다. 키트는 SDK·전이 의존성의 배포 ID와 파일 해시를 고정합니다.

개발 산출물은 `.mfe-dev/`에 보관하고 `dist/`는 변경하지 않습니다. 소스 저장 시 직렬 재빌드 후 전체 화면을 새로고침하며 입력 상태는 초기화됩니다. 빌드 오류가 나면 마지막 성공 화면에 오류를 표시합니다. 실행 중 이전 빌드 파일은 유지합니다. package·잠금 파일이나 npm 의존성을 바꾸면 개발 서버를 다시 시작합니다.

`mf.dev.json`의 `module`은 공개 React default export 이름입니다. `title`, `description`, `user`, `theme`은 개발 화면 설정이며 실제 인증 정보가 아닙니다. 서비스가 자체적으로 `PageContainer`를 사용하면 `pageContainer: false`를 지정합니다. 개발 키트 생성은 `integration`의 `npm run prepare:dev -- SDK_ID`를 사용합니다.

`mfe-serve`는 이미 빌드한 파일을 제공합니다. `PORT`는 설정 포트를 덮어쓰며 `HOST` 기본값은 `127.0.0.1`입니다. `/release.json`과 `/artifacts/<현재 ID>/...`를 제공하고 Shell은 조합·다른 배포물 요청을 `MF_REMOTE_ORIGIN`(기본 `http://127.0.0.1:4173`)으로 전달합니다. 자기 자신으로의 프록시는 거절합니다.

## 오류 격리와 재시도

서비스 팀은 선택된 SDK의 `RemoteRegion`을 사용해 원격 UI를 배치합니다. SDK가 로딩·오류 경계·버튼 재시도를 담당하고 런타임은 같은 고정 조합에서 실패한 영역의 의존 파일을 준비합니다. 정상 인스턴스의 상태·캐시·구독·Portal은 유지합니다. SDK 1.3.1의 지연 재시도 정책도 SDK의 책임입니다.

Vite 배포물은 `vite-preflight-v1` 프로토콜과 공개 모듈 이름을 사용합니다. 이전 Webpack 구현의 `require.cache`, `require.resolveWeak`, `webpack/container/remote/...`를 Vite 배포물에 적용하지 않습니다. 네트워크 파일 오류의 재시도와 임의 코드의 평가 부작용·업무 API 오류는 구분하며, 이미 실행한 코드를 완전히 unload하는 계약은 아닙니다.

## 메뉴와 공개 위젯

Shell의 `navigationProtocol: 'registered-menu-v1'`은 등록형 메뉴, `dashboardProtocol: 'registered-dashboard-v1'`은 등록형 대시보드 지원을 나타냅니다. 메뉴와 배치·실제 서비스 버전은 조합에 저장하므로 변경할 때 Shell을 재빌드하지 않습니다.

서비스는 `widgets: [{ id, title, exposedModule, contract: 'platform-widget-v1' }]`을 설정해 관리자가 선택할 공개 위젯만 선언합니다. 도구는 중복 ID·실제 exposes 포함 여부·계약 이름을 검사합니다. 일반 exposes에 있는 데이터 함수를 위젯으로 자동 등록하지 않습니다. React 컴포넌트와 공통 `instanceId`, SDK Context 동작은 실제 통합 화면에서 확인합니다.

## 도구 갱신과 과거 예제

저장소의 `integration`에서 다음 명령으로 현재 도구를 패키징하고 활성 서비스 프로젝트의 vendor·package·잠금 파일을 함께 갱신합니다.

```sh
npm run update:build-tools -- --install
```

`--install`을 생략하면 잠금 파일까지만 갱신하고 설치는 하지 않습니다. `--offline` 또는 `MFE_OFFLINE=1`은 준비된 npm 캐시를 사용합니다. 캐시 경로는 `MFE_NPM_CACHE` 또는 `NPM_CACHE`로 지정합니다. 이 명령은 서비스 자체를 빌드하거나 현재 조합을 바꾸지 않습니다. 일반 `build`는 기존 선택을 유지하고 `bootstrap`은 의도적인 최초 전체 선택에만 사용합니다.

`examples/01-*`부터 `20-*`는 Webpack 도구·실행 파일·seed-store·체크섬을 함께 보존한 과거 학습 스냅샷입니다. 이 갱신 명령은 예제 폴더를 수정하지 않습니다. 과거 HTML 설명서와 이전 날짜의 통과 기록은 당시 컴파일러의 결과이며, 현재 Vite 전환은 `integration`의 독립 빌드·서비스 공존·단독 개발·중첩 복구·SDK 교체·메뉴·대시보드 검사로 확인합니다.
