module.exports={name:'비즈니스 팀: 법인 손님 연결 · 배정 · 협상 포인트 · 성공/결렬 · 재영업', async run({browser,mode,assert}){ const L=require('./lib');
  const T=await L.open(browser,mode,{state:{day:9,curStage:2,money:50000,dayStars:Array(9).fill(3),sysSeen:{1:1,2:1},bizBy:{},branchSnap:{}}}); await T.startDay(); await L.W(1500);
  assert(await T.ev(()=>{ const b=document.getElementById('bizBtn'); return !!b&&getComputedStyle(b).display!=='none'; }),'서울인데 비즈니스 버튼이 없어요');
  // 매장 법인 손님 → 연결
  await T.ev(()=>{ const P=window.__T.player.pos; P.x=-6; P.z=-7; });
  let c=null; for(let i=0;i<60&&!c;i++){ c=await T.ev(()=>{ window.__T.spawn(); const c=window.__T.custs.find(x=>x.type==='corp')||window.__T.custs.find(x=>x.st!=='leave'); if(!c) return null; c.type='corp'; window.__cc=c; return 1; }); if(!c) await L.W(100); }
  assert(c,'법인 손님을 만들지 못했어요');
  if(c){ const m0=await T.ev(()=>window.__T.money), r0=await T.ev(()=>window.__T.rev); await T.ev(()=>window.__T.openQuiz(window.__cc)); await L.W(400);
    assert(/비즈니스 팀에 연결/.test(await T.modalText()),'법인 손님에게 연결 버튼이 안 나와요');
    await T.ev(()=>document.getElementById('bizGo').click()); await L.W(400);
    assert(await T.ev(()=>window.__T.bizS().deals.length===1),'연결했는데 거래가 안 생겼어요');
    assert(await T.ev((m0,r0)=>window.__T.money===m0&&window.__T.rev===r0,m0,r0),'법인 손님이 매장에서 바로 돈을 냈어요'); }
  // 사무실: 배정 → 50%에서 멈춤 → 협상 포인트 → 성공
  await T.ev(()=>window.__T.bizOpen()); await L.W(1200);
  if(mode==='3d') assert(await T.ev(()=>!!window.__T.BIZ.scene&&window.__T.BIZ.reps.length>=1),'사무실 3D가 지어지지 않아요');
  await T.ev(()=>window.__T.bizAct('assign',0)); await T.ev(()=>{ window.__T.bizS().deals[0].p=0.49; window.__T.bizS().deals[0].dur=60000; window.__T.BIZ.lastT=Date.now()-30000; window.__T.bizTick(); });
  assert(await T.ev(()=>{ const d=window.__T.bizS().deals[0]; return d.p===0.5&&!d.asked; }),'협상 포인트에서 멈추지 않아요');
  await T.ev(()=>window.__T.bizAct('quiz',0)); await L.W(300); await T.ev(()=>document.querySelector('#mbox [data-ok]').click()); await L.W(300);
  const ch=await T.ev(()=>window.__T.bizS().deals[0].ch); assert(Math.abs(ch-0.8)<0.001,'협상 포인트 정답인데 확률이 안 올라요 ('+ch+')');
  const m1=await T.ev(()=>window.__T.money); await T.ev(()=>{ const d=window.__T.bizS().deals[0]; d.ch=5; d.p=0.99; window.__T.BIZ.lastT=Date.now()-600000; window.__T.bizTick(); });
  assert(await T.ev(m1=>window.__T.bizS().won===1&&window.__T.money>m1,m1),'협상 성공인데 계약금이 안 들어와요 '+await T.ev(()=>JSON.stringify({B:window.__T.bizS(),err:window.__T.BIZ.err})).then(x=>x.slice(0,600)));
  // 결렬 → 재영업
  await T.ev(()=>{ const T=window.__T; const d=T.bizNewDeal(0,'S'); T.bizAct('assign',T.bizS().deals.indexOf(d)); d.asked=1; d.ch=-5; d.p=0.99; T.BIZ.lastT=Date.now()-600000; T.bizTick(); });
  assert(await T.ev(()=>window.__T.bizS().later.length===1&&window.__T.bizS().lost===1),'결렬된 거래가 재영업 리스트로 안 가요');
  await T.ev(()=>{ const T=window.__T; T.bizS().later[0].retry=Date.now()-1; T.bizAct('retry',0); });
  assert(await T.ev(()=>{ const B=window.__T.bizS(); return B.later.length===0&&B.deals.some(d=>d.tries===1&&d.st==='new'); }),'재영업이 안 돼요');
  await T.ev(()=>window.__T.bizClose()); await L.W(300);
  assert(await T.ev(()=>!document.body.classList.contains('biz')),'매장으로 돌아오지 않아요');
  assert(!T.errs.length,'페이지 오류: '+T.errs.join(' | ')); await T.close(); }};
