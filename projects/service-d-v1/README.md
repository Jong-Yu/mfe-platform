**하위 의존 모듈 D 1.0.0**

## 이 프로젝트를 처음 열었다면

[HTML 개발 안내서](../../docs/mfe-project-handbook.html#project-service-d-v1) · [실행·발행 순서](../../docs/mfe-project-handbook.html#workflow) · [플랫폼 제공 목록](../../docs/mfe-project-handbook.html#platform)

- 담당: D 모듈 담당 팀.
- 목적: A → B → D처럼 한 단계 더 내려간 의존성도 독립 선택할 수 있는지 검증합니다.
- 사용: ./data로 version, artifactId, describe()를 내보냅니다. React·SDK·다른 MF 의존성은 없습니다.
- 수정 시점: D 함수의 구현을 변경할 때 수정합니다. 기존 함수를 유지한 호환 D이면 B 파일을 다시 만들지 않고 연결만 바꿉니다.

| 주요 파일 | 역할 |
| --- | --- |
| [src/index.js](src/index.js) | 버전·배포 ID와 설명 문자열을 반환하는 브라우저 JavaScript 모듈. 백엔드 서버나 HTTP API가 아닙니다. |

공통 `mf.config.cjs`, `mf.dependencies.json`, `vendor/`, `dist/release.json`의 의미는 [폴더·설정 안내](../../docs/mfe-project-handbook.html#files)를 참고합니다.

---

B 1.4.0이 사용하는 `./data` MF Remote입니다. 다른 MF 모듈에 대한 의존성은 없으며, `mf.dependencies.json`은 빈 객체입니다.

Node.js 22.12 이상이 필요하며 24를 권장합니다. 이 디렉터리에서 실행합니다.

```sh
npm ci
npm run build
npm start
```

자체 `package.json`, `package-lock.json`, `mf.config.cjs`, `mf.dependencies.json`, `vendor/`로 독립 설치·빌드합니다. `vendor/`의 npm tarball은 공통 빌드 도구입니다. 런타임 플랫폼 SDK를 npm tarball로 배포하는 구성이 아니며, D 자체도 MF 산출물로 발행합니다. 형제 프로젝트 소스나 루트 설치는 필요하지 않습니다.

산출물은 `dist/`, 발행 메타데이터는 `dist/release.json`입니다. B는 D 지원 범위만 빌드에 선언하고 실행 조합에서 정확한 D 배포 ID를 선택합니다. 호환 D 교체에는 B 재빌드가 필요하지 않습니다. `npm start`는 `http://127.0.0.1:4205`에서 메타데이터와 산출물을 제공합니다.

D v1/v2 디렉터리는 하위 의존성까지 서로 다른 버전이 공존함을 증명하는 릴리스 스냅샷입니다. 실무의 버전별 저장소 생성 규칙을 뜻하지 않습니다.
