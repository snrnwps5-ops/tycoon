module.exports={name:'비즈니스 팀장(자동 배정·대신 대응·평가) · 지점별 팀 · AI 인사 이동', async run({browser,mode,assert}){ const L=require('./lib');
  const T=await L.open(browser,mode,{state:{day:9,curStage:2,money:90000,dayStars:Array(9).fill(3),sysSeen:{1:1,2:1},bizBy:{1:{reps:[{name:'부산사원',sk:1.1,won:3,lost:0}],desks:2}},
    branchSnap:{0:{crew:[{role:'runner',name:'하준',lv:3,sat:85,wage:25,spd:1.1,acc:0.95,hiredDay:0,face:0},{role:'spec',name:'민준',lv:1,sat:80,wage:30,spd:1,acc:0.9,hiredDay:0,face:3}]}}}});
  await T.startDay(); await L.W(1000);
  // 지점별 팀: 서울 팀은 새로 시작(사원 1명), 부산 팀은 그대로
  assert(await T.ev(()=>window.__T.bizS().reps.length===1&&window.__T.bizS().reps[0].name!=='부산사원'&&window.__H.S.bizBy[1].reps[0].name==='부산사원'),'지점별 비즈니스 팀이 분리되지 않았어요');
  // 팀장: 채용 → 새 거래 자동 배정 → 협상 포인트 5분 방치 시 대신 대응
  await T.ev(()=>{ const T=window.__T; T.bizOpen(); T.bizAct('mgr'); T.bizNewDeal(0,'S'); T.bizNewDeal(1,'S'); T.bizTick(); });
  assert(await T.ev(()=>{ const B=window.__T.bizS(); return !!B.mgr&&B.deals.every(d=>d.st==='nego')&&B.deals.some(d=>d.rep==='m'); }),'팀장이 거래를 자동 배정·직접 협상하지 않아요');
  await T.ev(()=>{ const T=window.__T, d=T.bizS().deals[0]; d.p=0.5; d.wait=6*60000; T.BIZ.lastT=Date.now()-1000; T.bizTick(); });
  assert(await T.ev(()=>window.__T.bizS().deals[0].asked===1),'팀장이 방치된 협상 포인트를 대신 대응하지 않아요');
  // 평가
  await T.ev(()=>{ const B=window.__T.bizS(); B.reps[0].won=6; B.reps[0].lost=0; window.__T.bizAct('eval'); }); await L.W(300);
  assert(await T.ev(()=>{ const r=window.__T.bizS().reps[0]; return !!r.grade&&!!r.note; }),'팀 평가 등급·한 줄 평이 없어요');
  // 인사 이동: 본사 → 보너스, 비즈니스 팀 → 사원 합류
  const pool=await T.ev(()=>window.__T.hrPool().map(p=>p.c.name)); assert(pool.includes('하준')&&pool.includes('부산사원'),'다른 지점 인원이 인사 풀에 없어요: '+pool);
  const m0=await T.ev(()=>window.__T.money); await T.ev(()=>{ const i=window.__T.hrPool().findIndex(p=>p.c.name==='하준'); window.__T.hrApply(i+':hq'); });
  assert(await T.ev(m0=>window.__T.money>m0&&!window.__T.hrPool().some(p=>p.c.name==='하준'),m0),'본사 발령 처리가 안 돼요');
  await T.ev(()=>{ const T=window.__T; T.bizAct('desk'); const i=T.hrPool().findIndex(p=>p.c.name==='부산사원'); T.hrApply(i+':biz'); });
  assert(await T.ev(()=>window.__T.bizS().reps.some(r=>r.name==='부산사원')&&window.__H.S.bizBy[1].reps.length===0),'다른 지점 사원을 비즈니스 팀으로 못 데려와요');
  await T.ev(()=>window.__T.bizClose());
  assert(!T.errs.length,'페이지 오류: '+T.errs.join(' | ')); await T.close(); }};
