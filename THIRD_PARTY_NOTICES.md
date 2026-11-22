# 제3자 리소스 · 라이선스 점검표 (2026-11-21 기준)

상태 표기: **확인됨**(공식 페이지에서 라이선스 확인) / **추정**(이름·모양으로 짐작, 원본 확인 필요) / **미확인**(출처 기록 없음)

## 코드·폰트
| 항목 | 위치 | 라이선스 | 상태 |
|---|---|---|---|
| three.js r128 | CDN(cdnjs / jsdelivr) | MIT | 확인 필요: 배포본에 라이선스 문구가 남는지(CDN 로드면 파일 머리말에 포함) |
| Noto Sans KR | Google Fonts(`fonts.googleapis.com`) | SIL Open Font License 1.1 | 외부 요청이 생김. 오프라인·Play 웹 래퍼에서는 시스템 글꼴로 대체됨 |
| 시스템 글꼴 이름(`Apple SD Gothic Neo`, `Apple Color Emoji`) | CSS font-family 목록 | 사용자 기기 글꼴을 참조만 함, 파일 배포 없음 | 문제 없음 |

## 3D 모델 (`assets.js` 4.9MB, `assets_extra.js` 2.9MB·미사용)
| 키 | 내용 | 추정 출처 | 상태 |
|---|---|---|---|
| `z:cactus_*`, `z:rug_*`, `z:pictureframe_*`, `t:kkfurn`, `t:kaykit` | 선인장·러그·액자·가구 텍스처 | KayKit Furniture Bits (Kay Lousberg), CC0 — 공식 페이지에서 "개인·상업 이용 가능, 출처 표기 불필요(CC0)" 확인 | 추정(이름 일치) |
| `q:Casual_Male` 등 14종(Casual/Casual2/Casual3/Bald/OldClassy/Suit/Worker) | 손님·직원 캐릭터 | Quaternius 계열로 추정(CC0 팩이 많음) | **미확인** — 정확한 팩 이름과 다운로드 페이지를 기록해야 함 |
| `y:kitchencounter_*` | 카운터 | 위 팩들과 같은 계열로 추정 | 미확인 |
| `s:coin`, `s:confirm`, `s:level_up`, `s:ui`, `s:land` | 효과음 | 직접 합성했는지, 받아 온 소리인지 기록 없음 | **미확인** |

## 이미지
| 파일 | 내용 | 상태 |
|---|---|---|
| `keyart.jpg`, `st0~5.jpg`, `shop.jpg`, `faces.jpg`, `crew_faces.jpg`, `icon*.png` | 글로시 3D 스타일 그림. 생성형 AI로 만든 것으로 보임(HANDOFF에 도구·약관 기록 없음) | 사용자 설명: 피클(GPT)로 생성. 이미지 생성 도구의 정확한 이름·계정·약관 캡처는 아직 기록 없음 |

### 2026-11-21 이미지 교체 (v3.08)
`keyart.jpg`, `st0~5.jpg`, `shop.jpg`, `faces.jpg`, `crew_faces.jpg`, `icon.jpg`, `icon-512/192/180.png`, `boxes.png`(새 파일)는
사용자의 ChatGPT 유료 계정(이미지 생성)으로 2026-11-21에 새로 만든 그림으로 바꿨다. 대화 제목 "Create Treasure Chests Image".
프롬프트에서 글자·로고·실존 브랜드를 금지했고, 결과물에도 글자가 없다(지점 그림의 실제 지명 문구 제거됨).
남은 일: ChatGPT 이미지 생성 약관(상업 이용 조건) 화면 캡처를 출시 전에 남긴다.

AI 생성 이미지 유의점
- 순수 AI 생성물은 저작권 보호를 받기 어렵다는 입장이 많다(나라별로 다름). 남이 그대로 가져가도 막기 어려울 수 있다.
- 상업 이용 가능 여부는 생성 도구의 약관이 정한다. 도구 이름과 약관 캡처를 남겨 둔다.
- `st3.jpg`에 "INCHEON AIRPORT TERMINAL 2", "DUTY FREE" 문구가 있다. 실제 장소·업종 이름이라 상표 분쟁 소지는 낮지만, 출시용이라면 가상 이름으로 바꾸는 편이 안전하다.

## 게임 안 문구
- 실제 회사·제품 이름: 플레이어에게 보이는 문구에서는 "유튜브 편집"(일반 용도 설명) 한 건만 확인했다.
- 개발 주석에 "삼성스토어·월마트형" 표현이 있다. 화면에 보이지 않는다.

## 새로 넣은 3D 상자(v3.05 브랜치)
- 모델과 텍스처를 외부에서 가져오지 않았다. 나무 결, 금속, 마법진은 canvas로 직접 그렸고 상자 형태는 three.js 기본 도형이다. 추가 라이선스 의무 없음.
- 보상 아이콘은 기기의 이모지 글꼴로 그린다(파일 배포 없음).

## 출시 전에 채울 것
1. 캐릭터 14종의 정확한 팩 이름과 URL
2. 효과음 5종의 출처
3. AI 이미지: 생성 도구(피클 GPT)의 정확한 이름·계정 종류·약관 캡처
4. Google Play 제출 시 AI 생성 콘텐츠 정책과 확률형 아이템 확률 공개 요건 재확인(정책은 수시로 바뀜)

## Jua 폰트 (fonts/jua.woff2)
- 출처: Woowahan Brothers "Jua" (npm @fontsource/jua), 게임에 쓰는 글자만 남긴 서브셋
- 라이선스: SIL Open Font License 1.1 — 전문은 fonts/Jua-OFL.txt
