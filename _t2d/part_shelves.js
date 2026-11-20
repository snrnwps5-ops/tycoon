/* ---- shelves (sources, 2D) ---- */
const SRC=[];
function addShelf(t,x,z,lock){ const initN=(S.shelf&&typeof S.shelf[t]==='number')?S.shelf[t]:4;
  const s={t:t,x:x,z:z,g:new THREE.Group(),n:initN,max:9,tt:0,sm:[],on:!lock,so:{visible:false}}; s.g.visible=!lock;
  ob(x-0.72,x+0.72,z-0.35,z+0.25); SRC.push(s); layoutSrc(s); return s; }
function layoutSrc(s){ if(s.so) s.so.visible=(s.n===0&&(S.inv[s.t]||0)<=0); }
/* v2.98: 18×18m 뒤벽 — 선반 중심 간격 2.6m (p/l/w | 엘리베이터 자리 | b/s/c) */
addShelf('p',-7.4,-9.9); addShelf('l',-4.8,-9.9); addShelf('w',-2.2,-9.9);
const SHB=addShelf('b',2.2,-9.9,true), SHS=addShelf('s',4.8,-9.9,true), SHC=addShelf('c',7.4,-9.9,true);
function fixPart(){ return STG>=1&&Math.random()<0.25?'c':Math.random()<0.55?'b':'s'; }
