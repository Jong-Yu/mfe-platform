**서비스 A 1.0.0 — OTA 소비자**

## 자기 프로젝트만 실행해서 개발하기

이 디렉터리에서 실행합니다. 준비된 `dev/` 키트가 포함되어 있으므로 다른 서비스·Shell·integration 서버를 켜지 않아도 됩니다.

```sh
npm ci
npm run dev
```

SDK 1.2.0의 `DevLayout`, `PageContainer`, 공통 Provider를 **MF로** 불러옵니다. 소스를 저장하면 해당 서비스만 다시 빌드하고 브라우저를 새로고침합니다. 입력 상태는 초기화됩니다. 오류가 있으면 마지막 성공 화면에 오류를 표시합니다.

| 개발 파일 | 역할 |
| --- | --- |
| `mf.dev.json` | 노출 모듈, 제목·설명, 개발 사용자·테마, PageContainer 사용 설정 |
| `dev/manifest.json` | SDK와 간접 의존성을 정확한 배포 ID로 고정하고 파일 해시를 기록 |
| `dev/remotes/` | 발행된 MF 산출물. 다른 서비스 소스나 npm SDK가 아님 |
| `.mfe-dev/` | Host·현재 서비스 개발 빌드·이전 빌드 보존. 생성 결과이며 직접 편집하지 않음 |

`npm start`는 기존의 산출물 제공 명령이고, 개발 화면은 `npm run dev`로 실행합니다. 새 SDK/의존 버전은 플랫폼이 키트를 갱신해 전달합니다. 서비스가 PageContainer를 직접 import하면 SDK 지원 범위를 `>=1.2.0 <2.0.0`으로 선언하고 `mf.dev.json`의 `pageContainer`를 false로 둡니다. [코드와 상세 사용법](../../docs/mfe-project-handbook.html#dev-host)

## 이 프로젝트를 처음 열었다면

[HTML 개발 안내서](../../docs/mfe-project-handbook.html#project-service-a) · [실행·발행 순서](../../docs/mfe-project-handbook.html#workflow) · [플랫폼 제공 목록](../../docs/mfe-project-handbook.html#platform)

- 담당: A 서비스 팀.
- 목적: 업무 화면에서 B의 차량 선택 UI를 재사용하는 소비자입니다.
- 사용: b/Widget을 import하고 ./Widget으로 내보냅니다. B 지원 범위는 >=1.4.0 <2.0.0입니다. 실제 B는 조합에서 A의 배포 ID에 연결합니다.
- 수정 시점: A 자체 업무 흐름 또는 B 사용 방식을 바꿀 때 수정합니다. 범위 안의 호환 B를 선택하는 작업은 재빌드 없이 합니다.

| 주요 파일 | 역할 |
| --- | --- |
| [src/index.jsx](src/index.jsx) | B 위젯에 공통 인스턴스 props를 전달하는 얇은 예제. getIdentity는 React·Context·간접 의존성 검증용입니다. 실제 OTA 업무 로직은 구현하지 않았습니다. |

공통 `mf.config.cjs`, `mf.dependencies.json`, `vendor/`, `dist/release.json`의 의미는 [폴더·설정 안내](../../docs/mfe-project-handbook.html#files)를 참고합니다.

---

`b/Widget`을 사용하는 독립 MF 프로젝트입니다. A가 사용할 B는 실행 조합에서 별도로 선택하며 B·D 소스를 함께 빌드하지 않습니다.

Node.js 22.12 이상이 필요하며 24를 권장합니다. 이 디렉터리에서 실행합니다.

```sh
npm ci
npm run build
npm start
```

자체 `package.json`, `package-lock.json`, `mf.config.cjs`, `mf.dependencies.json`, `vendor/`로 설치·빌드합니다. `vendor/`의 npm tarball은 빌드 도구만 제공하며, 공통 런타임 SDK는 MF로 공급됩니다. 루트 설치나 형제 프로젝트의 소스가 필요하지 않습니다.

`mf.dependencies.json`의 `b`에는 `mode: runtime`, `service: b`, `requires: >=1.4.0 <2.0.0`을 선언합니다. 실제 B 배포 ID는 `runtimeBindings[소비자 배포 ID].b`에서 선택합니다. 최초 전환 후에는 지원 범위 내 호환 B를 채택할 때 A를 재빌드하지 않습니다. 같은 A 배포물의 여러 위젯은 같은 B 선택을 공유하며 상태는 인스턴스별로 분리합니다.

`dist/release.json`과 `dist/` 산출물이 생성됩니다. `npm start`는 기본 `http://127.0.0.1:4201`에서 release 메타데이터와 `/artifacts/<id>/` 파일을 제공합니다. 독립 UI 서버가 아니므로 화면은 이 Remote를 소비하는 Shell/호스트에서 확인합니다.
