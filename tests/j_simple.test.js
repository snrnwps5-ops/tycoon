module.exports={name:'탭 이동 · 상담 숙련 · 결정할 일 · 단계별 해금', async run({browser,mode,assert}){ const L=require('./lib');
  // 대구: 전략·경쟁사 없음
  let T=await L.open(browser,mode); await T.toPreDay(); let t=await T.modalText();
  assert(!/오늘의 전략/.test(t)&&!/⚔️/.test(t),'대구(1단계)인데 전략·경쟁사가 보여요');
  assert(await T.ev(()=>['stn','rooms','loadChip'].every(id=>{ const e=document.getElementById(id); return !e||getComputedStyle(e).display==='none'; })),'정리한 상단 칩이 보여요');
  // 탭 이동 (3D 전용)
  await T.startDay(); await L.W(500);
  if(mode==='3d'){
    const s=await T.ev(()=>{ const P=window.__T.player.pos, H=innerHeight, W=innerWidth; const L=window.__T.SRC.filter(x=>x.on).map(x=>({x:x.x,z:x.z+0.9})).concat([{x:-4,z:2},{x:3,z:-2},{x:-2,z:-4}]).filter(q=>{ const p=window.__T.proj(q.x,q.z); return p[0]>40&&p[0]<W-80&&p[1]>220&&p[1]<H-160; }).map(q=>Object.assign(q,{d0:Math.hypot(q.x-P.x,q.z-P.z)})).sort((a,b)=>b.d0-a.d0); return L[0]; });
    const xy=await T.ev(s=>window.__T.proj(s.x,s.z),s); await T.pg.touchscreen.tap(Math.round(xy[0]),Math.round(xy[1])); await L.W(4000);
    const d1=await T.ev(s=>{ const P=window.__T.player.pos; return Math.hypot(s.x-P.x,s.z-P.z); },s);
    assert(d1<Math.min(1.2,s.d0*0.5),'탭한 진열대로 걸어가지 않아요 ('+s.d0.toFixed(1)+'m → '+d1.toFixed(1)+'m)'); }
  // 상담 숙련: 3번 맞히면 4번째는 자동
  await T.ev(()=>{ document.getElementById('modal').classList.remove('on'); window.__qres=[]; });
  for(let i=0;i<3;i++){ await T.ev(()=>window.__T.quizTest()); await L.W(300); await T.ev(()=>document.querySelector('#mbox [data-ok]').click()); await L.W(300); }
  await T.ev(()=>window.__T.quizTest()); await L.W(900);
  assert(await T.ev(()=>window.__qres.length===4&&window.__qres[3]==='정답'),'숙련 3회 뒤 자동 응대가 안 돼요: '+JSON.stringify(await T.ev(()=>window.__qres)));
  await T.close();
  // 결정할 일: 승진 공문이 팝업 대신 버튼으로 모인다
  T=await L.open(browser,mode,{state:{day:5,curStage:1,myScore:84,myRank:0,dayStars:[3,3,3,3,0],sysSeen:{1:1}}}); await T.toPreDay(); t=await T.modalText();
  assert(/오늘의 전략/.test(t),'부산(2단계)인데 판매 전략이 안 보여요'); assert(!/매니저 업무|data-mf/.test(t),'부산인데 매니저 업무 지시가 보여요');
  await T.startDay(); await T.endDay(1.8,0); await L.W(800);
  const ib=await T.ev(()=>({btn:!!document.getElementById('inboxBtn'),txt:(document.getElementById('inboxBtn')||{}).textContent||'',lead:!!(document.getElementById('leadNote')&&document.getElementById('leadNote').classList.contains('on'))}));
  assert(ib.btn&&/승진/.test(ib.txt),'승진 발령이 [결정할 일]로 모이지 않아요: '+ib.txt); assert(!ib.lead,'승진 공문이 팝업으로 바로 떴어요');
  await T.ev(()=>document.getElementById('inboxBtn').click()); await L.W(600);
  assert(await T.ev(()=>document.getElementById('leadNote').classList.contains('on')),'결정할 일을 누르면 공문이 열려야 해요');
  assert(!T.errs.length,'페이지 오류: '+T.errs.join(' | ')); await T.close(); }};
