module.exports={name:'매장 확장 · 체험존 · 업그레이드 · 정산함', async run({browser,mode,assert}){ const L=require('./lib');
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
    assert(p[0]>8.5,'확장한 체험존으로 걸어 들어가지 못해요 (x='+p[0].toFixed(2)+')');
    await T.ev(()=>{ window.__TS=8; }); let used=false; for(let i=0;i<40&&!used;i++){ await L.W(1000); used=await T.ev(()=>window.__T.EXV.list.some(v=>v.st==='use'||v.st==='out')); }
    await T.ev(()=>{ window.__TS=1; }); assert(used,'체험존 손님이 테이블까지 오지 않아요'); }
  // 업그레이드
  { const lv0=await T.ev(()=>((window.__H.S.expLv||{})[0])||1), m0=await T.ev(()=>window.__T.money), p0=await T.ev(()=>window.__T.expPay());
    await T.ev(()=>{ window.__T.money; }); await T.ev(()=>window.__T.expUp()); await L.W(300);
    const r2=await T.ev(()=>({lv:(window.__H.S.expLv||{})[0],m:window.__T.money,p:window.__T.expPay()}));
    if(m0>=600){ assert(r2.lv===lv0+1,'체험존 업그레이드가 안 돼요'); assert(r2.p>p0,'업그레이드했는데 방문당 수익이 그대로예요'); } }
  assert(!T.errs.length,'페이지 오류: '+T.errs.join(' | ')); await T.close();
  // 돈이 모자라면 진행 막대만
  T=await L.open(browser,mode,{state:{day:2,money:100,dayStars:[3,3],exp:{}}}); await T.toPreDay(); await L.W(500);
  await T.ev(()=>document.getElementById('expGo').click()); await L.W(500);
  assert(await T.ev(()=>!(window.__H.S.exp&&window.__H.S.exp[0])&&window.__T.money===100),'돈이 모자란데 확장이 됐어요');
  await T.close();
  // 정산함: 자리 비운 3시간 동안 가득 차고, 수금하면 내 돈이 된다
  const t=Date.now()-3*3600e3; T=await L.open(browser,mode,{state:{day:3,money:1000,dayStars:[3,3,3],exp:{0:1},expLv:{0:3},boxAt:t,box:{0:0}}}); await L.W(1500);
  const bx=await T.ev(()=>[window.__T.boxGet(),window.__T.boxCap()]); assert(bx[0]>0&&bx[0]===bx[1],'자리 비운 동안 정산함이 차지 않아요: '+bx);
  const mb=await T.ev(()=>window.__T.money); await T.ev(()=>window.__T.boxCollect()); await L.W(300);
  assert(await T.ev((m0,c)=>window.__T.money===m0+c&&window.__T.boxGet()===0,mb,bx[1]),'정산함 수금이 안 돼요');
  await T.close();
  // 부재중 수익: 광고 보고 2배
  { const t2=Date.now()-3*3600e3; T=await L.open(browser,mode,{state:{day:3,money:1000,dayStars:[3,3,3],last:t2,offAt:t2,lastSaveTime:t2,lastProfit:300,adN:0,crew:[{role:'runner',name:'하준',lv:1,sat:85,wage:25,spd:1,acc:0.88,hiredDay:0,face:0},{role:'tech',name:'서준',lv:1,sat:85,wage:30,spd:1,acc:0.88,hiredDay:0,face:3}]}}); await L.W(1500);
    assert(/광고 보고 2배/.test(await T.modalText()),'부재중 수익에 2배 받기 버튼이 없어요');
    const mo=await T.ev(()=>window.__T.money); await T.ev(()=>document.getElementById('offAd').click()); await L.W(2200);
    assert(await T.ev(mo=>window.__T.money===mo+180,mo),'광고 2배 수령 금액이 이상해요'); }
  await T.close(); }};
