/* 매장 바닥 전체(0.4m 간격)에서 손님이 나가는 경로를 시뮬레이션 — 한 곳이라도 못 나가면 실패 */
module.exports={name:'손님 끼임 (서울·인천·본사)', modes:['3d'], async run({browser,mode,assert}){ const L=require('./lib');
  for(const st of [2,3,5]){ const T=await L.open(browser,mode,{state:{day:[0,4,8,11,15,19][st],curStage:st}});
    const r=await T.ev(()=>{ const T=window.__T, OB=T.OB, bad=[]; const inOb=(x,z)=>OB.some(b=>!b.off&&x>b.x1-0.28&&x<b.x2+0.28&&z>b.z1-0.28&&z<b.z2+0.28);
      for(let x=-6.4;x<=6.41;x+=0.4) for(let z=-7.6;z<=5.41;z+=0.4){ if(inOb(x,z)) continue; const o={pos:T.V3(x,0,z),wp:[T.V3(x,0,Math.max(z,2.0)),T.V3(0,0,4.6),T.V3(0,0,8),T.V3(14,0,11.2)]}; let n=0; while(n<1200&&o.wp.length){ T.walkTo(o,0.05,2.2); n++; } if(o.wp.length) bad.push(x.toFixed(1)+','+z.toFixed(1)); }
      return {stage:T.STG,bad}; });
    assert(r.stage===st,'매장 '+st+'으로 열리지 않아요'); assert(!r.bad.length,'매장 '+st+'에서 못 나가는 지점 '+r.bad.length+'곳: '+r.bad.slice(0,6).join(' '));
    await T.close(); } }};
