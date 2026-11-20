module.exports={name:'난이도 상향 · 실패 시 부스터 제안 · 부스터는 상한 밖', async run({browser,mode,assert}){ const L=require('./lib');
  const T=await L.open(browser,mode,{state:{day:5,curStage:1,dayStars:[3,3,3,3,0],sysSeen:{1:1},boostD:-1}});
  /* v3.01: 난이도 곡선은 '기본 목표 × 배수'식이 아니라 DAY별 실측표(V301_G)로 정해진다
     — 부산 DAY 6 = 1,910, 대구 DAY 2 = 450. 표 값과 어긋나면 커브가 깨진 것이다. */
  const G301=[280,450,500,560,1490,1910,2660,2340,5390,5830,6270,9700,11400,11860,12300,21500,32200,30000,19000,23000];
  assert(await T.ev((g)=>window.__T.dayCfg(5).goal===g[5],G301),'부산 목표가 v3.01 곡선표와 달라요: '+await T.ev(()=>window.__T.dayCfg(5).goal));
  assert(await T.ev((g)=>window.__T.dayCfg(1).goal===g[1],G301),'대구 목표가 v3.01 곡선표와 달라요: '+await T.ev(()=>window.__T.dayCfg(1).goal));
  assert(await T.ev((g)=>{ for(let d=0;d<20;d++){ if(window.__T.dayCfg(d).goal!==g[d]) return 'DAY '+(d+1)+' '+window.__T.dayCfg(d).goal+'≠'+g[d]; } return ''; },G301)==='','DAY 1~20 목표가 v3.01 곡선표와 달라요: '+await T.ev((g)=>{ const a=[]; for(let d=0;d<20;d++){ if(window.__T.dayCfg(d).goal!==g[d]) a.push('DAY '+(d+1)+' '+window.__T.dayCfg(d).goal); } return a.join(', '); },G301));
  await T.startDay(); await T.endDay(0.85,0); await L.W(600);
  const t=await T.modalText(); assert(/거의 다 왔어요/.test(t)&&/부족했어요/.test(t),'실패했는데 부족 금액 안내가 없어요');
  await T.ev(()=>document.getElementById('poBoost').click()); await L.W(2500);
  assert(await T.ev(()=>window.__H.S.boostD===window.__H.S.day),'부스터가 적용되지 않았어요');
  assert(await T.ev(()=>{ const g=document.getElementById('dayGo'), h=document.getElementById('v262Go'); return !!g||!!(h&&h.offsetParent)||window.__T.st==='run'; }),'부스터 뒤 재도전 화면으로 가지 않아요');
  assert(!T.errs.length,'페이지 오류: '+T.errs.join(' | ')); await T.close(); }};
