module.exports={name:'숙련: 같은 질문만 · 법인 고객은 자동 응대 없음', async run({browser,mode,assert}){ const L=require('./lib');
  const T=await L.open(browser,mode); await T.toPreDay(); await T.ev(()=>{ document.getElementById('modal').classList.remove('on'); window.__qres=[]; window.__H.S.mast={}; });
  const run=async(t,q,n)=>{ for(let i=0;i<n;i++){ await T.ev((t,q)=>window.__T.quizTest(t,q),t,q); await L.W(300); await T.ev(()=>document.querySelector('#mbox [data-ok]').click()); await L.W(300); } };
  // 법인 고객: 3번 맞혀도 4번째는 직접 풀어야 한다
  await run('법인 고객','"질문 A"',3); await T.ev(()=>{ window.__qres=[]; }); await T.ev(()=>window.__T.quizTest('법인 고객','"질문 A"')); await L.W(900);
  assert(await T.ev(()=>window.__qres.length===0&&document.getElementById('modal').classList.contains('on')),'법인 고객이 자동으로 풀렸어요');
  await T.ev(()=>document.querySelector('#mbox [data-ok]').click()); await L.W(300);
  // 일반 상담: 다른 질문은 숙련이 따로
  await run('구입 상담','질문 X',3); await T.ev(()=>{ window.__qres=[]; }); await T.ev(()=>window.__T.quizTest('구입 상담','질문 Y')); await L.W(900);
  assert(await T.ev(()=>window.__qres.length===0),'다른 질문인데 자동으로 풀렸어요'); await T.ev(()=>document.querySelector('#mbox [data-ok]').click()); await L.W(300);
  await T.ev(()=>{ window.__qres=[]; }); await T.ev(()=>window.__T.quizTest('구입 상담','질문 X')); await L.W(900);
  assert(await T.ev(()=>window.__qres.length===1&&window.__qres[0]==='정답'),'같은 질문 3번 뒤 자동 응대가 안 돼요');
  assert(!T.errs.length,'페이지 오류: '+T.errs.join(' | ')); await T.close(); }};
