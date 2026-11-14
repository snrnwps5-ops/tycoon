/* 무과금 난이도 시뮬레이터 (v2.47~)
   "능숙한 플레이어" 모델: 플레이어는 GAP초(게임 시간)마다 가장 급한 손님 1명을 응대하고, 나머지는 실제 직원 AI가 처리한다.
   지점마다 '무과금으로 무난히 투자한' 진행 상태(업그레이드·직원·자동화)를 가정한다.
   사용: node tests/sim/sim.js [모드=free|boost] [날짜들=5,9,12,16,20] [GAP=6]
   출력: 날짜별 매출/목표 비율. 1.0 이상이면 클리어 */
const L=require('../lib');
const mode=process.argv[2]||'free', days=(process.argv[3]||'5,9,12,16,20').split(',').map(Number), GAP=+(process.argv[4]||6);
const PROG=[
 {up:{spd:1,cap:1,chk:0,price:1},crew:['runner','tech'],unl:['repair','support'],auto:{}},
 {up:{spd:2,cap:2,chk:1,price:2},crew:['runner','tech','spec'],unl:['repair','support','table2'],auto:{cash:1}},
 {up:{spd:3,cap:3,chk:2,price:4},crew:['runner','tech','spec','greet','mgr'],unl:['repair','support','table2','decor','flag'],auto:{cash:2,shelf:1}},
 {up:{spd:4,cap:4,chk:3,price:6},crew:['runner','tech','spec','greet','mgr'],unl:['repair','support','table2','decor','flag'],auto:{cash:3,shelf:2}},
 {up:{spd:5,cap:5,chk:4,price:8},crew:['runner','tech','spec','greet','mgr'],unl:['repair','support','table2','decor','flag'],auto:{cash:4,shelf:3}},
 {up:{spd:6,cap:6,chk:5,price:10},crew:['runner','tech','spec','greet','mgr'],unl:['repair','support','table2','decor','flag'],auto:{cash:5,shelf:4}}];
const STG=d=>d<4?0:d<8?1:d<11?2:d<15?3:d<19?4:5;
(async()=>{ L.prep(); const b=await L.launch('3d'); const out=[];
  for(const d of days){ const st=STG(d), P=PROG[st];
    const T=await L.open(b,'3d',{state:{day:d,curStage:st,up:P.up,unl:P.unl,auto:P.auto,dayStars:Array(d).fill(2),sysSeen:{1:1,2:1,3:1},reviews:[5,4,5,4,5,5,4,5,4,5],lp:{streak:0,best:0,chests:0,fever:0},boostD:mode==='boost'?d:-1,vipPass:mode==='vip'?1:0,ev:{[d]:''},
      crew:P.crew.map((r,i)=>({role:r,name:'직원'+i,spd:1.05,acc:0.92,wage:20,lv:Math.min(4,1+st),sat:80,hiredDay:0,face:i}))}});
    await T.toPreDay(); await T.click('dayGo'); await L.W(500);
    const info=await T.ev(()=>{ const c=window.__T.dayCfg(window.__H.S.day); return {goal:c.goal,dur:c.dur}; });
    await T.ev((GAP)=>{ window.__TS=4; const P=window.__T.player.pos; P.x=-6; P.z=-7; let acc=0;
      window.__simI=setInterval(()=>{ const T=window.__T, H=window.__H; if(T.st!=='run') return; const m=document.getElementById('modal');
        if(m.classList.contains('on')){ const q=document.querySelector('#mbox [data-ok]')||document.querySelector('#mbox [data-qa]'); if(q) q.click(); else m.classList.remove('on'); }
        acc+=0.25*4; if(acc<GAP) return; const wait=T.custs.filter(c=>(c.st==='wait'||c.st==='want')&&!c.claim); if(!wait.length) return; acc=0;
        wait.sort((a,b)=>(a.pat/a.patMax)-(b.pat/b.patMax)); const c=wait[0], g=T.dayCfg(H.S.day).goal;
        const pay={pick:30,buy:45,fix:40,sw:30,ret:25,tour:45,corp:Math.round(Math.min(680,Math.max(80,(T.baseGoal?T.baseGoal(H.S.day):g)*0.06))),esc:10}[c.type]||30; try{ H.serve(c,true,pay); }catch(e){} },250); },GAP);
    const t0=Date.now(); while(Date.now()-t0<info.dur/4*1000+40000){ await L.W(1000); if(await T.ev(()=>window.__T.st!=='run')) break; }
    const rev=await T.ev(()=>window.__T.rev); const r={mode,day:d+1,stage:st,goal:info.goal,rev,ratio:+(rev/info.goal).toFixed(2),errs:T.errs.length};
    console.log(JSON.stringify(r)); out.push(r); await T.close(); }
  await b.close(); })();
