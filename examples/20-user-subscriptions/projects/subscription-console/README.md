# 사용자별 구독 편집기

사용자 세션 확인, 배포 조합·위젯 선택, 검사·저장·해제를 담당하는 독립 React 앱입니다.
제품 Shell과 별도로 빌드합니다. 실행 흐름과 API는 `../../docs/index.html`을 참고하세요.

`npm ci` 후 `npm run build`로 빌드하고, 예제 루트에서 `npm run build -- subscription-console`로 발행합니다. 서버의 `/subscriptions`에서 실행합니다.
