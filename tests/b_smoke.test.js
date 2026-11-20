module.exports={name:'첫 영업 · 결과창 첫 화면', async run({browser,mode,assert}){ const L=require('./lib'); const T=await L.open(browser,mode);
  assert(await T.toPreDay(),'영업 시작 창이 안 떠요');
  await T.startDay(); assert(await T.ev(()=>window.__T&&window.__T.st==='run'),'영업이 시작되지 않아요 (window.__T 훅 확인)');
  let r=await T.endDay(0.5,0); assert(/실패/.test(r),'목표 미달인데 실패가 아니에요: '+r.slice(0,60));
  await T.click('dRetry'); await L.W(900); await T.startDay();
  r=await T.endDay(1.7,0); assert(/클리어/.test(r),'목표 170%인데 클리어가 아니에요');
  /* v2.99: v2.95에서 결과창 순서가 '본사 총평 → 영수증 → [다음 날]'로 바뀌어, 총평이 버튼 아래에 있어야 한다는
     옛 검사를 '총평이 결과창에 있고 다음 날 버튼은 첫 화면 안에 있다'로 바꿨다. */
  const lay=await T.ev(()=>{ const b=document.getElementById('dNext'), mb=document.getElementById('mbox'); if(!b) return null; const r=b.getBoundingClientRect(); return {bottom:r.bottom,vh:innerHeight,det:!!mb.querySelector('details.lpdet'),dirAI:!!document.getElementById('dirAI'),dirIn:!!(document.getElementById('dirAI')&&mb.contains(document.getElementById('dirAI')))}; });
  assert(lay,'다음 날 버튼이 없어요'); if(lay){ assert(lay.bottom<=lay.vh,'다음 날 버튼이 첫 화면 밖이에요 (bottom '+Math.round(lay.bottom)+' > '+lay.vh+')'); assert(lay.det,'상세 결과 접기가 없어요'); assert(lay.dirAI&&lay.dirIn,'결과창에 본사 총평이 없어요'); }
  await T.shot('result_'+mode);
  assert(!T.errs.length,'페이지 오류: '+T.errs.join(' | ')); await T.close(); }};
