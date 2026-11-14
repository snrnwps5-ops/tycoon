module.exports={name:'첫 3분 · 바로 영업 · 손님 화살표 · 첫날 메뉴 숨김', async run({browser,mode,assert}){ const L=require('./lib');
  let T=await L.open(browser,mode,{ftue:1});
  if(mode==='3d'){ await T.click('tStart'); }
  let st=''; for(let i=0;i<30;i++){ await L.W(700); st=await T.ev(()=>window.__T.st); if(st==='run') break; assert(!(await T.ev(()=>!!document.getElementById('road'))),'첫 실행인데 로드맵이 떠요'); }
  assert(st==='run','첫 실행에서 바로 영업이 시작되지 않아요 (상태 '+st+')');
  assert(await T.ev(()=>getComputedStyle(document.getElementById('bbar')).visibility==='hidden'),'첫날인데 하단 메뉴가 보여요');
  let seen=false; for(let i=0;i<60&&!seen;i++){ await L.W(800); seen=await T.ev(()=>getComputedStyle(document.getElementById('ftArrow')).display==='block'||document.getElementById('modal').classList.contains('on')); }
  assert(seen,'손님 화살표나 첫 상담이 나오지 않아요');
  assert(!T.errs.length,'페이지 오류: '+T.errs.join(' | ')); await T.close();
  // 첫날을 넘기면 메뉴가 열린다
  T=await L.open(browser,mode,{ftue:1,state:{day:1,ftueGo:1,dayStars:[2]}}); await T.toPreDay(); await L.W(800);
  assert(await T.ev(()=>getComputedStyle(document.getElementById('bbar')).visibility!=='hidden'),'2일차인데 하단 메뉴가 숨어 있어요');
  assert(await T.ev(()=>window.__H.S.ftue&&window.__H.S.ftue.done),'메뉴 열림 처리가 안 됐어요');
  assert(!T.errs.length,'페이지 오류: '+T.errs.join(' | ')); await T.close(); }};
