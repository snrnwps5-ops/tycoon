/* ---------- characters (2D: 모델 없이 위치/색 데이터만) ---------- */
const CLIPS={}; let QH=2;
const SKINS=['#f7d2b5','#f2c7a0','#e8b48a','#c98d65','#9a6446'];
function playA(ch,n,f){ if(!ch.acts||!ch.acts[n]||ch.cur===n) return; ch.cur=n; }
function makeChar(model,o){ o=o||{};
  const g=new THREE.Group(), inner=new THREE.Group(); g.add(inner); scene.add(g);
  const skin=o.skin||SKINS[Math.floor(Math.random()*SKINS.length)];
  const ch={g:g,inner:inner,m:null,mixer:{update:function(){}},acts:{},cur:null,stackG:new THREE.Group(),jump:0,
    model:model||'Casual_Male',skin:skin,tint:o.tint||null,pants:o.pants||null,hat:o.hat||null,look:o.look||null,hair:o.hair||null};
  return ch; }
function animChar(ch,speed,dt,carry){ playA(ch,'Idle',0); if(ch.mixer) ch.mixer.update(dt);
  let y=0; if(ch.jump>0){ ch.jump=Math.max(0,ch.jump-dt*2.2); y=Math.sin((1-ch.jump)*Math.PI)*0.4; } ch.inner.position.y=y; }
