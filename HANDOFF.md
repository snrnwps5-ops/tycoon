# 테크 스토어 타이쿤 — 인수인계 보고서 (v1.7 기준, 2026-11-13)

다음 작업자(AI 포함)가 바로 이어서 할 수 있도록 현재 상태, 구조, 검증 범위, 남은 일을 정리한 문서입니다.

## 1. 배포와 저장소
- 저장소: https://github.com/snrnwps5-ops/tycoon (`main` = 배포 소스, `gh-pages`도 같은 커밋으로 함께 push 중)
- 3D 원본: https://snrnwps5-ops.github.io/tycoon/ (`index.html`이 `tech.html`로 이동)
- 2D 테스트 모드: https://snrnwps5-ops.github.io/tycoon/tech-test.html (WebGL 불필요, AI QA용)
- 현재 버전: v1.7, 커밋 `c893a09` (이 문서 커밋 직전)
- `version.txt`: 빌드 시각. `tech.html` 머리의 스크립트가 이 값과 자신에 박힌 값을 비교해 다르면 `?b=`를 붙여 새로 불러옵니다. **배포할 때마다 `version.txt`와 `tech.html` 안의 `t!=='숫자'`를 같은 값으로 갱신**해야 합니다.

## 2. 파일 구조
| 파일 | 내용 |
|---|---|
| `tech.html` | 테크 스토어 3D (three.js r128, 단일 파일). 주 개발 대상 |
| `tech-test.html` | `tech.html`을 손으로 갈라낸 2D 판. THREE를 가짜 객체로 대체하고 2D 캔버스로 그림. **게임 로직 줄은 `tech.html`과 동일**해야 함 |
| `index.html` | 분식집 타이쿤(별도 게임). 첫 접속 시 `tech.html`로 이동 |
| `hotel.html` | 호텔 타이쿤(별도 게임) |
| `assets.js` | 3D 모델·사운드 base64 (약 7.8MB) |
| `*.jpg`, `icon-*.png` | ChatGPT로 생성한 키 아트, 상점 아이콘 시트(`shop.jpg` 3x3), 손님 초상화 시트(`faces.jpg` 3x3), 로드맵 매장 그림(`st0~5`, `hs0~2`) |

### 로직 공유 방식 (중요)
- 자동 생성기는 없습니다. 로직을 고칠 때는 **같은 문자열 치환을 `tech.html`과 `tech-test.html` 양쪽에 적용**합니다 (정확히 1회 일치하는지 확인하는 파이썬 패치 스크립트 방식 사용).
- 두 파일의 차이는 렌더링·카메라·모델 로딩·타이틀·부트 가드뿐입니다. `difflib`으로 줄 단위 비교하면 차이 구간을 바로 볼 수 있습니다.
- 저장 키: 3D `bunsik-tech-v1`, 2D `bunsik-tech-2d-v1` (분리). 저장 코드(`NOVA1.` + base64 JSON)는 서로 호환됩니다.

## 3. 주요 시스템 위치 (함수명으로 검색)
- 날짜·스테이지: `DAYS`, `dayCfg`, `STAGE_OF`, `STN`(지역명), `startDayModal`, `endDay`, `showResult`
- 손님: `spawnCust`, `custLeave(c,ok,pay)`, `REQ`(말풍선 문구), 손님 루프는 `step()` 안
- 상담: `openQuiz`, 질문 배열 `SWQ/SWQ2/BUYQ/FIXQ/RETQ/TOURQ/CORPQ/ESCQ/TRADEQ/LOSTQ/GIFTQ/ERRQ`, `pickQ`(반복 억제)
- 수리: `askFix`(직접/위임 선택), `openRepair`(단계 미니게임), `openKB`
- 재고: `S.inv`(창고), `SRC`(진열대), `S.orders`, `S.dock`(입고 박스), `inv2Tick`, `restockAll`, `openInv`, `openStockout`
- 직원: `ROLES`, `ROLE_UNLOCK`, `candidates`, `addStaff`, `staff` 배열, `crewHTML/openCrew`, 추가 자리 `slotCount/slotHTML/slotClick`
- 정산·보너스: `showResult` (영수증 `receipt`, `S.bp` = 날짜별 지급한 클리어 보너스)
- 저장: `save`, `openSave`, `saveCode`, `loadCode`, `S.mid`(영업 중 종료 표시)
- 상점(테스트 결제): `SHOP`, `openShop`
- 그 밖: 콤보·피버 `comboHit`, 업적 `ACH`, 출석 `openAttend`, 클래스 `clsStart/openClass`, 랭킹 `ranking`, 지도 `openWorld`, 로드맵 `openRoad/techRoad`
- 테스트 훅: `window.__H` (`serve`, `endNow`, `stat`, `S`, `player`, `custs`, `openRepair` 등), `window.__TS`(시간 배속), `window.__NR=1`(3D 그리기 생략), 2D의 `window.__ERR`

## 4. 이번 세션(v1.6~v1.7)에서 한 일
- v1.6 (`0122cf9`): 해금 연출 예외 방지, 모달 소유권, 직접 수리 선택권, 정산 영수증, 클리어 보너스 1회 지급, 평점 이름 구분, 질문 반복 억제, 민원 상태 문구
- v1.7 (`c893a09`): 추가 직원 자리(서울 도착 1 + 유료 1), 저장 화면(상태·수동 저장·코드 내보내기/불러오기), 영업 도중 종료 안내

## 5. 검증한 것과 못 한 것
### 자동 테스트로 확인 (헤드리스 Chrome; 3D는 소프트웨어 렌더링 + 그리기 생략)
- 신규 저장 DAY 1→3 진행, 패드 해금, 레벨업 후 루프 지속, 정산 표시 (3D·2D)
- 관리 창이 상담으로 덮이지 않음, 상담 중 하단 메뉴 차단 (3D·2D)
- 직접 수리 성공, 실수 3회 실패 → 민원 +1, 직원이 직접 수리 건을 가져가지 않음 (3D·2D)
- 추가 직원 채용 2명, 상점 자리 구매, 저장 코드 내보내기 → 새 브라우저에서 불러오기 (3D·2D)
- 추가 직원 포함 하루 영업 4회(2D): 페이지 오류 없음, 한 직원이 두 손님을 동시에 맡는 경우 0회

### 확인하지 못한 것
- **실기기 전부**: iPhone Safari, 홈 화면 앱, Android Chrome, GPU 있는 데스크톱 Chrome
- 3D 화면에서 새 UI(💾 칩, 선택 창, 영수증)의 실제 모습과 터치
- 추가 직원이 난이도에 주는 영향: 봇 4회 실행 결과가 들쭉날쭉해서(매출 966~2071, 직원 수와 무관) **결론 없음**. 봇이 진단·데이터 이전을 하지 않아 현실적이지 않았음
- 같은 실행에서 수리 기사가 있는데도 하루 수리 완료가 0~3건이었음. 진단이 필요한 손님을 봇이 진단하지 않은 영향으로 추정하지만 **확인 안 됨** → 직원 처리량 점검 필요
- 스테이지 전환(DAY 4→5 등), 발주가 있는 날의 영수증 금액, 질문 반복 억제의 실제 분포
- 배포 확인은 `version.txt` 값까지만. 공개 주소에서 실행해 보지 못함

## 6. 알려진 문제
- **iOS 홈 화면 앱 하단 여백**: 가끔 화면 높이가 약 54pt 짧게 잡혀 아래에 빈 띠가 생김. 화면을 강제로 늘리는 방법 두 가지를 시도했으나 한 번은 효과 불명, 한 번은 터치 문제 보고가 있어 모두 제거함. 현재는 배경색만 맞춤. 확실한 방법은 상태 표시줄 스타일을 `black-translucent`에서 `black`으로 바꾸는 것(아이콘 재설치 필요)
- 급여·임대료·입소문 보너스는 "다시 도전"마다 다시 적용됨 (의도 여부 미정)
- 추가 직원에게는 교육·급여 인상 버튼이 없음
- 수리 도중 취소 기능 없음
- 결제·광고는 전부 테스트용 (누르면 즉시 지급)
- Claude 아티팩트 쪽 사본은 v1.3에서 멈춰 있음. 최신은 GitHub Pages
- 분식집·호텔은 테크 스토어 수준의 스테이지·재고·직원 시스템이 없음

## 7. 남은 요청 (우선순위 순)
1. 품절 사전 경고 개선: 진열+창고+배송중 합산, 판매 제품과 수리 부품 구분, 알림 빈도 제한
2. 저장·재개 안내 보강, 몰린 손님 말풍선 겹침 줄이기, 2D 오류 로그 접기
3. 상담: 정답·오답 뒤 이유 설명, 예산·용도 조합형 문제
4. 효과음·BGM 분리 설정, 지원 기기에서만 햅틱 (iOS Safari는 `navigator.vibrate` 미지원으로 가정할 것)
5. 특수 손님(급한/설명 원하는/에스컬레이션) 확장 — 기존 `tough`, `vip`, `flight`, `esc`, `influ`부터 확인
6. 오프라인 수익(상한·중복 수령 방지)
7. 꾸미기 확장(기존 `decor` 패드 활용), 핀치 줌·줌 버튼 (2D에는 줌 버튼 있음)

## 8. 작업 원칙 (사용자 요청)
- iPhone Safari의 3D 실행과 기존 저장 보존. 3D를 2D로 대체하지 않기
- 실제 상표 사용 금지 (가상 브랜드 "Nova")
- 실행하지 않은 것을 확인했다고 쓰지 않기. 테스트한 환경과 못 한 환경을 구분해 보고
- three.js 버전 변경이나 게임 로직 대규모 재작성은 원인 확인 전에는 하지 않기
