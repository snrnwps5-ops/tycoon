module.exports={name:'매장 확장 · 체험존 · 손님 +20%', async run({browser,mode,assert}){ const L=require('./lib');
  let T=await L.open(browser,mode,{state:{day:2,money:5000,dayStars:[3,3],exp:{}}}); await T.toPreDay(); await L.W(500);
  assert(await T.ev(()=>!!document.getElementById('expCard')),'영업 준비 화면에 매장 확장 카드가 없어요');
  const m0=await T.ev(()=>window.__T.mktSpawnMul()), c=await T.ev(()=>window.__T.expCost());
  await T.ev(()=>document.getElementById('expGo').click()); await L.W(1500);
  const r=await T.ev(()=>({own:!!(window.__H.S.exp&&window.__H.S.exp[0]),money:window.__T.money,mul:window.__T.mktSpawnMul()}));
  assert(r.own,'확장을 샀는데 저장이 안 됐어요'); assert(r.money===5000-c,'확장 비용이 안 빠졌어요 ('+r.money+')');
  assert(Math.abs(r.mul/m0-1.2)<0.01,'확장 뒤 손님 배수가 1.2배가 아니에요 ('+m0+' → '+r.mul+')');
  await L.W(3500); assert(await T.ev(()=>!!document.getElementById('dayGo')),'확장 뒤 영업 준비 화면으로 돌아오지 않아요');
  if(mode==='3d'){ await T.startDay(); await L.W(500);
    const x=await T.ev(()=>{ const T=window.__T, xy=T.proj(9.9,-4.1); T.tapGo(xy[0],xy[1]); return 1; }); await L.W(9000);
    const p=await T.ev(()=>{ const p=window.__T.player.pos; return [p.x,p.z]; });
    assert(p[0]>8.5,'확장한 체험존으로 걸어 들어가지 못해요 (x='+p[0].toFixed(2)+')'); }
  assert(!T.errs.length,'페이지 오류: '+T.errs.join(' | ')); await T.close();
  // 돈이 모자라면 진행 막대만
  T=await L.open(browser,mode,{state:{day:2,money:100,dayStars:[3,3],exp:{}}}); await T.toPreDay(); await L.W(500);
  await T.ev(()=>document.getElementById('expGo').click()); await L.W(500);
  assert(await T.ev(()=>!(window.__H.S.exp&&window.__H.S.exp[0])&&window.__T.money===100),'돈이 모자란데 확장이 됐어요');
  await T.close(); }};
