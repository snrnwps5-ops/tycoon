/* =====================================================================
   테크 스토어 타이쿤 — HQ UI 모듈 (면접실 · 지점 대시보드 · 본사 전직 품의서)
   - 자체 오버레이(#hqui)를 쓰므로 기존 #modal / quizOpen 흐름과 충돌하지 않습니다.
   - 게임 상태는 HQUI.init(어댑터)로만 접근합니다. 전역 변수에 직접 손대지 않습니다.
   - 신규 저장 필드: S.branches, S.hqStaff, S.interview (없으면 기본값 생성, 기존 필드 변경 없음)
   - 지점 매출 값은 HQUI.branchIncome(id) / HQUI.otherBranchesIncome()가 제공하고,
     실제 현금 정산(입금)은 하루 영업이 끝날 때 tech.html의 showResult()가 합니다(v2.25).
   ===================================================================== */
(function(){
'use strict';
var A=null;                               // adapter
var $=function(id){ return document.getElementById(id); };
var esc=function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
var fmt=function(n){ return '$'+Math.round(n).toLocaleString(); };
var rnd=function(a){ return a[Math.floor(Math.random()*a.length)]; };
var clamp=function(v,a,b){ return Math.max(a,Math.min(b,v)); };
function S(){ return A.S; }
function call(name){ var f=A[name]; if(typeof f!=='function') return undefined; try{ return f.apply(null,[].slice.call(arguments,1)); }catch(e){ console.warn('HQUI adapter '+name,e); } }

/* ---------------- schema ---------------- */
/* v2.25: openDay를 게임 스테이지 개막일과 1:1로 맞췄습니다. S.day는 0부터 시작하므로 openDay = 그 지점의 첫 영업일 인덱스입니다.
   daegu 0(DAY 1) · busan 4(DAY 5) · seoul 8(DAY 9) · icn 11(DAY 12) · nyc 15(DAY 16) — tech.html의 STAGE_OF(d<4,8,11,15,19)와 같은 경계입니다. */
var BRANCHES=[
  {id:'daegu', name:'대구 동성로점', icon:'🏙️', base:120, openDay:0,  stage:0},
  {id:'busan', name:'부산 센텀점', icon:'🌊', base:260, openDay:4,  stage:1},
  {id:'seoul', name:'서울 강남스퀘어점', icon:'🗼', base:520, openDay:8,  stage:2},
  {id:'icn',   name:'인천공항점', icon:'✈️', base:820, openDay:11, stage:3},
  {id:'nyc',   name:'뉴욕 타임스퀘어점', icon:'🗽', base:1200, openDay:15, stage:4}
];
var CFG={ upMax:5, upCost:function(b,lv){ return Math.round(b.base*4*Math.pow(1.7,lv-1)); }, visitNps:3, staffMax:6, staffCost:function(b,n){ return Math.round(b.base*1.5*(1+n*0.4)); } };
function ensure(){ var s=S();
  if(!s.branches||typeof s.branches!=='object') s.branches={};
  BRANCHES.forEach(function(b){ var o=s.branches[b.id]; if(!o) o=s.branches[b.id]={}; if(o.lv==null) o.lv=1; if(o.staff==null) o.staff=2; if(o.nps==null) o.nps=20; if(o.mgr===undefined) o.mgr=null; if(o.visitDay===undefined) o.visitDay=-1; });
  if(!Array.isArray(s.hqStaff)) s.hqStaff=[];
  if(!s.interview||typeof s.interview!=='object') s.interview={};
  var iv=s.interview; if(!Array.isArray(iv.pool)) iv.pool=[]; if(!Array.isArray(iv.log)) iv.log=[]; if(iv.cur===undefined) iv.cur=null; if(iv.n==null) iv.n=0;
  return s; }
function branchOpen(b){ return (S().day||0)>=b.openDay; }
function branchIncome(id){ ensure(); var b=BRANCHES.filter(function(x){ return x.id===id; })[0]; if(!b||!branchOpen(b)) return 0; var o=S().branches[id];
  return Math.round(b.base*(1+0.35*(o.lv-1))*(1+0.08*o.staff)*(o.mgr?1.2:1)*(0.8+clamp(o.nps,-100,100)/250)); }
/* v2.25: 현재 플레이 중인 매장(스테이지) 판정 — 게임의 STAGE_OF와 같은 경계(d<4/8/11/15/19)를 씁니다. */
function stageOfDay(d){ d=d||0; return d<4?0:d<8?1:d<11?2:d<15?3:d<19?4:5; }
function currentBranch(){ var st=stageOfDay(S().day||0); return BRANCHES.filter(function(b){ return b.stage===st; })[0]||null; }
function currentBranchId(){ var b=currentBranch(); return b?b.id:null; }
/* 현재 매장은 플레이어가 직접 영업하므로 자동 매출에서 빼고, 오픈된 '다른' 지점의 일일 자동 매출만 합산합니다.
   curStageId에는 지점 id('busan') 또는 스테이지 번호(1)를 넣을 수 있고, 생략하면 S.day에서 현재 매장을 구합니다. */
function otherBranchesIncome(curStageId){
  ensure(); var curId=null;
  if(curStageId==null) curId=currentBranchId();
  else if(typeof curStageId==='number'){ var sb=BRANCHES.filter(function(b){ return b.stage===curStageId; })[0]; curId=sb?sb.id:null; }
  else curId=String(curStageId);
  return BRANCHES.reduce(function(a,b){ return b.id===curId?a:a+branchIncome(b.id); },0);
}
function autoIncomeTotal(){ return otherBranchesIncome(); }
function npsShare(id){ var o=S().branches[id]; return Math.round(o.nps*(0.5+0.1*o.staff)); }

/* ---------------- overlay ---------------- */
var CSS='\
#hqui{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:rgba(8,14,34,.62);padding:calc(env(safe-area-inset-top,0px) + 10px) 10px calc(env(safe-area-inset-bottom,0px) + 10px);box-sizing:border-box;font-family:"Noto Sans KR",system-ui,sans-serif;-webkit-tap-highlight-color:transparent}\
#hqui.on{display:flex}\
#hqui *{box-sizing:border-box}\
#hqbox{width:100%;max-width:440px;max-height:100%;display:flex;flex-direction:column;background:#fffaf0;border-radius:24px;box-shadow:0 8px 0 rgba(0,0,0,.25),0 20px 50px rgba(0,0,0,.45);overflow:hidden;animation:hqin .28s cubic-bezier(.2,1.3,.4,1);word-break:keep-all;overflow-wrap:anywhere;color:#3a2a1a}\
@keyframes hqin{0%{transform:translateY(24px) scale(.96);opacity:0}}\
.hqh{flex:none;display:flex;align-items:center;gap:8px;padding:12px 14px;color:#fff;background:linear-gradient(#27386b,#1b2748)}\
.hqh h2{flex:1;margin:0;font-family:"Black Han Sans","Noto Sans KR",sans-serif;font-weight:400;font-size:21px;line-height:1.15}\
.hqh small{display:block;font:700 11px "Noto Sans KR",sans-serif;color:#c9d6ff;margin-top:2px}\
.hqx{flex:none;width:38px;height:38px;border:0;border-radius:12px;background:rgba(255,255,255,.16);color:#fff;font-size:18px;font-weight:900}\
.hqb{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px 12px 6px;touch-action:pan-y}\
.hqf{flex:none;padding:8px 12px 12px;display:flex;gap:8px;flex-wrap:wrap}\
.hqbtn{flex:1;min-width:96px;min-height:48px;border:0;border-radius:14px;padding:10px 8px;font-family:"Black Han Sans","Noto Sans KR",sans-serif;font-size:16px;color:#fff;background:linear-gradient(#7bea62,#2faa45);box-shadow:0 4px 0 #1d7a2a}\
.hqbtn:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.3)}\
.hqbtn.r{background:linear-gradient(#ff8a7a,#e8342a);box-shadow:0 4px 0 #8a1010}.hqbtn.b{background:linear-gradient(#5aa8ff,#2f6fd8);box-shadow:0 4px 0 #1c3f9a}.hqbtn.y{background:linear-gradient(#ffcf4d,#ff8a1a);box-shadow:0 4px 0 #b85a00}.hqbtn.g{background:linear-gradient(#b8c2d0,#8a96a8);box-shadow:0 4px 0 #5a6578}\
.hqbtn:disabled{filter:grayscale(1);opacity:.55}\
.hqbtn small{display:block;font:800 11px "Noto Sans KR",sans-serif;opacity:.92}\
.hqcard{background:#fff;border-radius:16px;padding:10px 12px;margin-bottom:10px;box-shadow:0 3px 0 rgba(0,0,0,.08)}\
.hqcard h3{margin:0 0 4px;font:900 15px "Noto Sans KR",sans-serif;color:#1b2748}\
.hqrow{display:flex;justify-content:space-between;gap:8px;padding:4px 0;font:700 13px "Noto Sans KR",sans-serif;border-bottom:1px dashed #ece4d4}.hqrow:last-child{border-bottom:0}.hqrow b{font-weight:900;color:#1b2748;text-align:right}\
.hqtag{display:inline-block;font:900 11px "Noto Sans KR",sans-serif;border-radius:8px;padding:2px 7px;color:#fff;background:#2f6fd8;margin-right:4px}\
.hqtag.gd{background:#2faa45}.hqtag.wn{background:#e89a10}.hqtag.bd{background:#e8342a}.hqtag.gy{background:#8a96a8}\
.hqsteps{display:flex;gap:4px;margin-bottom:10px}.hqsteps i{flex:1;font-style:normal;text-align:center;font:900 11px "Noto Sans KR",sans-serif;padding:6px 2px;border-radius:10px;background:#e9e2d2;color:#8a7a6a}.hqsteps i.on{background:#27386b;color:#fff}.hqsteps i.ok{background:#2faa45;color:#fff}\
.hqq{font:900 14px "Noto Sans KR",sans-serif;color:#1b2748;margin:2px 0 6px}\
.hqa{position:relative;background:#eef3ff;border-radius:14px;padding:10px 12px;font:700 14px/1.6 "Noto Sans KR",sans-serif;color:#2a3344}\
.hqa:before{content:"";position:absolute;left:18px;top:-7px;border:7px solid transparent;border-top:0;border-bottom-color:#eef3ff}\
.hqhint{margin-top:8px;background:#fff6dc;border-radius:12px;padding:8px 10px;font:700 12px/1.5 "Noto Sans KR",sans-serif;color:#7a4a10}\
.hqface{flex:none;width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;background:#e6edff;border:3px solid #fff;box-shadow:0 2px 0 rgba(0,0,0,.15)}\
.hqpro{display:flex;gap:10px;align-items:center}\
.hqbar{height:8px;border-radius:4px;background:#e9e2d2;overflow:hidden;margin-top:3px}.hqbar s{display:block;height:100%;border-radius:4px;background:#2f6fd8}\
.hqgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media (max-width:359px){.hqgrid{grid-template-columns:1fr}}\
.hqbr{background:#fff;border-radius:16px;padding:10px;box-shadow:0 3px 0 rgba(0,0,0,.08);display:flex;flex-direction:column;gap:5px}\
.hqbr.lock{opacity:.6}\
.hqbr h3{margin:0;font:900 14px "Noto Sans KR",sans-serif;color:#1b2748}\
.hqbr .inc{font-family:"Black Han Sans","Noto Sans KR",sans-serif;font-size:22px;color:#2faa45;line-height:1}\
.hqbr .inc small{font:800 11px "Noto Sans KR",sans-serif;color:#8a7a6a}\
.hqbr .m{font:700 12px "Noto Sans KR",sans-serif;color:#5a4a3a;display:flex;justify-content:space-between}\
.hqbr .hqbtn{min-height:40px;min-width:0;font-size:13px;padding:6px 4px}\
.hqsum{display:flex;gap:8px;margin-bottom:10px}.hqsum div{flex:1;background:#1b2748;color:#fff;border-radius:14px;padding:8px 6px;text-align:center}.hqsum b{display:block;font-family:"Black Han Sans","Noto Sans KR",sans-serif;font-weight:400;font-size:19px;color:#ffd98a}.hqsum small{font:800 11px "Noto Sans KR",sans-serif;color:#c9d6ff}\
.hqdoc{background:#fff;border:2px solid #d8cdb8;border-radius:6px;padding:14px 14px 12px;font:700 13px/1.65 "Noto Sans KR",sans-serif;color:#2a2a2a;position:relative}\
.hqdoc h3{margin:0 0 8px;text-align:center;font-family:"Black Han Sans","Noto Sans KR",sans-serif;font-weight:400;font-size:20px;letter-spacing:6px;color:#1b2748}\
.hqdoc table{width:100%;border-collapse:collapse;margin:6px 0}.hqdoc td{border:1px solid #d8cdb8;padding:5px 7px;font-size:12px}.hqdoc td:first-child{width:34%;background:#f6f0e2;font-weight:900}\
.hqsig{margin-top:10px;display:flex;align-items:flex-end;justify-content:flex-end;gap:8px;min-height:54px}\
.hqsig span{font:800 12px "Noto Sans KR",sans-serif;color:#8a7a6a}\
.hqsig svg{width:150px;height:54px;border-bottom:2px solid #2a2a2a}\
.hqsig path{fill:none;stroke:#1b2748;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:420;stroke-dashoffset:420}\
.hqsig.go path{animation:hqsign 1.1s ease-out forwards}@keyframes hqsign{to{stroke-dashoffset:0}}\
.hqstamp{position:absolute;right:14px;top:12px;width:64px;height:64px;border-radius:50%;border:4px solid #e8342a;color:#e8342a;display:flex;align-items:center;justify-content:center;font-family:"Black Han Sans","Noto Sans KR",sans-serif;font-size:17px;transform:rotate(-14deg) scale(2.2);opacity:0}\
.hqstamp.go{animation:hqst .35s cubic-bezier(.3,1.5,.5,1) forwards}.hqstamp.no{border-color:#5a6578;color:#5a6578}@keyframes hqst{to{transform:rotate(-14deg) scale(1);opacity:.9}}\
.hqoff{display:flex;gap:8px;margin-top:8px}.hqoff button{flex:1;border:2px solid #d8cdb8;background:#fff;border-radius:14px;padding:8px 4px;font:900 13px "Noto Sans KR",sans-serif;color:#1b2748;min-height:64px}.hqoff button.on{border-color:#2f6fd8;background:#eef3ff;box-shadow:0 0 0 2px #2f6fd8}.hqoff small{display:block;font:700 11px "Noto Sans KR",sans-serif;color:#5a4a3a;margin-top:2px}\
.hqmsg{min-height:18px;font:900 12px "Noto Sans KR",sans-serif;color:#e8342a;text-align:center;padding:2px 12px}\
';
function mount(){ if($('hqui')) return; var st=document.createElement('style'); st.id='hqui-css'; st.textContent=CSS; document.head.appendChild(st);
  var d=document.createElement('div'); d.id='hqui'; d.innerHTML='<div id="hqbox"></div>'; (document.getElementById('app')||document.body).appendChild(d);
  d.addEventListener('pointerdown',function(e){ e.stopPropagation(); }); d.addEventListener('touchstart',function(e){ e.stopPropagation(); },{passive:true}); }
var onClose=null;
function show(title,sub,body,foot,handlers){ mount(); ensure();
  $('hqbox').innerHTML='<div class="hqh"><div style="flex:1"><h2>'+title+'</h2>'+(sub?'<small>'+sub+'</small>':'')+'</div><button class="hqx" data-hq="close" aria-label="닫기">✕</button></div><div class="hqb">'+body+'</div><div class="hqmsg" id="hqmsg"></div>'+(foot?'<div class="hqf">'+foot+'</div>':'');
  $('hqui').classList.add('on'); call('onOpen');
  $('hqbox').onclick=function(e){ var t=e.target.closest('[data-hq]'); if(!t||t.disabled) return; var k=t.getAttribute('data-hq'); if(k==='close'){ close(); return; } var h=handlers&&handlers[k]; if(h) h(t); }; }
function close(){ var el=$('hqui'); if(!el) return; el.classList.remove('on'); $('hqbox').innerHTML=''; call('save'); call('onClose'); if(onClose){ var f=onClose; onClose=null; f(); } }
function isOpen(){ var el=$('hqui'); return !!(el&&el.classList.contains('on')); }
function msg(t,ok){ var m=$('hqmsg'); if(m){ m.textContent=t||''; m.style.color=ok?'#2faa45':'#e8342a'; } }
function sfx(k,v,r){ call('snd',k,v,r); }
function signSVG(){ return '<svg viewBox="0 0 150 54"><path d="M8 40 C18 8 30 8 28 34 C26 50 40 14 50 26 C58 36 60 40 68 28 C76 16 80 44 90 30 C98 18 104 40 114 30 C122 22 130 34 142 24"/></svg>'; }

/* =====================================================================
   1. AI 채용 면접실
   ===================================================================== */
var IV_STAGE=['1차 서류','2차 컬처핏','3차 실무','4차 최종'];
var IV_ROLE={runner:'재고 담당',tech:'수리 기사',spec:'상담 전문가',greet:'입구 안내',mgr:'매니저'};
var IV_NAME=['김도윤','이서연','박지호','최하은','정민재','한유나','오건우','윤서아','장도현','임지안','신은우','배수아'];
var IV_FACE=['🧑','👩','👨','🧑‍🦱','👩‍🦰','🧔','👱‍♀️','👨‍🦲'];
var IV_Q=[
 {q:'이력서 요약',good:['전자제품 매장 3년 근무, 월 고객 만족도 상위 10%를 여러 번 받았습니다. 재고 실사 오차를 절반으로 줄인 경험이 있어요.','수리 센터에서 2년간 하루 평균 15건을 처리했고, 재수리율을 낮추는 체크리스트를 직접 만들었습니다.'],
   mid:['편의점과 카페에서 2년 일했습니다. 전자제품 경험은 없지만 손님 응대는 익숙합니다.','판매 경력 1년입니다. 실적은 평균 정도였고 지각은 없었습니다.'],
   bad:['이것저것 조금씩 해 봤습니다. 오래 다닌 곳은 없어요. 자세한 건 기억이 잘…','경력 사항은 비워 뒀습니다. 일단 뽑아 주시면 열심히 하겠습니다.'],
   hint:['경력 기간과 구체적인 숫자(건수, 순위)가 있는지 보세요.','근속 기간이 짧은 이유를 설명하는지 확인하세요.']},
 {q:'바쁜 날 동료가 실수로 손님을 화나게 했습니다. 어떻게 하시겠어요?',good:['먼저 손님께 사과드리고 제가 이어서 응대합니다. 동료에게는 손님이 가신 뒤에 조용히 무엇이 어긋났는지 같이 짚어 보겠습니다.','손님 문제부터 해결하고, 같은 일이 반복되지 않게 팀 공유 메모에 상황과 대처를 남기겠습니다.'],
   mid:['일단 매니저님을 부르겠습니다. 제가 나서면 더 꼬일 수 있으니까요.','동료를 도와주긴 하겠지만 제 손님이 먼저입니다.'],
   bad:['제 실수가 아니니 지켜보겠습니다. 각자 책임지는 게 맞죠.','손님 앞에서 동료가 잘못했다고 분명히 말해 주겠습니다.'],
   hint:['손님 해결을 먼저 하고, 동료를 공개적으로 탓하지 않는지 보세요.','책임을 떠넘기는 말투인지 들어 보세요.']},
 {q:'손님이 "배터리가 반나절도 안 가요"라고 합니다. 무엇부터 확인하나요?',good:['배터리 성능 수치와 최근 업데이트 여부, 백그라운드 사용량을 먼저 봅니다. 교체가 필요하면 수리 전에 데이터 백업 여부부터 확인합니다.','증상이 언제부터인지 묻고 진단을 돌립니다. 소프트웨어 문제면 설정으로 해결하고, 하드웨어면 정품 부품 재고를 확인한 뒤 접수합니다.'],
   mid:['배터리를 교체하면 될 것 같습니다. 재고가 있으면 바로 진행하겠습니다.','충전기를 바꿔 보시라고 안내하겠습니다.'],
   bad:['새 기기로 바꾸시라고 권하겠습니다. 그게 제일 빠릅니다.','원래 그 정도 갑니다. 문제없다고 말씀드리겠습니다.'],
   hint:['진단 → 백업 확인 → 부품 순서를 아는지 보세요.','확인 없이 교체나 구매를 권하는지 들어 보세요.']},
 {q:'우리 매장에서 3년 뒤 어떤 모습이고 싶으신가요? 그리고 저희에게 묻고 싶은 것은요?',good:['후배를 가르칠 수 있는 선임이 되고 싶습니다. 질문은, 이 매장에서 가장 자주 생기는 민원이 무엇인지와 제가 첫 달에 배워야 할 것이 궁금합니다.','지점 운영을 맡아 보고 싶습니다. 교육 과정이 어떻게 되어 있는지, 평가 기준이 무엇인지 여쭙고 싶습니다.'],
   mid:['꾸준히 다니고 싶습니다. 질문은 특별히 없습니다.','잘 모르겠지만 열심히 하겠습니다. 휴무는 어떻게 되나요?'],
   bad:['여기는 잠깐 거쳐 가는 곳이라고 생각합니다. 급여는 바로 올려 주시나요?','3년이나 있을 생각은 없습니다. 질문은 없어요.'],
   hint:['성장 계획이 구체적인지, 매장에 관심 있는 질문을 하는지 보세요.','오래 일할 의사가 있는지 확인하세요.']}
];
function ivNew(role){ var s=ensure(); s.interview.n++; var q=Math.random(); var tier=q<0.3?'bad':q<0.7?'mid':'good';
  var base={runner:20,tech:30,spec:35,greet:18,mgr:45}[role]||25; var day=s.day||0;
  // 답변은 실력과 대체로 일치하지만 단계마다 20% 확률로 한 단계 어긋납니다(겉만 번지르르 / 긴장한 실력자)
  var ans=IV_Q.map(function(Q){ var t=tier; if(Math.random()<0.2) t=tier==='good'?'mid':tier==='bad'?'mid':(Math.random()<0.5?'good':'bad'); return {t:t,text:rnd(Q[t]),hint:rnd(Q.hint)}; });
  return {id:s.interview.n, name:rnd(IV_NAME), face:rnd(IV_FACE), role:role, tier:tier, ans:ans, stage:0, grade:[], review:2, shown:{}, wage:Math.round(base*(1+day*0.02)*(tier==='good'?1.25:tier==='mid'?1:0.85)), day:day}; }
function ivStats(c){ var k={good:[1.15,0.95],mid:[1.0,0.88],bad:[0.85,0.78]}[c.tier]; return {spd:k[0],acc:k[1]}; }
function openInterviewModal(role,done){ ensure(); var s=S(); role=IV_ROLE[role]?role:'runner'; onClose=done||null;
  if(!s.interview.cur||s.interview.cur.role!==role||s.interview.cur.closed) s.interview.cur=ivNew(role);
  ivRender(); }
function ivHead(c){ return '<div class="hqsteps">'+IV_STAGE.map(function(n,i){ return '<i class="'+(i<c.stage?'ok':i===c.stage?'on':'')+'">'+(i<c.stage?'✓ ':'')+n+'</i>'; }).join('')+'</div><div class="hqcard hqpro"><div class="hqface">'+c.face+'</div><div style="flex:1"><h3>'+esc(c.name)+' <span class="hqtag">'+IV_ROLE[c.role]+' 지원</span></h3><div style="font:700 12px \'Noto Sans KR\',sans-serif;color:#5a4a3a">희망 일급 '+fmt(c.wage)+' · 지원 번호 #'+c.id+'</div></div></div>'; }
function ivRender(){ var s=S(), c=s.interview.cur; if(!c) return;
  if(c.stage>=4){ ivOffer(); return; }
  var a=c.ans[c.stage], Q=IV_Q[c.stage];
  var body=ivHead(c)+'<div class="hqcard"><div class="hqq">'+(c.stage===0?'📄 ':'🎙️ ')+esc(Q.q)+'</div><div class="hqa">'+esc(a.text)+'</div>'+(c.shown[c.stage]?'<div class="hqhint">🔎 AI 면접 보조: '+esc(a.hint)+'</div>':'')+'</div><div style="font:700 12px \'Noto Sans KR\',sans-serif;color:#8a7a6a;text-align:center">답변을 듣고 이 단계의 결과를 정하세요 · 재검토 '+c.review+'회 남음</div>';
  show('AI 채용 면접실',IV_STAGE[c.stage]+' 전형 · 영업과 분리된 공간이에요',body,
    '<button class="hqbtn" data-hq="pass">합격</button><button class="hqbtn y" data-hq="review" '+(c.review<=0||c.shown[c.stage]?'disabled':'')+'>재검토<small>보조 의견 보기</small></button><button class="hqbtn r" data-hq="fail">불합격</button>',
    {pass:function(){ c.grade.push(a.t); c.stage++; sfx('ui',0.4,1.3); ivRender(); },
     review:function(){ c.review--; c.shown[c.stage]=1; sfx('ui',0.4,1.0); ivRender(); },
     fail:function(){ ivEnd(c,'reject'); }}); }
function ivEnd(c,how,offer){ var s=S(); c.closed=1; s.interview.log.push({id:c.id,name:c.name,role:c.role,tier:c.tier,result:how,day:s.day||0}); if(s.interview.log.length>30) s.interview.log.shift();
  if(how==='declined') return;   // 오퍼 거절 화면은 호출한 쪽(ivOffer sign)에서 그립니다
  if(how==='reject'){ var lost=c.tier==='good'; sfx('ui',0.4,0.6);
    show('AI 채용 면접실','전형 종료','<div class="hqcard" style="text-align:center"><div style="font-size:40px">'+(lost?'😢':'👌')+'</div><h3>'+esc(c.name)+' 지원자를 불합격 처리했어요</h3><p style="font:700 13px/1.6 \'Noto Sans KR\',sans-serif;margin:6px 0 0">'+(lost?'알고 보니 실력이 뛰어난 지원자였어요. 답변 한두 개만 보고 판단하지 않았는지 돌아보세요.':c.tier==='bad'?'좋은 판단이에요. 매장에 맞지 않는 지원자였어요.':'무난한 지원자였어요. 다음 지원자를 만나 보세요.')+'</p></div>',
      '<button class="hqbtn b" data-hq="next">다음 지원자</button><button class="hqbtn g" data-hq="close">나가기</button>',{next:function(){ s.interview.cur=ivNew(c.role); ivRender(); }}); return; }
  // hired
  var st=ivStats(c), rec={name:c.name,role:c.role,spd:st.spd,acc:st.acc,wage:offer.wage,rsu:offer.rsu,vest:offer.vest,tier:c.tier,day:s.day||0};
  var handled=call('onHire',rec,c); if(handled!==true) s.interview.pool.push(rec);
  call('save'); }
function ivOffer(){ var s=S(), c=s.interview.cur; var packs=[{k:'a',n:'기본형',wage:c.wage,rsu:0,vest:0,d:'희망 일급 그대로'},{k:'b',n:'균형형',wage:Math.round(c.wage*0.92),rsu:20,vest:10,d:'일급 -8% + RSU 20주'},{k:'c',n:'주식형',wage:Math.round(c.wage*0.82),rsu:60,vest:20,d:'일급 -18% + RSU 60주'}]; var sel=c.pack||'a';
  var draw=function(){ var p=packs.filter(function(x){ return x.k===sel; })[0];
    var body=ivHead(c)+'<div class="hqdoc"><div class="hqstamp" id="hqstamp">합격</div><h3>오퍼 레터</h3><div>'+esc(c.name)+' 님께,<br>노바 테크 스토어 <b>'+IV_ROLE[c.role]+'</b> 직무에 최종 합격하셨음을 알려 드립니다.</div><table><tr><td>기본급(일급)</td><td><b>'+fmt(p.wage)+'</b></td></tr><tr><td>RSU 주식 옵션</td><td><b>'+(p.rsu?p.rsu+'주':'없음')+'</b>'+(p.rsu?' · '+p.vest+'영업일 근속 시 지급':'')+'</td></tr><tr><td>근무 시작</td><td>DAY '+((s.day||0)+1)+'</td></tr></table><div class="hqsig" id="hqsig"><span>대표 서명</span>'+signSVG()+'</div></div><div class="hqoff">'+packs.map(function(x){ return '<button data-hq="pk" data-k="'+x.k+'" class="'+(x.k===sel?'on':'')+'">'+x.n+'<small>'+x.d+'</small></button>'; }).join('')+'</div><div style="font:700 11px \'Noto Sans KR\',sans-serif;color:#8a7a6a;text-align:center;margin-top:6px">RSU는 급여 부담을 줄이지만, 근속 기간을 채우면 주식으로 지급해야 해요</div>';
    show('AI 채용 면접실','4차 통과 · 오퍼 조건을 정하고 서명하세요',body,'<button class="hqbtn" data-hq="sign">서명하고 오퍼 보내기</button><button class="hqbtn g" data-hq="back">보류</button>',
      {pk:function(t){ sel=t.getAttribute('data-k'); c.pack=sel; draw(); },
       back:function(){ close(); },
       sign:function(t){ t.disabled=true; $('hqsig').classList.add('go'); sfx('ui',0.4,1.5);
         setTimeout(function(){ var p2=packs.filter(function(x){ return x.k===sel; })[0];
           // 뛰어난 지원자는 조건이 너무 낮으면 거절할 수 있습니다
           var accept=!(c.tier==='good'&&sel==='c'&&Math.random()<0.5);
           if(!accept){ ivEnd(c,'declined'); sfx('ui',0.4,0.6);
             show('AI 채용 면접실','오퍼 결과','<div class="hqcard" style="text-align:center"><div style="font-size:40px">✉️</div><h3>'+esc(c.name)+' 님이 오퍼를 거절했어요</h3><p style="font:700 13px/1.6 \'Noto Sans KR\',sans-serif;margin:6px 0 0">"다른 곳에서 더 좋은 조건을 받았습니다." 실력 있는 지원자에게는 기본급을 너무 낮추지 마세요.</p></div>','<button class="hqbtn b" data-hq="next">다음 지원자</button><button class="hqbtn g" data-hq="close">나가기</button>',{next:function(){ s.interview.cur=ivNew(c.role); ivRender(); }}); return; }
           var st=$('hqstamp'); if(st) st.classList.add('go'); sfx('level_up',0.5,1.2); ivEnd(c,'hired',p2); msg(c.name+' 님이 오퍼에 서명했어요! 합격자 명단에 등록됐어요',true);
           var f=document.querySelector('#hqbox .hqf'); if(f) f.innerHTML='<button class="hqbtn b" data-hq="close">확인</button>'; },1200); }}); };
  draw(); }

/* =====================================================================
   2. 지점 관리 대시보드
   ===================================================================== */
function openBranchModal(done){ ensure(); onClose=done||null; brRender(); }
function brRender(){ var s=S(), day=s.day||0; var open=BRANCHES.filter(branchOpen); var tot=otherBranchesIncome(), curId=currentBranchId();
  var nps=open.length?Math.round(open.reduce(function(a,b){ return a+s.branches[b.id].nps; },0)/open.length):0;
  var cards=BRANCHES.map(function(b){ var o=s.branches[b.id]; if(!branchOpen(b)) return '<div class="hqbr lock"><h3>🔒 '+b.name+'</h3><div class="m"><span>DAY '+(b.openDay+1)+'부터 운영</span></div></div>';
    var cu=CFG.upCost(b,o.lv), cs=CFG.staffCost(b,o.staff), visited=o.visitDay===day, money=call('getMoney')||0, here=(b.id===curId);
    var head='<div class="inc">'+fmt(branchIncome(b.id))+' <small>/일 자동 매출</small></div>';
    if(here) head='<div class="inc" style="font-size:16px;color:#2f6fd8;line-height:1.3">직접 영업 중<small style="display:block;color:#5a4a3a">자동 매출 정산 제외</small></div>';
    return '<div class="hqbr"'+(here?' style="box-shadow:0 0 0 3px #2f6fd8,0 3px 0 rgba(0,0,0,.08)"':'')+'><h3>'+b.icon+' '+b.name+(here?' <span class="hqtag">📍 현재 매장</span>':'')+'</h3>'+head+
      '<div class="m"><span>지점장</span><b>'+(o.mgr?esc(o.mgr):'공석')+'</b></div><div class="m"><span>직원</span><b>'+o.staff+'명</b></div><div class="m"><span>지점 NPS</span><b style="color:'+(o.nps>=50?'#2faa45':o.nps>=0?'#e89a10':'#e8342a')+'">'+(o.nps>0?'+':'')+o.nps+'</b></div><div class="m"><span>통합 NPS 기여</span><b>'+(npsShare(b.id)>0?'+':'')+npsShare(b.id)+'</b></div><div class="m"><span>시설 레벨</span><b>Lv.'+o.lv+(o.lv>=CFG.upMax?' MAX':'')+'</b></div>'+
      '<button class="hqbtn y" data-hq="up" data-id="'+b.id+'" '+(o.lv>=CFG.upMax||money<cu?'disabled':'')+'>'+(o.lv>=CFG.upMax?'업그레이드 완료':'업그레이드 '+fmt(cu))+'</button>'+
      '<button class="hqbtn b" data-hq="staff" data-id="'+b.id+'" '+(o.staff>=CFG.staffMax||money<cs?'disabled':'')+'>'+(o.staff>=CFG.staffMax?'직원 정원 가득':'직원 +1 '+fmt(cs))+'</button>'+
      '<button class="hqbtn" data-hq="visit" data-id="'+b.id+'" '+(visited?'disabled':'')+'>'+(visited?'오늘 시찰 완료':'시찰 방문')+'</button></div>'; }).join('');
  var body='<div class="hqsum"><div><b>'+fmt(tot)+'</b><small>타 지점 자동 매출 합계</small></div><div><b>'+open.length+'/'+BRANCHES.length+'</b><small>운영 지점</small></div><div><b>'+(nps>0?'+':'')+nps+'</b><small>평균 지점 NPS</small></div></div><div class="hqgrid">'+cards+'</div><div style="font:700 11px/1.5 \'Noto Sans KR\',sans-serif;color:#8a7a6a;text-align:center;margin:8px 0 2px">현재 매장은 직접 영업하므로 자동 매출에서 빠져요 · 타 지점 자동 매출은 하루 영업이 끝날 때 현금으로 정산돼요 · 시찰은 지점마다 하루 한 번</div>';
  var find=function(t){ var id=t.getAttribute('data-id'); return {b:BRANCHES.filter(function(x){ return x.id===id; })[0],o:s.branches[id]}; };
  show('지점 관리 대시보드','보유 현금 '+fmt(call('getMoney')||0),body,'<button class="hqbtn g" data-hq="close">닫기</button>',
    {up:function(t){ var r=find(t), c=CFG.upCost(r.b,r.o.lv); if(r.o.lv>=CFG.upMax) return; if(!pay(c)){ msg('현금이 부족해요'); return; } r.o.lv++; sfx('level_up',0.45,1.2); brRender(); msg(r.b.name+' 시설 Lv.'+r.o.lv+' · 자동 매출이 올랐어요',true); },
     staff:function(t){ var r=find(t), c=CFG.staffCost(r.b,r.o.staff); if(r.o.staff>=CFG.staffMax) return; if(!pay(c)){ msg('현금이 부족해요'); return; } r.o.staff++; sfx('coin',0.45,1.1); brRender(); msg(r.b.name+' 직원 '+r.o.staff+'명',true); },
     visit:function(t){ var r=find(t); if(r.o.visitDay===day) return; r.o.visitDay=day; brVisit(r.b,r.o); }}); }
function pay(c){ var m=call('getMoney'); if(typeof m!=='number'||m<c) return false; call('setMoney',m-c); call('save'); return true; }
var VISITS=[
 {q:'진열대에 가격표가 빠진 제품이 여러 개 보입니다.',a:[['직원과 함께 바로 채우고 점검표에 추가하기',1],['지점장에게 메신저로 지적만 남기기',0],['못 본 척 지나가기',-1]]},
 {q:'대기 손님이 많은데 직원 두 명이 창고에서 잡담 중입니다.',a:[['대기 상황을 알리고 한 명은 매장으로 배치하기',1],['손님 앞에서 큰 소리로 혼내기',-1],['본사에 보고서만 올리기',0]]},
 {q:'지점장이 "수리 부품 발주가 자주 늦는다"고 합니다.',a:[['발주 기준 수량을 함께 다시 정하고 자동 발주 켜기',1],['알아서 하라고 하기',-1],['다음 방문 때 보자고 미루기',0]]},
 {q:'신입 직원이 손님 질문에 답을 못 하고 당황합니다.',a:[['옆에서 같이 응대하며 시범 보이기',1],['손님 앞에서 대신 답하고 직원은 돌려보내기',0],['교육이 안 됐다고 지점장 탓하기',-1]]}
];
function brVisit(b,o){ var V=rnd(VISITS), opts=V.a.slice().sort(function(){ return Math.random()-0.5; });
  show('시찰 방문',b.icon+' '+b.name,'<div class="hqcard"><div class="hqq">👀 현장에서 본 것</div><div class="hqa">'+esc(V.q)+'</div></div><div style="display:flex;flex-direction:column;gap:8px">'+opts.map(function(x,i){ return '<button class="hqbtn b" style="font-family:\'Noto Sans KR\',sans-serif;font-weight:900;font-size:14px" data-hq="v" data-i="'+i+'">'+esc(x[0])+'</button>'; }).join('')+'</div>','',
    {v:function(t){ var r=opts[+t.getAttribute('data-i')][1], d=r>0?CFG.visitNps*2:r===0?0:-CFG.visitNps; o.nps=clamp(o.nps+d,-100,100); sfx(r>0?'level_up':'ui',0.45,r>0?1.3:0.6); call('save');
       show('시찰 방문',b.icon+' '+b.name,'<div class="hqcard" style="text-align:center"><div style="font-size:40px">'+(r>0?'👍':r===0?'😐':'😟')+'</div><h3>'+(r>0?'현장 분위기가 좋아졌어요':r===0?'달라진 게 없어요':'직원 사기가 떨어졌어요')+'</h3><p style="font:700 13px \'Noto Sans KR\',sans-serif;margin:6px 0 0">지점 NPS '+(d>0?'+':'')+d+' → '+(o.nps>0?'+':'')+o.nps+'</p></div>','<button class="hqbtn b" data-hq="back">대시보드로</button>',{back:function(){ brRender(); }}); }}); }

/* =====================================================================
   3. 직원 자발적 본사 전직 품의서
   ===================================================================== */
var HQ_DEPT=['본사 R&D 센터','본사 서비스 기획팀','본사 교육팀'];
function hqEligible(c){ return !!c&&(c.lv||1)>=3&&(c.sat==null?70:c.sat)>=60&&!c.hqDeniedDay; }
function hqReport(c){ // 실적에서 결정되는 고정 평가(같은 직원은 같은 결과)
  var seed=0, nm=String(c.name||''); for(var i=0;i<nm.length;i++) seed=(seed*31+nm.charCodeAt(i))%9973; var r=function(k){ return ((seed*(k+7)*131)%100)/100; };
  var lv=c.lv||1, sat=c.sat==null?70:c.sat, acc=c.acc||0.85, spd=c.spd||1;
  var sc={ '문제 해결':clamp(Math.round(45+lv*8+acc*20+r(1)*12),0,100), '기술 이해':clamp(Math.round(40+lv*9+spd*14+r(2)*12),0,100), '협업·소통':clamp(Math.round(35+sat*0.45+r(3)*14),0,100), '고난도 과제':clamp(Math.round(30+lv*10+acc*18+r(4)*16),0,100) };
  var avg=Math.round((sc['문제 해결']+sc['기술 이해']+sc['협업·소통']+sc['고난도 과제'])/4);
  return {sc:sc,avg:avg,verdict:avg>=80?'강력 추천':avg>=68?'추천':avg>=55?'보류 의견':'부적합 의견',dept:HQ_DEPT[seed%HQ_DEPT.length]}; }
function openHqTransferModal(crew,done){ ensure(); var s=S(); var c=typeof crew==='number'?(s.crew||[])[crew]:crew; onClose=done||null;
  if(!c){ show('본사 전직 품의서','','<div class="hqcard" style="text-align:center"><h3>지원한 직원이 없어요</h3><p style="font:700 13px \'Noto Sans KR\',sans-serif">레벨 3 이상이고 만족도 60 이상인 직원이 스스로 지원해요.</p></div>','<button class="hqbtn g" data-hq="close">닫기</button>',{}); return; }
  var R=hqReport(c), role=IV_ROLE[c.role]||c.role, sat=c.sat==null?70:c.sat, wage=c.wage||0, hqPay=Math.round(wage*1.6), rsu=40+(c.lv||1)*20, days=(s.day||0)-(c.hiredDay||0);
  var bars=Object.keys(R.sc).map(function(k){ var v=R.sc[k]; return '<div style="margin:5px 0"><div style="display:flex;justify-content:space-between;font:800 12px \'Noto Sans KR\',sans-serif"><span>'+k+'</span><b>'+v+'</b></div><div class="hqbar"><s style="width:'+v+'%;background:'+(v>=75?'#2faa45':v>=55?'#e89a10':'#e8342a')+'"></s></div></div>'; }).join('');
  var body='<div class="hqdoc"><div class="hqstamp" id="hqstamp">승인</div><h3>품 의 서</h3><table><tr><td>건명</td><td><b>매장 직원 본사 전직 임용의 건</b></td></tr><tr><td>지원자</td><td>'+esc(c.name)+' ('+role+' · Lv.'+(c.lv||1)+')</td></tr><tr><td>지원 부서</td><td>'+R.dept+'</td></tr><tr><td>지원 경위</td><td>본인 자발적 지원</td></tr></table>'+
    '<div style="font-weight:900;color:#1b2748;margin-top:8px">① 매장 근무 실적</div><table><tr><td>속도 / 정확도</td><td>'+Math.round((c.spd||1)*100)+'% / '+Math.round((c.acc||0.85)*100)+'%</td></tr><tr><td>만족도</td><td>'+sat+' / 100</td></tr><tr><td>현재 일급</td><td>'+fmt(wage)+'</td></tr>'+(c.hiredDay!=null?'<tr><td>근속</td><td>'+Math.max(0,days)+'영업일</td></tr>':'')+'</table>'+
    '<div style="font-weight:900;color:#1b2748;margin-top:8px">② 본사 AI 면접관 평가 리포트</div>'+bars+'<div style="margin-top:6px"><span class="hqtag '+(R.avg>=68?'gd':R.avg>=55?'wn':'bd')+'">종합 '+R.avg+'점 · '+R.verdict+'</span></div>'+
    '<div style="font-weight:900;color:#1b2748;margin-top:8px">③ 오퍼 조건(안)</div><table><tr><td>본사 기본급</td><td>'+fmt(hqPay)+' /일 (본사 예산)</td></tr><tr><td>RSU 주식 옵션</td><td>'+rsu+'주</td></tr></table>'+
    '<div style="font-weight:900;color:#1b2748;margin-top:8px">④ 매장 영향</div><div>승인하면 매장에서 '+role+' 한 명이 빠져요. 대신 본사 인재로 등록되고 매장 급여 '+fmt(wage)+'/일이 줄어요.<br>반려하면 매장에 남지만 만족도가 떨어질 수 있어요.</div>'+
    '<div class="hqsig" id="hqsig"><span>결재자 서명</span>'+signSVG()+'</div></div>';
  show('본사 전직 품의서','직원이 스스로 본사에 지원했어요 · 최종 결재를 해 주세요',body,
    '<button class="hqbtn" data-hq="ok">임용 승인<small>본사 R&D 오퍼 서명</small></button><button class="hqbtn r" data-hq="no">매장 유지 반려</button>',
    {ok:function(t){ lock(); $('hqsig').classList.add('go'); sfx('ui',0.4,1.5);
       setTimeout(function(){ $('hqstamp').classList.add('go'); sfx('level_up',0.5,1.1);
         s.hqStaff.push({name:c.name,fromRole:c.role,lv:c.lv||1,dept:R.dept,score:R.avg,pay:hqPay,rsu:rsu,day:s.day||0});
         var handled=call('onTransfer',c,{dept:R.dept,pay:hqPay,rsu:rsu,score:R.avg}); if(handled!==true) c.hqMoved=1; // 어댑터가 S.crew에서 빼 주지 않으면 표시만 남깁니다
         call('save'); msg(c.name+' 님이 '+R.dept+'로 임용됐어요',true); done2(); },1200); },
     no:function(){ lock(); var st=$('hqstamp'); st.textContent='반려'; st.classList.add('no','go'); sfx('ui',0.4,0.6);
       c.hqDeniedDay=s.day||0; var drop=R.avg>=68?15:8; c.sat=clamp((c.sat==null?70:c.sat)-drop,0,100); call('onTransferDenied',c,drop); call('save');
       msg(c.name+' 님은 매장에 남아요 · 만족도 -'+drop,false); done2(); }});
  function lock(){ [].forEach.call(document.querySelectorAll('#hqbox .hqf .hqbtn'),function(b){ b.disabled=true; }); }
  function done2(){ var f=document.querySelector('#hqbox .hqf'); if(f) f.innerHTML='<button class="hqbtn b" data-hq="close">확인</button>'; } }

/* ---------------- public ---------------- */
window.HQUI={
  init:function(adapter){ A=adapter||{}; if(!A.S) throw new Error('HQUI.init: S(저장 객체)가 필요해요'); ensure(); mount(); return window.HQUI; },
  openInterviewModal:openInterviewModal, openBranchModal:openBranchModal, openHqTransferModal:openHqTransferModal,
  close:close, isOpen:isOpen, ensureSchema:ensure,
  branches:BRANCHES, branchIncome:branchIncome, totalBranchIncome:function(){ ensure(); return BRANCHES.reduce(function(a,b){ return a+branchIncome(b.id); },0); },
  otherBranchesIncome:otherBranchesIncome, autoIncomeTotal:autoIncomeTotal, currentBranchId:currentBranchId, stageOfDay:stageOfDay,
  hqEligible:hqEligible, hqReport:hqReport, config:CFG
};
window.openInterviewModal=openInterviewModal; window.openBranchModal=openBranchModal; window.openHqTransferModal=openHqTransferModal;
})();
