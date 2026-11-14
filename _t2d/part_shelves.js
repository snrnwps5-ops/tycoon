/* ---- shelves (sources, 2D) ---- */
const SRC=[];
function addShelf(t,x,z,lock){ const initN=(S.shelf&&typeof S.shelf[t]==='number')?S.shelf[t]:4;
  const s={t:t,x:x,z:z,g:new THREE.Group(),n:initN,max:9,tt:0,sm:[],on:!lock,so:{visible:false}}; s.g.visible=!lock;
  ob(x-0.72,x+0.72,z-0.35,z+0.25); SRC.push(s); layoutSrc(s); return s; }
function layoutSrc(s){ if(s.so) s.so.visible=(s.n===0&&(S.inv[s.t]||0)<=0); }
addShelf('p',-5.6,-8.4); addShelf('l',-4.0,-8.4); addShelf('w',-2.4,-8.4);
const SHB=addShelf('b',2.6,-8.4,true), SHS=addShelf('s',4.2,-8.4,true), SHC=addShelf('c',5.8,-8.4,true);
function fixPart(){ return STG>=1&&Math.random()<0.25?'c':Math.random()<0.55?'b':'s'; }
