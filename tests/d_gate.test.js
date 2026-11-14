module.exports={name:'별 게이트 · 다시 도전', async run({browser,mode,assert}){ const L=require('./lib'); const T=await L.open(browser,mode,{state:{day:3,dayStars:[1,1,1],curStage:0}});
  await T.startDay(); await T.endDay(1.0,1); await T.click('dNext'); await L.W(900);
  const g=await T.modalText(); assert(/별이 \d+개 더 필요해요/.test(g),'별 게이트 창이 안 떠요: '+g.slice(0,60));
  await T.ev(()=>document.querySelector('[data-rp="0"]').click()); await L.W(900);
  assert(await T.ev(()=>window.__H.S.day===0&&window.__H.S.rpBack===3),'다시 도전 상태가 아니에요');
  await T.startDay(); await T.endDay(1.7,0); await T.click('dNext'); await L.W(900);
  assert(await T.ev(()=>window.__H.S.day>=3&&window.__H.S.rpBack==null),'다시 도전 뒤 원래 진행으로 돌아오지 않아요');
  assert(await T.ev(()=>window.__H.S.day===4),'별 6개를 채웠는데 다음 매장(DAY 5)으로 넘어가지 않아요');
  assert(!T.errs.length,'페이지 오류: '+T.errs.join(' | ')); await T.close(); }};
