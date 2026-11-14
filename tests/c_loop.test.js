module.exports={name:'러시 · 도감 · 연승', async run({browser,mode,assert}){ const L=require('./lib'); const T=await L.open(browser,mode);
  await T.startDay(); await T.ev(()=>{ window.__TS=8; });
  let on=false; for(let i=0;i<50&&!on;i++){ await L.W(250); on=await T.ev(()=>!!(window.__T.LPC.on&&!window.__T.LPC.on.done)); } await T.ev(()=>{ window.__TS=1; });
  assert(on,'러시 챌린지가 나오지 않아요');
  if(on){ const m0=await T.ev(()=>window.__T.money); await T.ev(()=>{ const R=window.__T.LPC.on; if(R.k==='combo') window.__T.combo=R.g+1; else window.__H.S.stats[R.k]+=R.g; }); await L.W(400); assert(await T.ev(m0=>window.__T.money>m0,m0),'러시 성공 보상이 없어요'); }
  const n0=await T.ev(()=>Object.keys(window.__H.S.dex||{}).length); await T.ev(()=>{ [{type:'corp'},{type:'esc',tough:1},{type:'tour',flight:1}].forEach(c=>window.__T.lpCard(c)); });
  assert(await T.ev(n0=>Object.keys(window.__H.S.dex).length>n0,n0),'도감 카드가 등록되지 않아요');
  await T.endDay(1.2,0); const s1=await T.ev(()=>window.__H.S.lp.streak); await T.click('dRetry'); await L.W(900); await T.startDay(); await T.endDay(1.2,0); const s2=await T.ev(()=>window.__H.S.lp.streak);
  assert(s2===s1+1,'연승이 오르지 않아요 ('+s1+'→'+s2+')'); assert(await T.ev(()=>!!document.querySelector('.lpch')),'보상 상자가 없어요');
  await T.click('dRetry'); await L.W(900); await T.startDay(); await T.endDay(0.4,0); assert(await T.ev(()=>window.__H.S.lp.streak===0),'실패했는데 연승이 남아 있어요');
  assert(!T.errs.length,'페이지 오류: '+T.errs.join(' | ')); await T.close(); }};
