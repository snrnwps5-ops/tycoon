module.exports={name:'매니저 업무 · 평가 · 승진 · 직원 외형', async run({browser,mode,assert}){ const L=require('./lib');
  const crew=[{role:'runner',name:'하준',spd:1,acc:0.9,wage:20,lv:2,sat:60},{role:'runner',name:'소희',spd:1,acc:0.9,wage:20,lv:2,sat:85,extra:true},{role:'tech',name:'서준',spd:1,acc:0.9,wage:20,lv:2,sat:75},{role:'spec',name:'지아',spd:1,acc:0.9,wage:20,lv:2,sat:50},{role:'mgr',name:'한유나',spd:1,acc:0.9,wage:30,lv:3,sat:80,mscore:84,mdays:4}];
  const T=await L.open(browser,mode,{state:{day:8,curStage:2,crew,mgrFocus:'coach'}});
  const looks=await T.ev(()=>window.__H.S.crew.map(c=>c.look&&c.look.m)); assert(looks.every(Boolean),'직원 외형이 저장되지 않아요'); assert(new Set(looks).size>=3,'직원 외형이 너무 비슷해요: '+looks.join(','));
  await T.startDay(); await T.ev(()=>{ window.__TS=4; }); await L.W(15000); await T.ev(()=>{ window.__TS=1; });
  const d=await T.ev(()=>window.__T.MGRS.day); assert(d.coach+d.calm+d.esc>0,'매니저가 아무 일도 안 했어요: '+JSON.stringify(d));
  await T.endDay(1.8,0); const r=await T.ev(()=>document.getElementById('mbox').textContent); assert(/본사 AI → 매니저 평가/.test(r),'본사 AI 매니저 평가가 없어요'); assert(/매니저 한유나 → 직원 평가/.test(r),'매니저의 직원 평가가 없어요');
  assert(await T.ev(()=>window.__H.S.crew.find(c=>c.role==='mgr').mrank===1),'매니저 승진(84점·4일 → 완벽한 날)이 안 됐어요');
  assert(!T.errs.length,'페이지 오류: '+T.errs.join(' | ')); await T.close(); }};
