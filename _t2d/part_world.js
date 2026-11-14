/* ---------- world (2D 평면도 데이터) ---------- */
var STX=6.6, EXPW=0; const OB=[]; const ob=(x1,x2,z1,z2)=>OB.push({x1:x1,x2:x2,z1:z1,z2:z2});
const STORE={x1:-7,x2:7,z1:-9,z2:6};
const WALLS=[[-7,-9,7,-9],[-7,-9,-7,6],[7,-9,7,6],[-7,6,-1.3,6],[1.3,6,7,6]];
WALLS.forEach(w=>{ const x1=w[0],z1=w[1],x2=w[2],z2=w[3];
  if(Math.abs(z2-z1)<0.01) ob(Math.min(x1,x2)-0.15,Math.max(x1,x2)+0.15,z1-0.18,z1+0.18);
  else ob(x1-0.18,x1+0.18,Math.min(z1,z2)-0.15,Math.max(z1,z2)+0.15); });
const WOOD=['#c8935a','#d6a76c','#d6a76c','#d9ae78','#cfa068','#dab07c'][STG], WOOD2=['#a8743e','#b98a52','#b98a52','#bf9058','#b08248','#c0925c'][STG], GLOW='#ffe9b8';
const FURN=[];
function furn(o){ FURN.push(o); }
function planterTree(x,z){ ob(x-0.8,x+0.8,z-0.8,z+0.8); furn({k:'tree',x:x,z:z,w:1.5,d:1.5}); }
/* 외곽 장식/차량 — 2D에서는 데이터만 유지 */
const cars=[];
/* 호환용 no-op 3D 헬퍼 (원본 로직이 그대로 호출합니다) */
function box(){ return new THREE.Group(); }
function cyl(){ return new THREE.Group(); }
function sph(){ return new THREE.Group(); }
function rbox(){ return new THREE.Group(); }
function glowStrip(){ return new THREE.Group(); }
function lightPool(){ return new THREE.Group(); }
function storeCounter(){}
function dispTable(){}
function floorPlane(){}
function wall(){}
function lightPool2(){}
const mat=function(){ return {}; };
const basic=function(){ return {}; };
function canvasTex(){ return {needsUpdate:false,repeat:{set(){}},wrapS:0,wrapT:0,anisotropy:0,clone:function(){return this;}}; }
