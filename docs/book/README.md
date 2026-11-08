# 통합 학습서 관리

사용자에게 전달하는 결과는 `../mfe-self-study.html` 한 파일입니다. 이 폴더는 갱신을 위한 편집 원본과 문서 검증 도구입니다.

- `chapters.html`: 기초 설명·학습 경로·설계 정리.
- `lessons.json`: 20개 예제의 목표·실습·기대 결과·질문·해설.
- `lab-guidance.json`: 직접 따라 하며 보완한 버튼·입력값·복사 경로·코드 변경·검증 준비 안내.
- `build.py`: 기존 20개 설명서와 4개 상세 문서의 본문을 합치고 ID·링크·그림을 정리합니다. 그림은 HTML 안에 포함합니다. 고정 예제는 수정하지 않습니다.
- `style.css`, `reader.js`: 반응형 읽기·검색·진행 표시·인쇄.
- `sources.json`: 수록한 문서의 경로와 SHA-256.
- `verify.mjs`: 오프라인 단일 파일·목차·검색·상세 열기·모바일·인쇄·링크 검사. 결과는 `../verification/self-study/`.
- `walkthrough.mjs`: 학습서의 권장 순서로 독립 복사본을 설치·실행하고 화면 조작·개발·발행·각 예제의 전체 검증을 수행합니다. 결과는 `../verification/walkthrough/`. 인자로 예제 번호를 주면 해당 예제만 재확인합니다. 기본은 준비된 npm 캐시이며 `READER_ONLINE=1 NPM_CACHE=빈_캐시_경로`는 온라인 설치를 사용합니다.
- `walkthrough-findings.json`: 발견한 설명 문제·보완 내용·확인 근거.

프로젝트 최상위에서 `python3 docs/book/build.py`로 재생성합니다. Python 표준 라이브러리만 필요합니다.

브라우저 확인은 설치된 `examples/20-user-subscriptions/integration/node_modules/playwright`와 Chrome을 사용하여 `node docs/book/verify.mjs`로 실행합니다. `CHROME_EXECUTABLE_PATH`로 Chrome 경로를 바꿀 수 있습니다.

초기 문서 QA는 화면과 링크만 확인했습니다. 이후 학습서 따라 하기에서 20개 예제의 기능 검사 205개를 실제로 재실행했습니다. 두 기록의 범위를 구분해 보존합니다. 이후 글만 고쳤다고 다시 실행한 것으로 표시하지 않습니다.
