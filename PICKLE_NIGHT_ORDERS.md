# 피클 야간 작업 지시서 (v2.47 → v2.53) — 사용자가 자는 동안 순서대로

**작업 6개, 예상 4~5시간.** 위에서부터 하나씩 끝내고, 끝날 때마다 커밋·푸시한다.
막히면 아래 "멈춤 규칙"에 따라 건너뛰고 다음 작업으로 간다. 사용자에게 질문하지 않는다(자는 중).

---

## 공통 규칙 (모든 작업에 적용)

1. 시작할 때 `git pull`.
2. **고치는 게임 파일은 `tech.html` 하나뿐**이다.
   - 고친 뒤 `python3 _t2d/build.py`를 실행한다. "written … tech-test.html"과 "synced … index.html" 두 줄이 나와야 한다.
   - `tech-test.html`과 `index.html`은 직접 고치지 않는다.
3. 새 코드 블록은 `tech.html`에서 `function startDayModal(){`를 찾아 **그 줄 바로 앞**에 넣는다. 블록 맨 위에는 주석 `/* ===== v2.4x: 설명 ===== */`을 단다.
4. 기존 코드를 바꿀 때는 **찾을 문자열이 파일에 정확히 1번 있는지** 먼저 확인한다(`grep -c`). 0번이나 2번 이상이면 바꾸지 말고 멈춤 규칙을 따른다.
5. 작업마다 버전 숫자를 올린다. 세 곳을 같은 값으로 바꾸고 build를 다시 실행한다.
   - `version.txt`
   - `tech.html`의 `var V='…'`
   - `_t2d/part_head.html`의 `V='…'`
   - 타이틀 표기 `class="tv">v2.4x`도 올린다.

   | 작업 | 버전 | V 값 |
   |---|---|---|
   | 1 | v2.48 | 1795170000 |
   | 2 | v2.49 | 1795180000 |
   | 3 | v2.50 | 1795190000 |
   | 4 | v2.51 | 1795200000 |
   | 5 | v2.52 | 1795210000 |
   | 6 | v2.53 | 1795220000 |

6. 확인
   - 먼저 `node -v`를 실행해 본다. Node가 있으면 `cd tests && npm i && node run.js`를 실행한다. 약 20분 걸리고 전부 통과해야 한다.
   - Node가 없으면 크롬으로 확인한다.
     - `tech.html`을 파일로 연다(`file:///…/tech.html`).
     - F12 → 기기 툴바(Ctrl+Shift+M) → 375×667과 393×852 두 크기로 본다.
     - 콘솔에 빨간 오류가 없어야 한다.
   - 상태 만들기: 콘솔에 아래를 붙여넣고 숫자만 바꾼다.
     ```js
     const S=window.__H.S; Object.assign(S,{day:5,curStage:1,money:5000,dayStars:[3,3,3,3,3],sysSeen:{1:1},exp:{1:1},seen:1}); localStorage.setItem('bunsik-tech-v1',JSON.stringify(S)); location.reload();
     ```
     - `day`: 0부터 시작. 5 = DAY 6
     - `curStage`: 0 대구, 1 부산, 2 서울, 3 인천, 4 뉴욕, 5 본사
     - 처음 상태로 되돌리기: `localStorage.clear(); location.reload();`
   - 콘솔 도구
     - `window.__T` (예: `__T.money`, `__T.dayCfg(5)`, `__T.boxGet()`)
     - `window.__H.S` (세이브 전체)
     - 영업을 바로 끝내기: `__H.endNow()`
7. 커밋할 때는 `git -c user.name="Pickle" commit -m "v2.4x: 한 줄 설명"`. **API 키·비밀번호가 diff에 없는지** 확인한 뒤 push한다.
8. 경제 숫자(목표, 가격, 확률)는 **지시서에 적힌 것만** 바꾼다.

### 멈춤 규칙
- 같은 문제로 2번 시도해도 안 되면 그 작업은 `git checkout -- .`로 되돌리고 건너뛴다. 보고서에 "건너뜀 + 이유"를 적는다.
- 콘솔에 새 빨간 오류가 생기면 그 작업은 커밋하지 않는다.
- 다른 작업이 앞 작업에 의존하지 않으므로, 하나를 건너뛰어도 다음 작업은 할 수 있다.

---

## 작업 1 (v2.48) — 작은 화면 UI 겹침 ⏱ 30분

**문제 A**: 영업 준비창의 분홍 "🛠️ 지금 할 수 있는 투자 n개 ↓" 버튼이 375×667에서 '영업 시작' 버튼 뒤에 가려진다.
- `function invHint()`에서 `go.before(d);`를 찾는다(1번만 있음).
- 아래로 바꾼다.
  ```js
  const h2=$('mbox').querySelector('h2'); const p1=h2&&h2.nextElementSibling; if(p1&&p1.tagName==='P') p1.after(d); else if(h2) h2.after(d); else go.before(d);
  ```
- 같은 함수의 `margin:0 0 6px`를 `margin:6px 0`으로 바꾼다.

**문제 B**: 왼쪽 위 노란 정산함 칩 `#boxChip`이 다른 UI와 겹치는지 확인한다.
- `function boxPaint()` 안의 `top:calc(env(safe-area-inset-top) + 150px)`을 확인한다.
- 상태: `{day:5,curStage:1,money:5000,dayStars:[3,3,3,3,3],sysSeen:{1:1},exp:{1:1},box:{1:30},seen:1}` → '영업 시작'을 누른다.
- 겹치면 `150px`을 `196px`로 바꾼다. 그래도 겹치면 `left:10px`를 `right:76px`로 바꾼다.

**완료 조건**
- 375×667에서 분홍 버튼과 '영업 시작'이 둘 다 보인다.
- 분홍 버튼을 누르면 아래 투자 카드로 스크롤된다.
- 칩이 아무것도 가리지 않는다.
- 칩을 누르면 `__T.boxGet()`이 0이 된다.

---

## 작업 2 (v2.49) — 이미지 용량 줄이기 (로딩 속도) ⏱ 20분

대상: `keyart.jpg`, `shop.jpg`, `faces.jpg`, `crew_faces.jpg`, `st0.jpg`~`st5.jpg`
```python
from PIL import Image
import os
for f in ['keyart.jpg','shop.jpg','st0.jpg','st1.jpg','st2.jpg','st3.jpg','st4.jpg','st5.jpg']:
    im=Image.open(f).convert('RGB'); w,h=im.size
    if w>1200: im=im.resize((1200,int(h*1200/w)),Image.LANCZOS)
    im.save(f,'JPEG',quality=78,optimize=True,progressive=True)
    print(f,os.path.getsize(f))
```
- `faces.jpg`와 `crew_faces.jpg`는 **크기를 바꾸지 말고** quality=85, optimize만 적용한다. 스프라이트 시트라 좌표가 어긋나면 안 된다.
- 확인
  - 타이틀 화면의 키아트, 로드맵 썸네일(st0~5), 상점 아이콘, 직원 얼굴이 깨지지 않는다.
  - 상태 `{day:9,curStage:2,…}`에서 로드맵을 열어 본다.
- 보고: 파일별 용량 전/후.

---

## 작업 3 (v2.50) — 손맛: 돈이 오를 때 반응 ⏱ 40분

새 블록을 `function startDayModal(){` 앞에 넣는다.
```js
/* ===== v2.50: 손맛 — 돈이 늘면 돈 칩이 통통 튀고, 큰 금액은 진동 ===== */
try{ const st=document.createElement('style'); st.textContent='#cashPill.pop{animation:cpop .28s ease-out}@keyframes cpop{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}'; document.head.appendChild(st);
  let last=money; setInterval(()=>{ try{ if(money>last){ const d=money-last; const p=$('cashPill'); if(p){ p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop'); } if(d>=200) haptic(18); } last=money; }catch(_){} },120); }catch(e){}
```
- 확인
  - 상태 `{day:3,…}`에서 영업 중 판매하면 돈 칩이 통통 튄다.
  - 실제 판매로 확인한다. 콘솔에서 `__T.money`는 읽기만 되고 바꿀 수 없다.
- 진동은 아이폰 PWA에서만 확인할 수 있다 → 보고서에 "실기기 미확인"으로 적는다.

---

## 작업 4 (v2.51) — 세이브 백업 알림 ⏱ 30분

목적: 브라우저 데이터가 지워지면 진행이 날아간다. 7일마다 저장 코드를 복사해 두라고 알린다.

새 블록:
```js
/* ===== v2.51: 7일마다 저장 코드 백업 알림 (영업 준비창 위쪽 작은 줄) ===== */
(function(){ const _s=startDayModal; startDayModal=function(){ const r=_s.apply(this,arguments);
  try{ const go=$('dayGo'); if(!go||$('bakRow')||S.day<3) return r; const now=Date.now(); if(S.bakAt&&now-S.bakAt<7*864e5) return r;
    const d=document.createElement('button'); d.id='bakRow'; d.style.cssText='display:block;width:100%;margin:6px 0;height:32px;border:0;border-radius:10px;font:900 12px var(--b);color:#2a3a5a;background:#e3ecfa';
    d.textContent='💾 진행 백업하기 (저장 코드 복사) — 7일마다 권장';
    d.onclick=e=>{ e.stopPropagation(); S.bakAt=Date.now(); try{ save(); }catch(_){} openSave(); };
    const h2=$('mbox').querySelector('h2'); if(h2) h2.after(d); else go.before(d); }catch(e){} return r; }; })();
```
- 확인
  - 상태 `{day:5,…}`(bakAt 없음) → 준비창 위쪽에 파란 백업 줄이 보인다.
  - 누르면 저장 코드 창이 열린다. 닫고 다음 날 준비창에서는 줄이 사라진다.
  - 콘솔 `__H.S.bakAt`에 숫자가 들어간다.
- 작업 1의 분홍 버튼과 순서가 겹쳐도 괜찮다(둘 다 보이면 됨).

---

## 작업 5 (v2.52) — 연승할수록 좋은 상자 ⏱ 30분

위치: `function lpOnResult(` 안에서 아래 문자열을 찾는다(1번만 있음).
```
const roll=Math.random(), odds=stars>=3?[0.25,0.75]:stars===2?[0.5,0.9]:[0.7,0.97];
```
다음으로 바꾼다.
```
const roll=Math.min(0.999,Math.random()+Math.min(0.24,Math.max(0,(L.streak||1)-1)*0.06)), odds=stars>=3?[0.25,0.75]:stars===2?[0.5,0.9]:[0.7,0.97];
```
→ 2연승부터 +6%씩 레어·에픽 확률이 오르고, 최대 +24%(5연승)다.

결과창 안내: `function lpResultHTML(R)` 안에서 아래 문자열을 찾는다(1번만 있음).
```
<span>🔥 '+R.streak+'연승'+
```
다음으로 바꾼다.
```
<span>🔥 '+R.streak+'연승'+(R.streak>=2?' · 🎁 상자 확률 +'+Math.min(24,(R.streak-1)*6)+'%':'')+
```

- 확인
  - 상태 `{day:3,lp:{streak:4,best:4,chests:0,fever:0},…}` → 영업 시작
  - 콘솔에서 `__T.rev=__T.dayCfg(3).goal*1.3; __T.comp=0; __H.endNow();`
  - 결과창에 "상자 확률 +24%"(5연승)가 보인다.

---

## 작업 6 (v2.53) — 주간 목표 (7일 ★15 → 큰 보상) ⏱ 60분

- 규칙: `S.day`를 7일 단위로 묶는다(주차 = `Math.floor(S.day/7)`). 그 7일의 별 합이 15 이상이면 보상을 한 번 준다.
  - 보상: `Math.round(dayCfg(S.day).goal*2)` 달러와 FEVER 시작(`S.lp.fever=1`)
  - 이미 받은 주차는 `S.wkGoal[주차]=1`로 기록한다.
- 새 블록:
```js
/* ===== v2.53: 주간 목표 — 7일 동안 ★15 모으면 큰 보상 ===== */
function wgWeek(){ return Math.floor((S.day||0)/7); }
function wgStars(){ const w=wgWeek(); let n=0; for(let d=w*7;d<w*7+7;d++) n+=(S.dayStars&&S.dayStars[d])||0; return n; }
function wgRow(){ const w=wgWeek(), n=wgStars(), done=S.wkGoal&&S.wkGoal[w], left=7-((S.day||0)%7);
  return '<div id="wgRow" style="margin:6px 0;padding:8px 12px;border-radius:12px;background:'+(done?'#e8f7e8':'#fff4d6')+';text-align:left;font:800 13px var(--b);color:#4a3a10">🏆 주간 목표 ★'+Math.min(n,15)+'/15 '+(done?'· 보상 받음 ✅':'· 남은 '+left+'일 · 보상 $'+Math.round(dayCfg(S.day).goal*2)+' + FEVER')+
    '<i style="display:block;height:6px;border-radius:4px;background:#fff;margin-top:4px;overflow:hidden"><i style="display:block;height:100%;width:'+Math.min(100,Math.round(n/15*100))+'%;background:#ffb020"></i></i></div>'; }
function wgCheck(){ try{ const w=wgWeek(); S.wkGoal=S.wkGoal||{}; if(S.wkGoal[w]||wgStars()<15) return; S.wkGoal[w]=1; const v=Math.round(dayCfg(S.day).goal*2); money+=v; S.lp=S.lp||{}; S.lp.fever=1; save(); setTimeout(()=>{ try{ bigBanner('🏆 주간 목표 달성!','+$'+v+' · 다음 영업 FEVER'); confetti(player.pos.x,2.5,player.pos.z); snd('level_up',0.6); }catch(_){} },900); }catch(e){} }
(function(){ const _s=startDayModal; startDayModal=function(){ const r=_s.apply(this,arguments);
  try{ if(S.day>=1&&!$('wgRow')){ const go=$('dayGo'); if(go) go.insertAdjacentHTML('beforebegin',wgRow()); } }catch(e){} return r; }; })();
(function(){ const _r=showResult; showResult=function(){ const r=_r.apply(this,arguments); setTimeout(wgCheck,400); return r; }; })();
```
- 주의: 영업 준비창이 길어지면 작업 1처럼 시작 버튼이 가려질 수 있다. 375×667에서 '영업 시작'이 안 보이면 `go.insertAdjacentHTML('beforebegin',…)`를 `$('mbox').insertAdjacentHTML('beforeend',…)`로 바꾼다(맨 아래로).
- 확인
  - 상태 `{day:6,dayStars:[3,3,3,3,3,0],…}` → 준비창에 "주간 목표 ★15/15"가 보인다.
  - 영업 시작 → `__T.rev=__T.dayCfg(6).goal*1.3; __T.comp=0; __H.endNow();` → 결과 뒤 "주간 목표 달성!" 배너가 뜨고 돈이 늘어난다.
  - 다음 날 준비창에 "보상 받음 ✅"이 보인다. 같은 주에 두 번 받지 않는다.

---

## 마지막: 보고서

`PICKLE_REPORT_night.md`를 만들어 커밋한다. 작업마다 아래를 적는다.
- ✅/⏭(건너뜀)/❌
- 실행해서 확인한 것 (크롬 크기, 확인 내용, 스크린샷 파일명은 `shots_night/작업번호_설명.png`로 커밋)
- 코드만 넣은 것
- 확인 못 한 것 (실기기 진동, Node 테스트 등)
- 커밋 해시

**하지 말 것**: 난이도(`HARDK`), 상점 가격, 황금 손님 확률, 자동화 비용은 건드리지 않는다. 이 값들은 Claude가 봇 시뮬레이터로 실측한 뒤 조정한다.
