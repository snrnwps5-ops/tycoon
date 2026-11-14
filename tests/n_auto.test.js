module.exports={name:'자동화(수금 레일·진열 로봇) · 상점 패키지', async run({browser,mode,assert}){ const L=require('./lib');
  const T=await L.open(browser,mode,{state:{day:3,money:99999,dayStars:[3,3,3],auto:{}}}); await T.toPreDay(); await L.W(500);
  assert(await T.ev(()=>!!document.getElementById('autoCard')),'영업 준비 화면에 자동화 카드가 없어요');
  await T.ev(()=>document.querySelector('#autoCard [data-auto="cash"]').click()); await L.W(300);
  await T.ev(()=>document.querySelector('#autoCard [data-auto="shelf"]').click()); await L.W(300);
  assert(await T.ev(()=>window.__T.autoLv('cash')===1&&window.__T.autoLv('shelf')===1),'자동화 구매가 안 돼요');
  await T.ev(()=>document.getElementById('modal').classList.remove('on')); await T.startDay();
  await T.ev(()=>{ const P=window.__T.player.pos; P.x=-4; P.z=-5; window.__T.cashVal=200; const s=window.__T.SRC.find(s=>s.on); s.n=0; window.__H.S.inv[s.t]=20; window.__s0=s; window.__TS=4; });
  const m0=await T.ev(()=>window.__T.money); let ok=false; for(let i=0;i<30&&!ok;i++){ await L.W(800); ok=await T.ev(m0=>window.__T.cashVal===0&&window.__T.money>=m0+200&&window.__s0.n>0,m0); }
  await T.ev(()=>{ window.__TS=1; });
  assert(ok,'자동 수금이나 자동 진열이 동작하지 않아요: '+JSON.stringify(await T.ev(()=>({cash:window.__T.cashVal,n:window.__s0.n}))));
  assert(!T.errs.length,'페이지 오류: '+T.errs.join(' | ')); await T.close(); }};
