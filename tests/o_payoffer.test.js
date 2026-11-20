module.exports={name:'난이도 상향 · 실패 시 부스터 제안 · 부스터는 상한 밖', async run({browser,mode,assert}){ const L=require('./lib');
  const T=await L.open(browser,mode,{state:{day:5,curStage:1,dayStars:[3,3,3,3,0],sysSeen:{1:1},boostD:-1}});
  assert(await T.ev(()=>window.__T.dayCfg(5).goal===Math.round(900*window.__T.HARDK()[1]/10)*10),'부산 목표에 난이도 배수가 안 걸렸어요: '+await T.ev(()=>window.__T.dayCfg(5).goal));
  /* v2.99: v2.71이 지점 배수(HARDK)를 다시 잡아 DAY 2 목표도 200→240(200×1.2)이 됐다 — 배수식으로 확인한다. */
  assert(await T.ev(()=>window.__T.dayCfg(1).goal)===await T.ev(()=>Math.round(200*window.__T.HARDK()[0]/10)*10),'대구 목표가 배수식과 달라요: '+await T.ev(()=>window.__T.dayCfg(1).goal));
  await T.startDay(); await T.endDay(0.85,0); await L.W(600);
  const t=await T.modalText(); assert(/거의 다 왔어요/.test(t)&&/부족했어요/.test(t),'실패했는데 부족 금액 안내가 없어요');
  await T.ev(()=>document.getElementById('poBoost').click()); await L.W(2500);
  assert(await T.ev(()=>window.__H.S.boostD===window.__H.S.day),'부스터가 적용되지 않았어요');
  assert(await T.ev(()=>{ const g=document.getElementById('dayGo'), h=document.getElementById('v262Go'); return !!g||!!(h&&h.offsetParent)||window.__T.st==='run'; }),'부스터 뒤 재도전 화면으로 가지 않아요');
  assert(!T.errs.length,'페이지 오류: '+T.errs.join(' | ')); await T.close(); }};
