**플랫폼 SDK**

## 이 프로젝트를 처음 열었다면

[HTML 개발 안내서](../../docs/mfe-project-handbook.html#project-platform-sdk) · [실행·발행 순서](../../docs/mfe-project-handbook.html#workflow) · [플랫폼 제공 목록](../../docs/mfe-project-handbook.html#platform)

- 담당: 플랫폼 팀.
- 목적: 같은 화면의 서비스가 같은 Context와 인스턴스 관리 규칙을 사용하도록 제공합니다.
- 사용: 서비스는 mf.dependencies.json에 platform 지원 범위를 선언하고 platform/sdk를 import합니다. Shell이 선택한 SDK 하나를 MF로 가져옵니다.
- 수정 시점: 공통 Context·위젯 수명주기 API를 바꿀 때 수정합니다. 호환 변경이면 SDK만 빌드·발행하고 조합에서 선택합니다. 소비자의 지원 범위를 벗어나거나 API가 깨지면 소비자 수정이 필요합니다.

| 주요 파일 | 역할 |
| --- | --- |
| [src/sdk.jsx](src/sdk.jsx) | PlatformProvider/usePlatform, WidgetBoundary/useWidgetScope, 검증용 ReactIdentity·스냅샷·이벤트 함수. 현재 사용자와 테마는 데모 값입니다. |

공통 `mf.config.cjs`, `mf.dependencies.json`, `vendor/`, `dist/release.json`의 의미는 [폴더·설정 안내](../../docs/mfe-project-handbook.html#files)를 참고합니다.

---

공통 React Context, 인스턴스별 캐시·구독·Portal 수명주기를 `platform/sdk` MF 모듈로 제공합니다. 런타임 SDK는 npm 라이브러리가 아니라 별도 빌드·배포하는 Remote입니다.

Node.js 22.12 이상이 필요하며 24를 권장합니다. 이 디렉터리에서 실행합니다.

```sh
npm ci
npm run build
npm start
```

이 프로젝트는 자체 `package.json`, `package-lock.json`, `mf.config.cjs`, `mf.dependencies.json`, `vendor/`를 갖습니다. `vendor/`의 npm tarball은 빌드 도구이며, 형제 프로젝트의 소스나 루트 설치에 의존하지 않습니다. 현재 다른 MF 모듈에 대한 의존성은 없습니다.

빌드 결과는 `dist/`, 발행 메타데이터는 `dist/release.json`에 생성됩니다. `npm start`는 기본 `http://127.0.0.1:4200`에서 이 메타데이터와 `/artifacts/<id>/` 산출물을 제공합니다. 독립 UI를 실행하는 명령은 아닙니다. 사용 서비스는 `mf.dependencies.json`에 SDK 지원 범위를 선언하고, 브라우저에서 실행 조합이 선택한 SDK Remote를 공유합니다.

## SDK 1.2.0의 개발 Layout과 PageContainer

`platform/sdk`에서 `DevLayout`과 `PageContainer`를 MF로 내보냅니다. 스타일은 `src/Layout.module.css`에서 배포 ID별 CSS Modules로 분리합니다. `PlatformProvider`는 기존 기본값을 유지하며 선택적 `user`, `theme`을 받아 개발 환경 값을 공급할 수 있습니다. 실제 인증 기능은 아닙니다.

- `DevLayout({serviceName, tools, children})`: 개발용 헤더·사이드바와 하나의 main 영역. 운영 Shell을 대체하지 않습니다.
- `PageContainer({title, description, actions, children, width})`: 제목·설명·액션·공통 여백/최대 폭. width는 기본 standard 또는 wide. main을 추가하지 않는 section이며 컴포넌트마다 고유 제목 ID를 사용합니다.
- 위 API를 서비스 코드에서 직접 사용하면 `mf.dependencies.json`에 SDK `>=1.2.0 <2.0.0`을 선언합니다. 기존 1.0 지원 선언만으로 새 API의 존재를 보장할 수 없습니다.

서비스 개발 Host는 `PlatformProvider → DevLayout → PageContainer → 서비스` 순서로 렌더링합니다. 서비스가 자체 PageContainer를 쓰면 `mf.dev.json`의 `pageContainer`를 false로 둡니다. 실제 예시는 [개발 안내서](../../docs/mfe-project-handbook.html#dev-host)를 참고합니다.

## SDK 1.3.0의 공통 RemoteRegion

서비스는 오류 격리·로딩·재시도·실패 캐시 정리 코드를 복사하지 않습니다. `platform/sdk`를 MF로 import해 영역을 배치합니다. Shell이 모든 서비스에 같은 선택된 SDK와 PlatformProvider를 제공합니다.

```jsx
import { RemoteRegion } from 'platform/sdk';

<RemoteRegion
  consumerId={__ARTIFACT_ID__}
  alias="c"
  exposedModule="./Widget"
  instanceId={`${instanceId}--c`}
  label="C"
  componentProps={{ instanceId: `${instanceId}--c`, onMounted }}
/>
```

mf.dependencies.json에 SDK `>=1.3.0 <2.0.0`과 대상 c의 runtime 요구 범위를 선언합니다. consumerId는 호출 서비스의 `__ARTIFACT_ID__`입니다. SDK 자신의 ID나 화면 instanceId로 바꾸면 안 됩니다. 필수 props는 consumerId, alias, instanceId이며 exposedModule은 `./Widget`, label은 `서비스`가 기본값입니다. componentProps는 대상의 공개 계약에 맞춰 그대로 전달합니다. 위젯의 instanceId·onMounted도 위 예처럼 명시적으로 전달합니다.

- [src/RemoteRegion.jsx](src/RemoteRegion.jsx): 로딩·오류·재시도 버튼, 렌더링 오류 경계, 인스턴스별 시도 상태, 제거 후 늦은 응답 무시. 소비자·모듈·instanceId가 바뀌면 그 영역만 초기화합니다.
- [src/remote-loader.js](src/remote-loader.js): runtime별 consumerId·alias·exposedModule 캐시, 선언된 의존성 조회, C 하위부터 실패 모듈 정리·로딩 재준비. 정상 A·B 1.4·공통 SDK는 유지합니다.
- [src/RemoteRegion.module.css](src/RemoteRegion.module.css): 공통 UI의 CSS Modules. 서비스에는 스타일 복사본이 필요 없습니다.
- `getRemoteRecoveryLog()`: 최근 복구 기록 최대 50개를 복사해 반환하는 진단 API. consumerId·alias·exposedModule·artifactId·removed·prepared를 포함합니다.

네트워크 요청은 같은 소비자·별칭·공개 모듈끼리 공유하고 화면 상태는 각 instanceId별입니다. A와 C의 동일한 b 별칭은 다른 버전을 선택할 수 있습니다. 재시도 중 제거된 영역은 응답이 도착해도 다시 마운트하지 않습니다. 자동 폴링·새로고침·최신 버전 전환은 하지 않습니다.

현재 프로젝트는 빌드 도구 2.0.0의 Vite Federation을 사용합니다. `release.json`의 `format: "esm"`, `retryProtocol: "vite-preflight-v1"`, `exposeChunks`, `federationImports`·`exposeImports`로 공개 모듈과 의존 파일을 식별합니다. 런타임은 필요한 파일을 미리 확인한 뒤 네이티브 ES 모듈을 평가하고, 일시적인 파일 오류에는 같은 고정 조합의 실패한 영역을 다시 준비합니다. SDK 진단의 `removed`·`prepared`는 `./Widget`, `./data` 같은 공개 모듈 이름을 사용합니다. SDK 자체 로딩 실패·임의 코드 결함·업무 API·이벤트 핸들러 오류는 별도 처리 영역입니다.

이전 Webpack 배포물의 `failed-modules-v1/v2` 복구 경로도 구분해 처리합니다. Vite 배포물에는 Webpack의 모듈 캐시 정리 규칙을 적용하지 않습니다. 과거 빌드 도구 1.5.0의 `failed-modules-v2`와 31개·18개 통과 기록은 아래의 도입 이력이며 현재 Vite 전환 검증 결과를 뜻하지 않습니다. [현재 빌드·복구 계약](../platform-build-tools/README.md).

최초 공통화는 SDK 1.3.0과 이를 사용하는 A의 코드 변경·빌드가 필요했습니다. 당시 이미 `failed-modules-v2`를 지원한 C/B의 재빌드는 요구하지 않았습니다. Vite 컴파일러로의 최초 전환에서는 SDK·소비자·Shell을 새 도구로 빌드하며, 이후 호환 SDK 개선은 중앙 선택 정책을 따릅니다. 중첩 준비 도구는 재현성을 위해 A/C/B 독립 복사본을 새로 설치·빌드합니다. 실제 SDK는 npm으로 서비스에 포함하지 않고 MF로 로드합니다.

`integration`의 `npm run test:nested`로 기존 C/B/D 파일 실패·복구, A 상태 유지와 SDK 소비자별 별칭·props·호출 대상 변경까지 31개를 검증했습니다. [HTML 사용 설명](../../docs/mfe-runtime-operations.html#sdk-remote-region).
## SDK 1.3.1: 서비스 재빌드 없이 재시도 정책 교체

RemoteRegion의 공개 props는 그대로입니다. 수동 재시도가 일시적 진입 파일·청크 로딩 오류로 실패하면 500ms 후 한 번 더 시도합니다. 최초 로딩은 한 번, 버튼 한 번당 최대 두 번의 로딩 시도입니다. 계속 실패하면 버튼을 다시 표시하고, 잘못된 연결·없는 공개 모듈·렌더링 결함은 자동 추가 시도하지 않습니다.

대기 시간까지 같은 Promise로 공유하며, 복구 준비에서 이미 얻은 실행 함수를 재사용해 즉시 중복 get이 대기 정책을 우회하지 않게 합니다. getRemoteRecoveryLog()에 attempt 1/2가 추가됩니다. 제거한 영역에는 늦은 결과를 적용하지 않지만 공유 요청은 완료될 수 있습니다.

`integration`에서 `npm run test:region-sdk`: 보존한 SDK 1.3.0 조합으로 탭을 먼저 열고 **SDK 프로젝트만 빌드·발행·선택**합니다. A/C/B/D/Shell의 배포 ID·파일 SHA-256·연결 및 소비자 프로젝트 수정 시각이 유지됨을 확인했습니다. 기존 탭은 1.3.0, 새 탭은 1.3.1을 사용하며 롤백도 새 탭부터 적용됩니다. **18/18 통과**. SDK 1.3.0 당시의 `test:nested` 31개 결과와 별도입니다.

`integration/artifacts/remote-region-sdk-upgrade/baseline.json`이 지정한 이전 보존본이 필요합니다. 없으면 복원해야 하며 이 검사는 A/C/B를 새로 빌드하지 않습니다. `npm run demo:region-sdk`는 검증 후 두 SDK 조합을 4175에서 제공합니다. [동작 비교·근거·재현 설명](../../docs/mfe-runtime-operations.html#sdk-region-upgrade).
