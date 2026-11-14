/* ---------- 2D 탑다운 렌더러 (WebGL 없이 동작) ---------- */
const cv=$('c'), ctx2=cv.getContext('2d',{alpha:false});
const renderer={domElement:cv,setPixelRatio(){},setSize(){},shadowMap:{enabled:false,type:0},render(){ try{ draw2D(); }catch(e){ window.__ERR=(window.__ERR||[]); if(window.__ERR.length<6) window.__ERR.push('draw:'+((e&&e.message)||e)); } }};
const scene=new THREE.Scene(); scene.background=new THREE.Color(THM.ground);
const cam=new THREE.OrthographicCamera(); cam.position=new THREE.Vector3(0,20,0); cam.zoom=1;
const CAM_OFF=new THREE.Vector3(0,20,0);
const gget=(k,f)=>f?f():null;
const sun={position:new THREE.Vector3(),target:{position:new THREE.Vector3()}};
const VIEW={x:0,z:-1.5,s:40,zoom:1,W:0,H:0,cx:0,cy:0};
let VW=0,VH=0; /* v2.17: 3D 공용 place()/lbPlace()가 쓰는 화면 크기 */
const ZOOMS=[1,1.55,2.2]; let ZOOMI=0;
/* ---- v2.5: 카메라 시점 제어 (2D) — 전체 보기 = 매장 전체(ZOOMI 0), 기본 = 플레이어 추적(ZOOMI 1) ---- */
let CAMPZ=1;
function camFullPose(full,pz){ CAMPZ=pz||1; ZOOMI=0; }   // 2D는 항상 매장 전체 기준 + 핀치 배율만 적용
/* ---- v2.5: 인테리어(바닥·벽) 색 적용 ---- */
let TSBASE=null;
function intPaint2(){ if(!TSBASE) TSBASE={floor:TS.floor.slice(),cap:TS.cap,wall:TS.wall.slice()};
  const on=S.unl.includes('decor');
  const f=on?INTSHOP.floor.find(x=>x.k===intView().floor):null;
  TS.floor=(f&&f.t)?f.t.slice():TSBASE.floor.slice();
  const w=on?INTSHOP.wall.find(x=>x.k===intView().wall):null;
  TS.cap=(w&&w.t)?w.t[0]:TSBASE.cap;
}
function fitScale(){ const W=innerWidth,H=innerHeight;
  const top=Math.min(176,H*0.20), bot=Math.min(96,H*0.11), usable=Math.max(120,H-top-bot);
  VIEW.cx=W/2; VIEW.cy=top+usable/2;
  return Math.max(17,Math.min(112,Math.min((W-20)/15.6,usable/15.8))); }
function resize(){ const W=innerWidth,H=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
  cv.width=Math.max(1,Math.round(W*dpr)); cv.height=Math.max(1,Math.round(H*dpr)); cv.style.width=W+'px'; cv.style.height=H+'px';
  ctx2.setTransform(dpr,0,0,dpr,0,0); VIEW.W=W; VIEW.H=H; VIEW.s=fitScale(); VW=W; VH=H; }
addEventListener('resize',resize); resize();
window.__proj=function(x,y,z){ const s=VIEW.s*VIEW.zoom,W=VIEW.W||1,H=VIEW.H||1;
  return { x:((VIEW.cx+(x-VIEW.x)*s)/W)*2-1, y:1-((VIEW.cy+(z-VIEW.z)*s-(y||0)*s*0.62)/H)*2 }; };

/* ---- 그리기 도우미 ---- */
function SX(x,z){ const s=VIEW.s*VIEW.zoom; return {x:VIEW.cx+(x-VIEW.x)*s, y:VIEW.cy+(z-VIEW.z)*s, s:s}; }
function rrect(g,x,y,w,h,r){ r=Math.max(0,Math.min(r,w/2,h/2)); g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function quad(x,z,w,d,c,stroke,r){ const p=SX(x-w/2,z-d/2), s=p.s; rrect(ctx2,p.x,p.y,w*s,d*s,r==null?Math.max(2,0.08*s):r); if(c){ ctx2.fillStyle=c; ctx2.fill(); } if(stroke){ ctx2.lineWidth=Math.max(1,s*0.04); ctx2.strokeStyle=stroke; ctx2.stroke(); } }
function ctext(t,x,z,size,color,bold,dy){ const p=SX(x,z); ctx2.font=(bold===false?'800 ':'900 ')+Math.max(8,size)+'px "Noto Sans KR",sans-serif'; ctx2.textAlign='center'; ctx2.textBaseline='middle'; ctx2.fillStyle=color; ctx2.fillText(t,p.x,p.y+(dy||0)); }
function circ(x,z,r,c,stroke,lw){ const p=SX(x,z), s=p.s; ctx2.beginPath(); ctx2.arc(p.x,p.y,Math.max(2,r*s),0,Math.PI*2); if(c){ ctx2.fillStyle=c; ctx2.fill(); } if(stroke){ ctx2.lineWidth=lw||Math.max(1,s*0.05); ctx2.strokeStyle=stroke; ctx2.stroke(); } }

/* ---- 2D 배경 / 매장 ---- */
function drawOutside(){
  const a=SX(-30,-14), b=SX(30,20);
  ctx2.fillStyle=TS.ground; ctx2.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);
  const r1=SX(-30,6), r2=SX(30,19);
  ctx2.fillStyle='#9aa2ad'; ctx2.fillRect(r1.x,r1.y,r2.x-r1.x,r2.y-r1.y);
  const d1=SX(-30,9.6), d2=SX(30,13.6);
  ctx2.fillStyle='#4a4f5c'; ctx2.fillRect(d1.x,d1.y,d2.x-d1.x,d2.y-d1.y);
  ctx2.fillStyle='#ffffff'; for(let x=-28;x<=28;x+=4){ const q=SX(x-0.7,11.6); ctx2.fillRect(q.x,q.y,1.4*q.s,0.14*q.s); }
  const g1=SX(-30,-14), g2=SX(30,-9.15);
  ctx2.fillStyle='#8a9099'; ctx2.fillRect(g1.x,g1.y,g2.x-g1.x,g2.y-g1.y); /* v2.12: 매장 뒤 잔디 -> 보도 포장(3D와 동일) */
}
function drawFloor(){
  const p0=SX(-7,-9), p1=SX(7,6);
  ctx2.fillStyle=TS.floor[0]; ctx2.fillRect(p0.x,p0.y,p1.x-p0.x,p1.y-p0.y);
  ctx2.fillStyle=TS.floor[1]; ctx2.globalAlpha=0.28;
  for(let x=-7;x<7;x++) for(let z=-9;z<6;z++){ if(((x+z)&1)===0) continue; const q=SX(x,z); ctx2.fillRect(q.x,q.y,q.s+1,q.s+1); }
  ctx2.globalAlpha=1;
  ctx2.strokeStyle='rgba(0,0,0,.08)'; ctx2.lineWidth=1;
  for(let x=-7;x<=7;x++){ const q=SX(x,-9), q2=SX(x,6); ctx2.beginPath(); ctx2.moveTo(q.x,q.y); ctx2.lineTo(q2.x,q2.y); ctx2.stroke(); }
  for(let z=-9;z<=6;z++){ const q=SX(-7,z), q2=SX(7,z); ctx2.beginPath(); ctx2.moveTo(q.x,q.y); ctx2.lineTo(q2.x,q2.y); ctx2.stroke(); }
  quad(-4.0,-7.75,5.8,2.3,'rgba(255,255,255,.35)',null,2);
  quad(0,5.8,2.5,0.8,'#2f6fd8','#ffffff',4);
  ctext('입구',0,5.8,Math.max(9,VIEW.s*VIEW.zoom*0.3),'#ffffff',true);
  // 매장 간판은 화면 상단 HUD 칩으로 표시 (2D 뷰와 겹치지 않게)
}
function drawWalls(){
  for(const w of WALLS){
    const a=SX(w[0],w[1]), b=SX(w[2],w[3]);
    ctx2.lineCap='round';
    ctx2.strokeStyle='#ffffff'; ctx2.lineWidth=Math.max(6,0.30*a.s);
    ctx2.beginPath(); ctx2.moveTo(a.x,a.y); ctx2.lineTo(b.x,b.y); ctx2.stroke();
    ctx2.strokeStyle=TS.cap; ctx2.lineWidth=Math.max(4,0.20*a.s);
    ctx2.beginPath(); ctx2.moveTo(a.x,a.y); ctx2.lineTo(b.x,b.y); ctx2.stroke();
  }
}
function drawFurn(f){
  const s=SX(0,0).s;
  if(f.k==='tree'){ circ(f.x,f.z,f.w*0.5,'#3f8a3a','rgba(0,0,0,.15)'); circ(f.x,f.z,f.w*0.32,'#4aae36'); return; }
  if(f.k==='table'){ quad(f.x,f.z,f.w,f.d,WOOD,'#8a5a30',0); quad(f.x,f.z,f.w*0.8,f.d*0.6,'rgba(255,255,255,.25)',null,0); if(f.label) ctext(f.label,f.x,f.z-0.02,Math.max(8,s*0.2),'#5a3a20',true); return; }
  quad(f.x,f.z,f.w,f.d,f.c||'#f4f5f7','#9aa3b0',0);
  if(f.label) ctext(f.label,f.x,f.z,Math.max(8,s*0.2),(f.dark?'#ffffff':'#2a3144'),true);
}
function drawShelf(x){
  const s=SX(0,0).s;
  if(!x.on){ quad(x.x,x.z,1.4,0.72,'rgba(120,130,145,.45)','#8a96a8',0); ctext('잠김',x.x,x.z,Math.max(8,s*0.22),'#ffffff'); return; }
  const out=(x.n===0&&(S.inv[x.t]||0)<=0);
  const col=out?'#e8342a':('bsc'.includes(x.t)?'#2a8a3a':'#2f6fd8');
  quad(x.x,x.z,1.4,0.72,'#fbf4e4',col,0);
  quad(x.x-0.44,x.z,0.46,0.44,IT[x.t].c,'#ffffff',2);
  ctext(IT[x.t].n,x.x+0.06,x.z-0.12,Math.max(9,s*0.24),'#1d2433',true);
  ctext(out?'품절':(x.n+' / '+x.max),x.x+0.06,x.z+0.16,Math.max(10,s*0.28),x.n===0?'#e8342a':'#1d7a2a',true);
}
function drawPad2(p){
  const s=SX(0,0).s;
  circ(p.x,p.z,0.52,'rgba(70,224,90,.22)','#2faa45');
  ctext('결제',p.x,p.z-0.18,Math.max(8,s*0.18),'#1d5a2a',true);
  ctext('$'+Math.max(0,Math.ceil(p.price-p.paid)),p.x,p.z+0.18,Math.max(9,s*0.22),'#1d5a2a',true);
}
function drawSpot(sp){
  const col=SPOTCOL[sp.type]; if(!col) return;
  const s=SX(0,0).s;
  circ(sp.x,sp.z,0.35,sp.occ?'rgba(255,255,255,.45)':'rgba(255,255,255,.18)',col);
  ctext(({pick:'픽',buy:'구',fix:'수',sw:'상'}[sp.type]||''),sp.x,sp.z,Math.max(8,s*0.2),col,true);
  if(!sp.on){ const p=SX(sp.x,sp.z); ctx2.strokeStyle='#5a6578'; ctx2.lineWidth=2; ctx2.beginPath(); ctx2.moveTo(p.x-0.25*s,p.y-0.25*s); ctx2.lineTo(p.x+0.25*s,p.y+0.25*s); ctx2.stroke(); }
}
function drawZoneText(){
  const s=SX(0,0).s;
  ctext('진열대 · 재고',-4.0,-6.6,Math.max(9,s*0.24),'rgba(255,255,255,.95)',true);
  if(REPG.visible) ctext('수리 센터',5.0,-4.6,Math.max(9,s*0.22),'#ffffff',true);
  if(SUPG.visible) ctext('소프트웨어 상담',0.4,-5.3,Math.max(8,s*0.2),'#ffffff',true);
  ctext('픽업 카운터',-5.2,-2.6,Math.max(8,s*0.18),'#ffffff',true);
  ctext('계산대',2.8,2.6,Math.max(9,s*0.2),'#2a3144',true);
  ctext('입구 안내',-1.6,4.0,Math.max(8,s*0.2),'#ffffff',true);
  ctext('출고 박스',DOCK.x,DOCK.z,Math.max(8,s*0.18),'#7a4a20',true);
  ctext('물류 지원',-5.2,-5.55,Math.max(8,s*0.18),'#0b6e5c',true);
  ctext('창고',6.15,-2.0,Math.max(8,s*0.18),'#0b6e5c',true);
}
function drawActors(){
  const s=SX(0,0).s;
  const EMO={fix:'🔧',sw:'💬',pick:'📦',buy:'🛍',tour:'✈️',corp:'💼',esc:'😡',ret:'♻️'};
  for(const c of custs){
    const p=SX(c.pos.x,c.pos.z);
    const col=c.vip?'#ffd23f':c.influ?'#ff5ab8':c.flight?'#5ad1ff':c.tough?'#ff4a3a':(c.type==='buy'?'#2f6fd8':c.type==='pick'?'#ff9a1a':c.type==='fix'?'#2faa45':c.type==='sw'?'#7a4ad6':c.type==='ret'?'#e8508f':'#46b37a');
    ctx2.beginPath(); ctx2.arc(p.x,p.y,0.34*s,0,Math.PI*2); ctx2.fillStyle=col; ctx2.fill(); ctx2.lineWidth=Math.max(2,s*0.05); ctx2.strokeStyle='#ffffff'; ctx2.stroke();
    if(c.patMax){ const f=Math.max(0,Math.min(1,c.pat/c.patMax)); ctx2.beginPath(); ctx2.arc(p.x,p.y,0.45*s,-Math.PI/2,-Math.PI/2+f*Math.PI*2); ctx2.lineWidth=Math.max(2,s*0.07); ctx2.strokeStyle=f>0.5?'#46c95a':f>0.25?'#ffb020':'#e8342a'; ctx2.stroke(); }
    /* v2.7: 캐릭터별 헤어 컬러 · 액세서리 포인트 (3D 외형과 맞춤) */
    { const LK=c.ch&&c.ch.look, HR=c.ch&&c.ch.hair;
      if(HR){ ctx2.beginPath(); ctx2.arc(p.x,p.y,0.30*s,Math.PI*1.12,Math.PI*1.88); ctx2.lineWidth=Math.max(2,0.10*s); ctx2.strokeStyle=HR; ctx2.stroke(); }
      if(LK){ const ac=LK.acc;
        if(ac==='beanie'){ ctx2.beginPath(); ctx2.arc(p.x,p.y-0.05*s,0.27*s,Math.PI,Math.PI*2); ctx2.fillStyle=LK.c1||'#b07aff'; ctx2.fill(); }
        else if(ac==='cap'){ ctx2.beginPath(); ctx2.arc(p.x,p.y-0.06*s,0.26*s,Math.PI,Math.PI*2); ctx2.fillStyle=LK.c1||'#e8473d'; ctx2.fill();
          ctx2.fillRect(p.x-0.24*s,p.y-0.03*s,0.48*s,0.05*s); }
        else if(ac==='phones'){ [-1,1].forEach(function(k){ ctx2.beginPath(); ctx2.arc(p.x+k*0.30*s,p.y,0.075*s,0,6.3); ctx2.fillStyle=LK.c1||'#2f3442'; ctx2.fill(); }); }
        else if(ac==='glasses'||ac==='sun'){ [-1,1].forEach(function(k){ ctx2.beginPath(); ctx2.arc(p.x+k*0.13*s,p.y-0.02*s,0.07*s,0,6.3); ctx2.fillStyle=ac==='sun'?'#14161d':'#1d2433'; ctx2.fill(); }); }
        else if(ac==='backpack'){ ctx2.fillStyle=LK.c1||'#4a7bd0'; rrect(ctx2,p.x-0.10*s,p.y+0.22*s,0.20*s,0.13*s,3); ctx2.fill(); }
        else if(ac==='tote'){ ctx2.fillStyle=LK.c1||'#a8743e'; rrect(ctx2,p.x+0.23*s,p.y-0.02*s,0.13*s,0.17*s,3); ctx2.fill(); }
      } }
    ctx2.font=Math.max(9,0.3*s)+'px sans-serif'; ctx2.textAlign='center'; ctx2.textBaseline='middle'; ctx2.fillText(EMO[c.type]||'🙂',p.x,p.y+1);
    if(c.claim){ ctx2.beginPath(); ctx2.arc(p.x,p.y,0.5*s,0,Math.PI*2); ctx2.lineWidth=2; ctx2.strokeStyle='rgba(255,255,255,.7)'; ctx2.stroke(); }
  }
  for(const st of staff){
    const p=SX(st.pos.x,st.pos.z);
    circ(st.pos.x,st.pos.z,0.33,ROLES[st.kind].c,'#ffffff');
    ctx2.font='900 '+Math.max(9,0.26*s)+'px "Noto Sans KR",sans-serif'; ctx2.textAlign='center'; ctx2.textBaseline='middle'; ctx2.fillStyle='#ffffff'; ctx2.fillText(ROLES[st.kind].ic,p.x,p.y+1);
  }
  const pp=SX(player.pos.x,player.pos.z);
  ctx2.beginPath(); ctx2.ellipse(pp.x,pp.y+0.08*s,0.46*s,0.28*s,0,0,Math.PI*2); ctx2.fillStyle='rgba(0,0,0,.22)'; ctx2.fill();
  ctx2.beginPath(); ctx2.arc(pp.x,pp.y,0.4*s,0,Math.PI*2); ctx2.fillStyle='#1d2433'; ctx2.fill(); ctx2.lineWidth=Math.max(3,s*0.06); ctx2.strokeStyle='#ffd23f'; ctx2.stroke();
  const a=player.face||0, ax=Math.sin(a), az=Math.cos(a);
  ctx2.beginPath(); ctx2.moveTo(pp.x+ax*0.46*s,pp.y+az*0.46*s); ctx2.lineTo(pp.x+Math.cos(a)*0.18*s-ax*0.12*s,pp.y-Math.sin(a)*0.18*s-az*0.12*s); ctx2.lineTo(pp.x-Math.cos(a)*0.18*s-ax*0.12*s,pp.y+Math.sin(a)*0.18*s-az*0.12*s); ctx2.closePath(); ctx2.fillStyle='#ffd23f'; ctx2.fill();
  ctx2.font='900 '+Math.max(9,0.24*s)+'px "Noto Sans KR",sans-serif'; ctx2.textAlign='center'; ctx2.textBaseline='middle'; ctx2.fillStyle='#ffffff'; ctx2.fillText('사장',pp.x,pp.y+0.02*s);
  if(player.stack&&player.stack.length){ const by=pp.y-0.68*s;
    ctx2.fillStyle='rgba(29,36,51,.92)'; rrect(ctx2,pp.x-0.32*s,by-0.14*s,0.64*s,0.28*s,6); ctx2.fill();
    ctx2.fillStyle='#ffd23f'; ctx2.font='900 '+Math.max(9,0.2*s)+'px "Noto Sans KR",sans-serif'; ctx2.fillText('📦 '+player.stack.length,pp.x,by); }
}
function drawFx(){
  const s=SX(0,0).s;
  for(const f of flyers){ const p=SX(f.obj.position.x,f.obj.position.z); ctx2.beginPath(); ctx2.arc(p.x,p.y,Math.max(2,0.12*s),0,Math.PI*2); ctx2.fillStyle='#ffd23f'; ctx2.fill(); ctx2.lineWidth=1; ctx2.strokeStyle='#1d2433'; ctx2.stroke(); }
  for(const q of parts){ const m=q.m; if(!m||!m.position) continue; const p=SX(m.position.x,m.position.z); const hex=(m.material&&m.material.color&&m.material.color.hex)?m.material.color.hex:'#ffd23f'; ctx2.globalAlpha=Math.max(0,Math.min(1,1-q.t)); ctx2.fillStyle=hex; const sz=Math.max(3,0.1*s); ctx2.fillRect(p.x-sz/2,p.y-sz/2-(m.position.y||0)*0.25*s,sz,sz); ctx2.globalAlpha=1; }
  if(cls&&clsRing.visible){ circ(CLSP.x,CLSP.z,0.62,'rgba(255,122,184,.22)','#ff7ab8'); ctext('클래스',CLSP.x,CLSP.z,Math.max(8,s*0.2),'#a02a60',true); }
  const gd=guide(); if(gd){ const p=SX(gd[0],gd[1]); const bob=Math.abs(Math.sin(performance.now()/300))*0.16*s;
    ctx2.beginPath(); ctx2.moveTo(p.x,p.y-0.95*s-bob); ctx2.lineTo(p.x-0.24*s,p.y-1.35*s-bob); ctx2.lineTo(p.x+0.24*s,p.y-1.35*s-bob); ctx2.closePath(); ctx2.fillStyle='#ffd23f'; ctx2.fill(); ctx2.lineWidth=2; ctx2.strokeStyle='#8a6a00'; ctx2.stroke(); }
}
let _frame=0;
function drawStatus(){
  if((_frame++ % 6)!==0) return;
  const nz=custs.filter(c=>c.st==='wait'||c.st==='want').length;
  const e=$('aiv'); if(e){ e.textContent=((window.__ERR&&window.__ERR.length)?('⚠️ '+window.__ERR[window.__ERR.length-1]+' (탭하면 지움)\n'):'')+'위치 x'+player.pos.x.toFixed(1)+' · z'+player.pos.z.toFixed(1)+'\n대기 손님 '+nz+'명 · 들기 '+player.stack.length+'/'+CAP()+(NAV.path.length?'\n➡️ 이동 중':''); }
  const db=$('diagB'); if(db){ const en=(window.__ERR&&window.__ERR.length)||0; db.textContent=en?('오류 '+en):'오류 0'; db.className=en?'bad':''; }
  const st=$('aistat'); if(st){ st.textContent=(dayState==='run'?'영업중':dayState==='end'?'마감':'준비')+' DAY '+(S.day+1); }
}
/* ---- v2.27: 인테리어 상점 바닥 패드(drawIntPad2) 제거 — 버튼(#intBtn)으로만 연다 ---- */
/* ---- v2.5: 배송 차량 2D 표시 ---- */
function drawTruck2(){ if(!TRUCK.jobs.length) return;
  for(const j of TRUCK.jobs){ if(j.delay>0) continue; const p=SX(j.x,j.z), s=p.s;
    ctx2.font='900 '+Math.max(16,s*(j.quick?0.7:1.4))+'px sans-serif'; ctx2.textAlign='center'; ctx2.textBaseline='middle';
    ctx2.fillText(j.quick?'🛵':'🚚',p.x,p.y-0.06*s); } }
function draw2D(){
  const W=VIEW.W,H=VIEW.H; if(!W||!H) return;
  VIEW.zoom=ZOOMS[ZOOMI]*CAMPZ;
  if(ZOOMI>0){ VIEW.x=player.pos.x; VIEW.z=player.pos.z; } else { VIEW.x=0; VIEW.z=-1.5; }
  const s=VIEW.s*VIEW.zoom;
  ctx2.setTransform(Math.min(devicePixelRatio||1,2),0,0,Math.min(devicePixelRatio||1,2),0,0);
  ctx2.fillStyle=TS.ground; ctx2.fillRect(0,0,W,H);
  drawOutside(); drawFloor(); drawWalls();
  for(const f of FURN) drawFurn(f);
  for(const x of SRC) drawShelf(x);
  for(const p of PADS){ if(padVisible(p)) drawPad2(p); }
  for(const sp of SPOTS) drawSpot(sp);
  drawZoneText();
  drawActors();
  drawTruck2();
  drawFx();
  drawStatus();
}

/* ---- AI 내비게이션 (A* 격자 경로) ---- */
const NAV={path:[],goal:null,stuckT:0,tries:0};
const GRID=0.35, GX0=-6.6, GZ0=-8.6, GX1=6.6, GZ1=5.6;
const GW=Math.round((GX1-GX0)/GRID)+1, GH=Math.round((GZ1-GZ0)/GRID)+1;
function blockedAt(x,z,pad){ pad=(pad==null)?0.30:pad;
  if(x<GX0-0.05||x>GX1+0.05||z<GZ0-0.05||z>GZ1+0.05) return true;
  for(let i=0;i<OB.length;i++){ const b=OB[i]; if(b.off) continue; if(x>b.x1-pad&&x<b.x2+pad&&z>b.z1-pad&&z<b.z2+pad) return true; }
  return false; }
function losPath(a,b){ const L=Math.hypot(b.x-a.x,b.z-a.z), n=Math.max(2,Math.ceil(L/0.16)); for(let i=1;i<n;i++){ const t=i/n; if(blockedAt(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,0.26)) return false; } return true; }
function findPath(x0,z0,x1,z1){
  const wx=i=>GX0+i*GRID, wz=j=>GZ0+j*GRID;
  const ci=v=>Math.max(0,Math.min(GW-1,Math.round((v-GX0)/GRID)));
  const cj=v=>Math.max(0,Math.min(GH-1,Math.round((v-GZ0)/GRID)));
  const free=new Uint8Array(GW*GH);
  for(let i=0;i<GW;i++) for(let j=0;j<GH;j++) free[j*GW+i]=blockedAt(wx(i),wz(j),0.26)?0:1;
  const near=(vx,vz)=>{ let bi=ci(vx), bj=cj(vz), bd=1e9;
    for(let i=0;i<GW;i++) for(let j=0;j<GH;j++){ if(!free[j*GW+i]) continue; const d=Math.hypot(wx(i)-vx,wz(j)-vz); if(d<bd){ bd=d; bi=i; bj=j; } }
    return {i:bi,j:bj,d:bd}; };
  let gi=ci(x1), gj=cj(z1);
  if(!free[gj*GW+gi]){ const n=near(x1,z1); if(n.d>2.4) return null; gi=n.i; gj=n.j; }
  let si=ci(x0), sj=cj(z0);
  if(!free[sj*GW+si]){ const n=near(x0,z0); si=n.i; sj=n.j; }
  const N=GW*GH, gS=new Float32Array(N), fS=new Float32Array(N), came=new Int32Array(N), inO=new Uint8Array(N);
  for(let k=0;k<N;k++){ gS[k]=1e9; came[k]=-1; }
  const start=sj*GW+si, goal=gj*GW+gi;
  gS[start]=0; fS[start]=Math.hypot(si-gi,sj-gj);
  const open=[start]; inO[start]=1; let guard=0;
  while(open.length&&guard++<24000){
    let bi=0; for(let k=1;k<open.length;k++) if(fS[open[k]]<fS[open[bi]]) bi=k;
    const cur=open.splice(bi,1)[0]; inO[cur]=0;
    if(cur===goal){ const pts=[]; let c=cur; while(c>=0){ const i=c%GW, j=(c-i)/GW; pts.push({x:wx(i),z:wz(j)}); c=came[c]; } pts.reverse(); pts.shift();
      const out=[]; let a={x:x0,z:z0};
      for(let k2=0;k2<pts.length;k2++){ let m=k2; for(let q=pts.length-1;q>k2;q--){ if(losPath(a,pts[q])){ m=q; break; } } out.push(pts[m]); a=pts[m]; }
      out.push({x:x1,z:z1}); return out; }
    const ci2=cur%GW, cj2=(cur-ci2)/GW;
    for(let d=-1;d<=1;d++) for(let e=-1;e<=1;e++){ if(!d&&!e) continue; const ni=ci2+d, nj=cj2+e; if(ni<0||nj<0||ni>=GW||nj>=GH) continue; const nk=nj*GW+ni; if(!free[nk]) continue;
      if(d&&e){ if(!free[cj2*GW+ci2+d]||!free[(cj2+e)*GW+ci2]) continue; }
      const ng=gS[cur]+((d&&e)?1.414:1); if(ng<gS[nk]){ gS[nk]=ng; fS[nk]=ng+Math.hypot(ni-gi,nj-gj); came[nk]=cur; if(!inO[nk]){ open.push(nk); inO[nk]=1; } } }
  }
  return null;
}
function navTo(x,z){ const path=findPath(player.pos.x,player.pos.z,x,z);
  if(!path||!path.length){ NAV.path=[]; NAV.goal=null; try{ toast('그 위치로 가는 길을 찾지 못했어요',2); }catch(e){} return false; }
  NAV.path=path; NAV.goal={x:x,z:z}; NAV.stuckT=0; NAV.tries=0; return true; }
function navStep(dt){
  if(!NAV.path.length) return null;
  const p=player.pos; let t=NAV.path[0]; let dx=t.x-p.x, dz=t.z-p.z, L=Math.hypot(dx,dz);
  if(L<0.3){ NAV.path.shift(); if(!NAV.path.length){ NAV.goal=null; return null; } t=NAV.path[0]; dx=t.x-p.x; dz=t.z-p.z; L=Math.hypot(dx,dz)||1; }
  NAV.stuckT+=dt;
  if(NAV.stuckT>2.0&&NAV.tries<2){ NAV.stuckT=0; NAV.tries++; if(NAV.goal){ const g=NAV.goal; const path=findPath(p.x,p.z,g.x,g.z); if(path&&path.length) NAV.path=path; else { NAV.path=[]; NAV.goal=null; return null; } } }
  return {ix:dx/L, iz:dz/L};
}
const GOTO={door:[-1.6,5.4],fix:[5.2,-3.1],sw:[0.4,-3.9],cash:[2.8,3.95],shelf:[-4.0,-7.55],restock:[5.9,-2.0]};
function nudge(dx,dz){ NAV.path=[]; NAV.goal=null; const q={x:player.pos.x,z:player.pos.z};
  for(let i=0;i<6;i++){ const t={x:q.x+dx*0.15,z:q.z+dz*0.15}; collide(t); const mv=Math.hypot(t.x-q.x,t.z-q.z); q.x=t.x; q.z=t.z; if(mv<0.005) break; }
  player.pos.x=q.x; player.pos.z=q.z; player.face=Math.atan2(dx,dz); }
function screenToWorld(cx,cy){ const s=VIEW.s*VIEW.zoom; return {x:VIEW.x+(cx-VIEW.cx)/s, z:VIEW.z+(cy-VIEW.cy)/s}; }
let _pd={x:0,y:0,t:0,id:null};
addEventListener('pointerdown',function(e){ if(e.target&&e.target.closest&&e.target.closest('button,#modal,#aip')) return; _pd={x:e.clientX,y:e.clientY,t:performance.now(),id:e.pointerId}; },true);
addEventListener('pointerup',function(e){ if(!_pd.id||e.pointerId!==_pd.id) return; const dt2=performance.now()-_pd.t, dist=Math.hypot(e.clientX-_pd.x,e.clientY-_pd.y); _pd.id=null;
  if(dt2>600||dist>12) return; if(e.target&&e.target.closest&&e.target.closest('button,#modal,#aip')) return;
  const p=screenToWorld(e.clientX,e.clientY); if(p.x<-6.6||p.x>6.6||p.z<-8.7||p.z>5.7) return; navTo(p.x,p.z); },true);
