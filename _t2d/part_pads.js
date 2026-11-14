/* ---- unlock pads ---- */
const PADS=[
  {id:'table2',x:3.3,z:1.6,price:150,ic:'table',t:'체험 테이블 2',req:null},
  {id:'decor',x:5.0,z:3.6,price:550,ic:'star',t:'매장 꾸미기',req:'table2'},
  {id:'flag',x:0,z:2.6,price:1200,ic:'star',t:'플래그십 승격',req:'decor'}
];
PADS.forEach(p=>{ p.paid=(S.paid&&S.paid[p.id])||0; p.m={visible:false,scale:{set:function(){},setScalar:function(){}}}; p.tex={needsUpdate:false}; });
function drawPad(){}
function padVisible(p){ return !S.unl.includes(p.id)&&(!p.req||S.unl.includes(p.req)); }
function applyUnlocks(){ const U=id=>S.unl.includes(id);
  REPG.visible=U('repair'); SHB.g.visible=SHB.on=U('repair'); SHS.g.visible=SHS.on=U('repair'); SHC.g.visible=SHC.on=U('repair')&&STG>=1; SPOTS.filter(s=>s.type==='fix').forEach(s=>s.on=U('repair'));
  SUPG.visible=U('support'); SPOTS.filter(s=>s.type==='sw').forEach(s=>s.on=U('support'));
  T2.visible=U('table2'); SPOTS.filter(s=>s.type==='buy'&&s.x>2).forEach(s=>s.on=U('table2'));
  if(!U('repair')){ OB.forEach(b=>{ if(b.x1===3.95&&b.z1===-4.97) b.off=true; }); } else OB.forEach(b=>{ if(b.x1===3.95&&b.z1===-4.97) b.off=false; });
  buildDecor(); }
applyUnlocks();
