**업무 UI B 1.4.0**

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

[HTML 개발 안내서](../../docs/mfe-project-handbook.html#project-service-b-v1) · [실행·발행 순서](../../docs/mfe-project-handbook.html#workflow) · [플랫폼 제공 목록](../../docs/mfe-project-handbook.html#platform)

- 담당: B 서비스 팀.
- 목적: A 등 다른 서비스가 선택할 수 있는 차량 선택 UI의 첫 번째 버전 계열입니다.
- 사용: ./Widget을 공개합니다. platform/sdk와 d/data를 사용하며 D 지원 범위는 >=1.0.0 <2.0.0입니다. 헤더·사이드바 없이 콘텐츠를 제공합니다.
- 수정 시점: B 위젯의 기능·UI·외부 API를 바꿀 때 수정합니다. 호환 D 교체만 한다면 이 B는 재빌드하지 않습니다.

| 주요 파일 | 역할 |
| --- | --- |
| [src/Widget.jsx](src/Widget.jsx) | WidgetBoundary를 열고 공통 사용자, 독립 상태·캐시·구독·Portal을 사용하는 위젯 예제. |
| [src/Widget.module.css](src/Widget.module.css) | 이 배포물의 CSS Modules. 빌드 도구가 배포 ID를 클래스명에 넣습니다. |

공통 `mf.config.cjs`, `mf.dependencies.json`, `vendor/`, `dist/release.json`의 의미는 [폴더·설정 안내](../../docs/mfe-project-handbook.html#files)를 참고합니다.

---

A가 사용하는 `./Widget` Remote입니다. 중앙에서 선택한 공통 플랫폼 SDK와 런타임에 선택한 D 1.x를 MF로 참조하며, 인스턴스별 상태·캐시·구독과 CSS Module 스타일을 사용합니다.

Node.js 22.9 이상이 필요하며 24를 권장합니다. 이 디렉터리에서 실행합니다.

```sh
npm ci
npm run build
npm start
```

자체 `package.json`, `package-lock.json`, `mf.config.cjs`, `mf.dependencies.json`, `vendor/`를 사용합니다. `vendor/`의 npm tarball은 빌드 도구만 담으며, 런타임 플랫폼 SDK는 npm에 포함하는 대신 MF로 로드합니다. 형제 서비스 소스나 루트 설치는 필요하지 않습니다.

`mf.dependencies.json`의 `d`에 `mode: runtime`, `service: d`, `requires: >=1.0.0 <2.0.0`을 선언합니다. 실제 D는 조합의 `runtimeBindings[B 배포 ID].d`에서 선택합니다. `platform`도 지원 범위를 선언하고 공통 SDK를 실행 시 선택합니다. 산출물은 `dist/`, 메타데이터는 `dist/release.json`입니다.

`npm start`는 기본 `http://127.0.0.1:4203`에서 release 메타데이터와 `/artifacts/<id>/` 파일만 제공합니다. 독립 화면 실행이 아니며, UI는 이 모듈을 소비하는 호스트에서 확인합니다.

`service-b-v1`과 `service-b-v2`는 두 버전의 동시 실행을 증명하기 위한 릴리스 스냅샷입니다. 실무에서 B의 버전마다 새 저장소를 만들라는 의미가 아닙니다.

플랫폼 SDK는 화면 전체에서 하나를, D는 B 배포물마다 하나를 선택합니다. 최초 전환 후 호환 D를 바꿀 때 B·A·C·Shell을 재빌드하지 않습니다. 같은 B 배포물의 모든 인스턴스는 같은 D 선택을 공유하고, 다른 B 배포물은 서로 다른 D를 선택할 수 있습니다.
