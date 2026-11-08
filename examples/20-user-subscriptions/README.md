# 20 · 사용자별 위젯·배포 조합 구독

`docs/index.html`을 브라우저에서 여세요. 다른 예제 없이 이 폴더만 복사하여 실행합니다.

```sh
npm --prefix integration ci
npm start
```

http://127.0.0.1:4520/subscriptions 에서 Alice·Bob·Carol을 선택합니다. 각자 사용할 배포 조합·위젯 버전을 저장하고 대시보드를 새 탭으로 엽니다. 동시 사용자 비교에는 서로 다른 브라우저 프로필을 사용하세요.

검증: `npm test`. 소스 개발: `npm run setup` → `npm run build -- subscription-console`. 고정 비교: `npm run pins`. 실험 초기화: 서버·탭을 닫고 `npm run reset`.

구독은 서버 파일에 영속 저장됩니다. 대시보드를 한 번도 열지 않은 사용자의 구독도 SDK·위젯·전이 의존성을 보호합니다. 기존 탭, 등록 해제, 실제 파일 삭제는 각각 별도로 처리합니다.

로컬 데모 로그인과 단일 파일 저장소입니다. 운영 SSO·권한/DB/S3 구현은 포함하지 않습니다.
