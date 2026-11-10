**하위 의존 모듈 D 2.0.0**

## 이 프로젝트를 처음 열었다면

[HTML 개발 안내서](../../docs/mfe-project-handbook.html#project-service-d-v2) · [실행·발행 순서](../../docs/mfe-project-handbook.html#workflow) · [플랫폼 제공 목록](../../docs/mfe-project-handbook.html#platform)

- 담당: D 모듈 담당 팀.
- 목적: 서로 다른 B가 서로 다른 D를 가져오는 경로를 동시에 실행합니다.
- 사용: B 2.x가 선언한 범위에 맞는 ./data Remote입니다. 함수 형태는 v1과 같고 배포 버전·ID가 다릅니다.
- 수정 시점: D 2.x 변경을 검증할 때 사용합니다. D v1/v2 역시 공존 검증을 위한 스냅샷입니다.

| 주요 파일 | 역할 |
| --- | --- |
| [src/index.js](src/index.js) | D 2.x 버전·배포 ID·describe() 구현. |

공통 `mf.config.cjs`, `mf.dependencies.json`, `vendor/`, `dist/release.json`의 의미는 [폴더·설정 안내](../../docs/mfe-project-handbook.html#files)를 참고합니다.

---

B 2.1.0이 사용하는 `./data` MF Remote입니다. 다른 MF 모듈에 대한 의존성은 없으며, `mf.dependencies.json`은 빈 객체입니다.

Node.js 22.12 이상이 필요하며 24를 권장합니다. 이 디렉터리에서 실행합니다.

```sh
npm ci
npm run build
npm start
```

자체 `package.json`, `package-lock.json`, `mf.config.cjs`, `mf.dependencies.json`, `vendor/`를 사용합니다. `vendor/`에는 공통 빌드 도구의 npm tarball만 있으며, 런타임 플랫폼 SDK는 별도의 MF 모듈입니다. D 1.0.0이나 다른 프로젝트의 소스, 루트 설치에 의존하지 않습니다.

산출물은 `dist/`, 발행 메타데이터는 `dist/release.json`입니다. B는 D 지원 범위만 빌드에 선언하고 실행 조합에서 정확한 D 배포 ID를 선택합니다. 호환 D 교체에는 B 재빌드가 필요하지 않습니다. `npm start`는 `http://127.0.0.1:4206`에서 메타데이터와 산출물을 제공합니다.

D v1/v2 디렉터리는 버전 공존 증명용 릴리스 스냅샷입니다. 실제 개발에서 버전마다 새 저장소를 만들어야 한다는 의미가 아닙니다.
