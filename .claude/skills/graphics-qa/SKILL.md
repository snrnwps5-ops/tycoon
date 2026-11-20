---
name: graphics-qa
description: 이 게임의 그래픽(조명·그림자·안개·발광) 변경을 375×667 헤드리스 캡처로 전후 비교할 때 쓴다. 그래픽 수정 전후 확인, 화면 캡처, 켬/끔 비교 요청에 사용.
---

# 그래픽 점검 절차 (375×667)

## 준비
```bash
cd tests && npm install          # puppeteer-core, three@0.128
export CHROME=/usr/bin/google-chrome   # 경로가 다르면 지정
```
`lib.js`의 `prep()`이 `tech.html`을 `tests/.run/` 쪽으로 복사하며 three CDN을 로컬로 바꿔 준다.

## 3D 장면이 실제로 그려지게 열기
```js
const L=require('./lib'); L.prep(); const b=await L.launch('3d');
const T=await L.open(b,'3d',{w:375,h:667,render:true,ftue:true});
await T.click('tStart');   // 신규 유저: 허브 없이 바로 DAY 1
// T.ev(()=>window.__T.st)==='run' 이 될 때까지 2초 간격으로 확인(소프트웨어 렌더링 환경에서 약 6초)
```
- `render:true`가 없으면 3D를 그리지 않아 검은 화면이다(로직 검수용).
- 영업 시작 직후 "구입 상담" 모달이 자동으로 뜬다. 캡처 전에 `#mbox button`을 눌러 닫는다.
- 안정된 장면을 위해 캡처 전 약 6초 기다린다. 소프트웨어 렌더링은 3~4fps다.

## 그래픽 훅 (v2.96 이후, `window.__H.v296`)
| 호출 | 용도 |
|---|---|
| `tone()` | 노출·안개 색·near/far |
| `lights()` | sun/hemi/fill/warm/rim 강도 |
| `cs()` | 접지 그림자 인스턴스 수·표시 여부 |
| `glow()` | 가산(발광) 평면 수 |
| `fog(true/false)` | 안개 켜고 끄기 |
| `set('exp'｜'near'｜'far'｜'sun'｜'hemi'…, 값)` | 값 임시 변경 |

접지 그림자 끄기: `window.__T.scene.traverse(o=>{ if(o.isInstancedMesh) o.visible=false; })`

## 전후 비교 방법
1. 같은 조건으로 `shot('A_기본')`.
2. 훅으로 대상 효과를 끄고 6초 후 `shot('B_끔')`.
3. 두 캡처에서 달라진 부분만 보고한다. 차이가 안 보이면 "체감 효과가 작다"고 쓴다.

## 점검 항목
- 바닥에 이유 없는 어두운 얼룩이 있는가(v2.96 캡처에서 오른쪽 중앙·아래에 확인됨, 접지 그림자를 꺼도 남음 — 원인 미확정).
- 상단 UI가 위쪽 가구를 가리는가, 하단 부스터 버튼이 중요한 장면을 가리는가.
- 사장님 발밑 링, 튜토리얼 손가락·말풍선이 읽히는가.
- 품질 단계가 내려가면(`[gfx] 단계` 2 이상) 접지 그림자 등 무거운 효과가 꺼지는가.

## 한계
- 소프트웨어 렌더링 결과이므로 실제 폰의 색감·선명도·프레임과 다르다. 최종 판단은 폰 실측으로 한다.
