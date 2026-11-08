# 알림 서비스 E

이 폴더는 플랫폼이 준비한 SDK 개발 키트와 빌드 도구를 포함하는 독립 프로젝트입니다. Node.js 24를 권장합니다.

```sh
npm ci
npm run dev
```

http://127.0.0.1:4207 에서 확인합니다. 다른 서비스나 Shell 서버는 필요 없습니다. `src/Widget.jsx`의 문구를 수정하고 저장하면 현재 서비스만 빌드한 뒤 화면을 새로고침합니다. `npm start`는 개발 화면이 아니라 빌드 파일 제공 명령입니다.

- `src/`: 서비스 팀이 수정할 업무 콘텐츠.
- `mf.config.cjs`: 고유 서비스명 e와 공개 모듈 ./Widget.
- `mf.dependencies.json`: SDK 지원 범위. PageContainer를 사용하므로 >=1.2.0이 필요합니다.
- `mf.dev.json`: 개발 값과 화면 구성. 서비스가 PageContainer를 사용하므로 자동 감싸기를 끕니다.
- `vendor/`: 설치할 빌드 도구. SDK 구현은 들어 있지 않습니다.
- `dev/`: 플랫폼이 공급한 발행 SDK 파일과 파일 해시. SDK는 MF로 가져옵니다.
- `package-lock.json`: 플랫폼이 생성한 정확한 설치 목록. 서비스 저장소에 보관합니다.

`npm run build` 뒤 dist/와 dist/release.json을 플랫폼에 전달합니다. 발행만으로 제품 화면에 추가되지 않습니다. 플랫폼 담당자가 관리 화면에서 페이지 메뉴 또는 대시보드 위젯을 등록·검사·적용합니다. 해당 기능을 지원하는 Shell을 최초 한 번 도입한 뒤에는 Shell을 재빌드하지 않습니다. mf.config.cjs의 widgets는 대시보드에 공개할 위젯 목록이며, 업무 입력 props 없이 공통 instanceId와 SDK Context를 사용합니다. SDK 개발 키트 선택과 제품의 선택은 별개입니다.

동일 프로젝트에서 두 번째 서비스를 만들 때는 package 이름, mf.config.cjs의 service·port, 개발 제목을 변경합니다. 실제 운영 업로드·권한·CI는 별도 플랫폼 절차가 필요합니다.
